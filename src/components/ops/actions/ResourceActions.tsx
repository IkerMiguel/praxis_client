"use client";

import { useState } from 'react';
import { Ban, CheckCheck, Gavel, MessageSquarePlus, PackagePlus, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ReasonDialog from '@/components/ui/ReasonDialog';
import { opsService } from '@/services/opsService';
import { formatMoney } from '@/lib/format';
import type { SolicitudRecursos } from '@/types/ops';
import { ActionButton, ActionGroup, FormError, ScheduleFields, TextArea, hasRole, scheduleValid, useSubmit, type ActionContext } from './ActionKit';
import DictamenForm from '../DictamenForm';

type Dialog = 'solicitar' | 'confirmar' | 'seguimiento' | 'anular' | 'dictamen' | null;

/** Recursos, autorizaciones y anulación administrativa (E08: HU-8.1 a 8.4). */
export default function ResourceActions(ctx: ActionContext) {
  const { inc, role, onDone } = ctx;
  const [dialog, setDialog] = useState<Dialog>(null);
  const code = inc.estado.codigo;
  const coord = hasRole(role, 'R03');
  const authorizer = hasRole(role, 'R05', 'R03');
  const diagnosis = [...inc.diagnosticos].reverse().find((d) => d.estado === 'REGISTRADO');
  const pending = inc.solicitudes_recursos.find((s) => ['PENDIENTE_AUTORIZACION', 'PENDIENTE_RECURSOS'].includes(s.estado_solicitud));
  const awaitingAuth = inc.solicitudes_recursos.find((s) => s.estado_solicitud === 'PENDIENTE_AUTORIZACION');

  const items = [
    coord && code === 'E07' && diagnosis?.incidencia_confirmada && diagnosis.requiere_recursos && (
      <ActionButton key="s" icon={PackagePlus} tone="primary" label="Solicitar recursos" hint={diagnosis.requiere_autorizacion ? 'Requiere autorización presupuestal' : 'Materiales para la intervención'} onClick={() => setDialog('solicitar')} />
    ),
    authorizer && code === 'E08' && awaitingAuth && <ActionButton key="d" icon={Gavel} tone="primary" label="Emitir dictamen" hint={`Solicitud por ${formatMoney(awaitingAuth.costo_total_estimado)}`} onClick={() => setDialog('dictamen')} />,
    coord && code === 'E09' && <ActionButton key="c" icon={CheckCheck} tone="success" label="Confirmar recursos y programar" hint="Marca lo recibido y agenda" onClick={() => setDialog('confirmar')} />,
    coord && pending && <ActionButton key="n" icon={MessageSquarePlus} label="Nota de seguimiento" hint="Bitácora de la gestión (no cambia estado)" onClick={() => setDialog('seguimiento')} />,
    coord && ['E08', 'E09', 'E18'].includes(code) && <ActionButton key="a" icon={Ban} label="Anular incidencia" hint="Cancelación administrativa por imposibilidad" onClick={() => setDialog('anular')} />,
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <ActionGroup title="Recursos y autorizaciones">
      {items}
      <RequestDialog open={dialog === 'solicitar'} onClose={() => setDialog(null)} ctx={ctx} needsAuth={Boolean(diagnosis?.requiere_autorizacion)} />
      {pending && <ConfirmResourcesDialog open={dialog === 'confirmar'} onClose={() => setDialog(null)} ctx={ctx} solicitud={pending} />}
      {awaitingAuth && (
        <Modal open={dialog === 'dictamen'} onClose={() => setDialog(null)} size="lg" icon={<Gavel className="h-5 w-5" />} title="Dictamen de recursos" description={awaitingAuth.decision_requerida}>
          <DictamenForm
            solicitud={awaitingAuth}
            onDone={(message) => {
              setDialog(null);
              onDone(message);
            }}
          />
        </Modal>
      )}
      {pending && (
        <ReasonDialog
          open={dialog === 'seguimiento'}
          onClose={() => setDialog(null)}
          icon={<MessageSquarePlus className="h-5 w-5" />}
          title="Nota de seguimiento"
          description="Queda en la bitácora de la solicitud de recursos; no cambia el estado (RN-030)."
          label="Comentario"
          placeholder="Ej.: el proveedor confirmó la entrega para el jueves"
          min={5}
          confirmLabel="Guardar nota"
          onSubmit={(text) => opsService.seguimientoRecursos(pending.id, text)}
          onDone={() => onDone('Nota de seguimiento registrada.')}
        />
      )}
      <ReasonDialog
        open={dialog === 'anular'}
        onClose={() => setDialog(null)}
        icon={<Ban className="h-5 w-5 text-red-600" />}
        title="Anular incidencia"
        description="Cancelación administrativa por imposibilidad de atenderla. Se notifica al reportante."
        label="Motivo de la anulación"
        min={10}
        confirmLabel="Anular"
        tone="danger"
        onSubmit={(text) => opsService.anular(inc.id, text)}
        onDone={() => onDone('Incidencia anulada.')}
      />
    </ActionGroup>
  );
}

interface Item {
  recurso_nombre: string;
  cantidad: number;
  unidad: string;
  costo_estimado: string;
}

function RequestDialog({ open, onClose, ctx, needsAuth }: { open: boolean; onClose: () => void; ctx: ActionContext; needsAuth: boolean }) {
  const { inc, onDone } = ctx;
  const [decision, setDecision] = useState('');
  const [auth, setAuth] = useState(needsAuth);
  const [emergency, setEmergency] = useState(false);
  const [items, setItems] = useState<Item[]>([{ recurso_nombre: '', cantidad: 1, unidad: 'UND', costo_estimado: '' }]);
  const submit = useSubmit();
  const total = items.reduce((acc, i) => acc + (Number(i.costo_estimado) || 0) * i.cantidad, 0);
  const update = (i: number, patch: Partial<Item>) => setItems((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const save = async () => {
    if (decision.trim().length < 10) return submit.setError('Describe la decisión requerida (mínimo 10 caracteres).');
    if (items.some((i) => !i.recurso_nombre.trim() || !(i.cantidad > 0) || !i.unidad.trim())) return submit.setError('Completa nombre, cantidad y unidad de cada recurso.');
    const ok = await submit.run(() =>
      opsService.solicitarRecursos(inc.id, {
        decision_requerida: decision.trim(),
        requiere_autorizacion: auth,
        es_emergencia: emergency || undefined,
        items: items.map((i) => ({ recurso_nombre: i.recurso_nombre.trim(), cantidad: i.cantidad, unidad: i.unidad.trim(), costo_estimado: i.costo_estimado ? Number(i.costo_estimado) : undefined })),
      }),
    );
    if (ok) {
      onClose();
      onDone(auth ? 'Solicitud enviada a autorización.' : 'Recursos solicitados: quedan pendientes de llegada.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="xl"
      icon={<PackagePlus className="h-5 w-5" />}
      title="Solicitar recursos para la intervención"
      description="Lista los materiales, repuestos o servicios que faltan."
      footer={
        <>
          <span className="mr-auto self-center text-sm text-slate-600">
            Total estimado: <span className="font-bold text-slate-900">{formatMoney(total)}</span>
          </span>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={submit.busy}>
            {submit.busy ? 'Enviando…' : auth ? 'Enviar a autorización' : 'Registrar solicitud'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <TextArea id="rq-decision" label="Decisión requerida" value={decision} onChange={setDecision} min={10} max={500} rows={2} placeholder="Ej.: aprobar la compra de un breaker de 20A y cable 12 AWG" />
        <div className="overflow-x-auto rounded-2xl border border-praxis-line">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] font-semibold text-slate-500">
                <th className="px-3 py-2">Recurso</th>
                <th className="w-24 px-3 py-2">Cantidad</th>
                <th className="w-24 px-3 py-2">Unidad</th>
                <th className="w-36 px-3 py-2">Costo unitario</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t border-praxis-line">
                  <td className="p-2">
                    <input aria-label="Recurso" className="field h-10" maxLength={150} value={item.recurso_nombre} onChange={(e) => update(i, { recurso_nombre: e.target.value })} />
                  </td>
                  <td className="p-2">
                    <input aria-label="Cantidad" type="number" min={1} className="field h-10" value={item.cantidad} onChange={(e) => update(i, { cantidad: Number(e.target.value) })} />
                  </td>
                  <td className="p-2">
                    <input aria-label="Unidad" className="field h-10" maxLength={20} value={item.unidad} onChange={(e) => update(i, { unidad: e.target.value })} />
                  </td>
                  <td className="p-2">
                    <input aria-label="Costo unitario" type="number" min={0} className="field h-10" value={item.costo_estimado} placeholder="0" onChange={(e) => update(i, { costo_estimado: e.target.value })} />
                  </td>
                  <td className="p-2">
                    <button type="button" aria-label="Quitar recurso" disabled={items.length === 1} onClick={() => setItems((l) => l.filter((_, j) => j !== i))} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30">
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => setItems((l) => [...l, { recurso_nombre: '', cantidad: 1, unidad: 'UND', costo_estimado: '' }])} className="flex w-full items-center justify-center gap-1.5 border-t border-praxis-line py-2.5 text-xs font-semibold text-sky-700 hover:bg-slate-50">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Agregar recurso
          </button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${auth ? 'border-amber-300 bg-amber-50' : 'border-praxis-line'}`}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-amber-600" checked={auth} onChange={(e) => setAuth(e.target.checked)} />
            <span>
              <span className="block font-semibold text-slate-900">Requiere autorización</span>
              <span className="text-xs text-slate-500">La envía a Autorizaciones (pendiente de autorización).</span>
            </span>
          </label>
          <label className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${!inc.protocolo_emergencia_activo ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${emergency ? 'border-red-300 bg-red-50' : 'border-praxis-line'}`}>
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-red-600" disabled={!inc.protocolo_emergencia_activo} checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
            <span>
              <span className="block font-semibold text-slate-900">Compra de emergencia</span>
              <span className="text-xs text-slate-500">{inc.protocolo_emergencia_activo ? 'Se regulariza después; no bloquea la programación.' : 'Solo con protocolo de emergencia activo.'}</span>
            </span>
          </label>
        </div>
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}

function ConfirmResourcesDialog({ open, onClose, ctx, solicitud }: { open: boolean; onClose: () => void; ctx: ActionContext; solicitud: SolicitudRecursos }) {
  const { inc, onDone } = ctx;
  const [arrived, setArrived] = useState<number[]>(solicitud.detalles.filter((d) => d.disponible).map((d) => d.id));
  const [value, setValue] = useState({ fecha_programada: '', hora_inicio: '', hora_fin: '', cuadrilla: '' });
  const submit = useSubmit();
  const all = arrived.length === solicitud.detalles.length;

  const save = async () => {
    const invalid = scheduleValid(value);
    if (invalid) return submit.setError(invalid);
    if (!all) return submit.setError('Todos los recursos deben estar disponibles para programar.');
    if (await submit.run(() => opsService.confirmarRecursos(inc.id, { ...value, cuadrilla: value.cuadrilla || undefined, todos_disponibles: true }))) {
      onClose();
      onDone('Recursos confirmados e intervención programada.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<CheckCheck className="h-5 w-5" />}
      title="Recepción de recursos"
      description="Marca lo que llegó y programa la intervención."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={submit.busy || !all}>
            {submit.busy ? 'Guardando…' : 'Confirmar y programar'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <ul className="space-y-2">
          {solicitud.detalles.map((d) => (
            <li key={d.id}>
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${arrived.includes(d.id) ? 'border-emerald-300 bg-emerald-50' : 'border-praxis-line'}`}>
                <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={arrived.includes(d.id)} onChange={(e) => setArrived((l) => (e.target.checked ? [...l, d.id] : l.filter((x) => x !== d.id)))} />
                <span className="flex-1 font-medium text-slate-800">{d.recurso_nombre}</span>
                <span className="text-slate-500">
                  {d.cantidad} {d.unidad}
                </span>
              </label>
            </li>
          ))}
        </ul>
        <ScheduleFields value={value} onChange={(v) => setValue({ ...value, ...v, cuadrilla: v.cuadrilla ?? '' })} />
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}
