"use client";

import { useState } from 'react';
import { motion } from 'motion/react';
import { CalendarClock, ClipboardCheck, Lock, Plus, ShieldCheck, ShieldX, X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ReasonDialog from '@/components/ui/ReasonDialog';
import { opsService } from '@/services/opsService';
import BeforeAfter from '../BeforeAfter';
import { ActionButton, ActionGroup, FormError, ScheduleFields, TextArea, hasRole, scheduleValid, useSubmit, type ActionContext } from './ActionKit';

type Dialog = 'verificar' | 'corregir' | 'cerrar' | null;

const DEFAULT_CRITERIA = ['El daño reportado quedó resuelto', 'El área quedó limpia y segura', 'Los materiales instalados son adecuados', 'Funciona correctamente en la prueba'];

/** Verificación de calidad, corrección y cierre (E09: HU-9.1 a 9.3). */
export default function VerificationActions(ctx: ActionContext) {
  const { inc, role, onDone } = ctx;
  const [dialog, setDialog] = useState<Dialog>(null);
  const code = inc.estado.codigo;
  const verifier = hasRole(role, 'R06');
  const coord = hasRole(role, 'R03');
  const lastRejection = [...inc.verificaciones].reverse().find((v) => !v.resultado_conforme);

  const items = [
    verifier && code === 'E12' && <ActionButton key="v" icon={ClipboardCheck} tone="primary" label="Verificar calidad" hint="Antes/después y checklist de criterios" onClick={() => setDialog('verificar')} />,
    coord && code === 'E13' && <ActionButton key="c" icon={CalendarClock} tone="primary" label="Planificar corrección" hint={lastRejection?.correccion_requerida ?? 'Programa el reproceso'} onClick={() => setDialog('corregir')} />,
    coord && code === 'E14' && <ActionButton key="a" icon={Lock} label="Cierre administrativo" hint="Solo si venció el plazo de confirmación" onClick={() => setDialog('cerrar')} />,
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <ActionGroup title="Calidad y cierre">
      {items}
      <QualityReview open={dialog === 'verificar'} onClose={() => setDialog(null)} ctx={ctx} />
      <CorrectionDialog open={dialog === 'corregir'} onClose={() => setDialog(null)} ctx={ctx} />
      <ReasonDialog
        open={dialog === 'cerrar'}
        onClose={() => setDialog(null)}
        icon={<Lock className="h-5 w-5" />}
        title="Cierre administrativo"
        description="Cierra la incidencia por inactividad del reportante cuando venció el plazo para confirmar la solución."
        label="Notas del cierre"
        min={0}
        confirmLabel="Cerrar incidencia"
        tone="dark"
        onSubmit={(text) => opsService.cierreAdministrativo(inc.id, text || undefined)}
        onDone={() => onDone('Incidencia cerrada administrativamente.')}
      />
    </ActionGroup>
  );
}

/** Revisión de calidad con comparador y checklist; conforme o no conforme (HU-9.1, 9.2, KAN-267/272). */
function QualityReview({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA.map((criterio) => ({ criterio, cumple: true })));
  const [extra, setExtra] = useState('');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [correction, setCorrection] = useState('');
  const submit = useSubmit();
  const conforming = criteria.every((c) => c.cumple);
  const activity = inc.actividades.at(-1);

  const save = async () => {
    if (!conforming && (reason.trim().length < 10 || correction.trim().length < 10)) return submit.setError('Indica el motivo del rechazo y la corrección requerida (mínimo 10 caracteres cada uno).');
    const ok = await submit.run(() =>
      conforming
        ? opsService.verificar(inc.id, { criterios: criteria, observaciones: notes.trim() || undefined })
        : opsService.rechazarVerificacion(inc.id, { criterios: criteria, observaciones: notes.trim() || undefined, motivo_rechazo: reason.trim(), correccion_requerida: correction.trim() }),
    );
    if (ok) {
      onClose();
      onDone(conforming ? 'Verificación conforme registrada.' : 'Verificación no conforme: la incidencia vuelve a corrección.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="xl"
      icon={<ClipboardCheck className="h-5 w-5" />}
      title="Verificación de calidad"
      description={`${inc.codigo_ticket} · ${inc.resumen}`}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className={conforming ? 'btn-primary bg-none bg-emerald-600 hover:bg-emerald-500' : 'btn-danger'} onClick={save} disabled={submit.busy}>
            {conforming ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <ShieldX className="h-4 w-4" aria-hidden="true" />}
            {submit.busy ? 'Guardando…' : conforming ? 'Dictaminar conforme' : 'Dictaminar no conforme'}
          </button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <BeforeAfter before={inc.evidencias.filter((e) => e.etapa === 'REPORTE' || e.etapa === 'INSPECCION')} after={inc.evidencias.filter((e) => e.etapa === 'EJECUCION')} />
          {activity?.actividades_realizadas && (
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="text-xs font-semibold text-slate-500">Lo que reportó el técnico</p>
              <p className="mt-1 text-slate-700">{activity.actividades_realizadas}</p>
            </div>
          )}
        </div>
        <div className="space-y-4">
          <div>
            <p className="field-label">Checklist de calidad</p>
            <ul className="space-y-2">
              {criteria.map((c, i) => (
                <li key={c.criterio} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-slate-800">{c.criterio}</span>
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5" role="group" aria-label={c.criterio}>
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        type="button"
                        aria-pressed={c.cumple === v}
                        onClick={() => setCriteria((list) => list.map((x, j) => (j === i ? { ...x, cumple: v } : x)))}
                        className={`relative rounded-md px-2.5 py-1 text-xs font-bold transition ${c.cumple === v ? 'text-white' : 'text-slate-500'}`}
                      >
                        {c.cumple === v && <motion.span layoutId={`crit-${i}`} className={`absolute inset-0 rounded-md ${v ? 'bg-emerald-600' : 'bg-red-600'}`} />}
                        <span className="relative">{v ? 'Cumple' : 'No'}</span>
                      </button>
                    ))}
                  </div>
                  {i >= DEFAULT_CRITERIA.length && (
                    <button type="button" aria-label="Quitar criterio" onClick={() => setCriteria((l) => l.filter((_, j) => j !== i))} className="p-1 text-slate-400 hover:text-red-500">
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (extra.trim() && !criteria.some((c) => c.criterio === extra.trim())) setCriteria((l) => [...l, { criterio: extra.trim().slice(0, 200), cumple: true }]);
                setExtra('');
              }}
            >
              <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Agregar criterio" aria-label="Nuevo criterio" className="field h-9 text-xs" />
              <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </form>
          </div>
          <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${conforming ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
            {conforming ? 'Resultado: conforme. Pasa a confirmación del reportante o se cierra, según la categoría.' : 'Resultado: no conforme. Vuelve a corrección y suma un reproceso.'}
          </div>
          {!conforming && (
            <>
              <TextArea id="vf-reason" label="Motivo del rechazo" value={reason} onChange={setReason} min={10} max={1000} rows={2} />
              <TextArea id="vf-fix" label="Corrección requerida" value={correction} onChange={setCorrection} min={10} max={1000} rows={2} />
            </>
          )}
          <TextArea id="vf-notes" label="Observaciones" value={notes} onChange={setNotes} max={1000} optional rows={2} />
          <FormError message={submit.error} />
        </div>
      </div>
    </Modal>
  );
}

function CorrectionDialog({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const [value, setValue] = useState({ fecha_programada: '', hora_inicio: '', hora_fin: '', cuadrilla: '' });
  const [notes, setNotes] = useState('');
  const submit = useSubmit();
  const rejection = [...inc.verificaciones].reverse().find((v) => !v.resultado_conforme);
  const save = async () => {
    const invalid = scheduleValid(value);
    if (invalid) return submit.setError(invalid);
    if (await submit.run(() => opsService.planificarCorreccion(inc.id, { ...value, cuadrilla: value.cuadrilla || undefined, observaciones: notes.trim() || undefined }))) {
      onClose();
      onDone('Corrección programada.');
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<CalendarClock className="h-5 w-5" />}
      title="Planificar corrección"
      description="Programa el reproceso con base en lo que pidió la verificación."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={submit.busy}>
            {submit.busy ? 'Guardando…' : 'Programar corrección'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {rejection && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">{rejection.motivo_rechazo}</p>
            <p className="mt-1">Corrección: {rejection.correccion_requerida}</p>
          </div>
        )}
        <ScheduleFields value={value} onChange={(v) => setValue({ ...value, ...v, cuadrilla: v.cuadrilla ?? '' })} />
        <TextArea id="cr-notes" label="Observaciones" value={notes} onChange={setNotes} max={1000} optional rows={2} />
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}
