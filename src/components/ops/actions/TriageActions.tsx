"use client";

import { useState } from 'react';
import { motion } from 'motion/react';
import { Ban, CheckCircle2, Copy, Gauge, Inbox, Link2, MessageSquareMore, ShieldAlert, Siren, XCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ReasonDialog from '@/components/ui/ReasonDialog';
import { StatusBadge } from '@/components/ui/Badges';
import { LoadingState } from '@/components/ui/States';
import { opsService } from '@/services/opsService';
import { useApiQuery } from '@/lib/useApiQuery';
import { formatRelative } from '@/lib/format';
import type { Nivel3, Urgencia } from '@/types/ops';
import PriorityMatrix from '../PriorityMatrix';
import { ActionButton, ActionGroup, FormError, TextArea, hasRole, useSubmit, type ActionContext } from './ActionKit';

type Dialog = 'aclaracion' | 'duplicados' | 'clasificar' | 'prioridad' | 'riesgo' | null;

/** Acciones de la mesa de ayuda sobre la ficha (E05: HU-5.1 a 5.4). */
export default function TriageActions(ctx: ActionContext) {
  const { inc, role, onDone } = ctx;
  const [dialog, setDialog] = useState<Dialog>(null);
  const start = useSubmit();
  const code = inc.estado.codigo;
  const isGestor = hasRole(role, 'R02');
  const inTriage = ['E01', 'E03', 'E04'].includes(code);
  const classified = Boolean(inc.prioridad) && !['E15', 'E16', 'E17'].includes(code);

  const canClarify = code === 'E03' && hasRole(role, 'R02', 'R03');
  const canPriority = classified && hasRole(role, 'R02', 'R03');
  if (!(isGestor && inTriage) && !canClarify && !canPriority) return null;

  return (
    <ActionGroup title="Mesa de ayuda · triaje">
      {code === 'E01' && isGestor && (
        <ActionButton
          icon={Inbox}
          tone="primary"
          label="Tomar para revisión"
          hint="Pasa la solicitud a En revisión"
          disabled={start.busy}
          onClick={() => start.run(() => opsService.iniciarRevision(inc.id)).then((ok) => ok && onDone('Tomaste la solicitud para revisión.'))}
        />
      )}
      {start.error && <FormError message={start.error} />}
      {isGestor && ['E03', 'E04'].includes(code) && <ActionButton icon={CheckCircle2} tone="primary" label="Clasificar procedencia" hint="Impacto × urgencia o no procedente" onClick={() => setDialog('clasificar')} />}
      {canClarify && <ActionButton icon={MessageSquareMore} label="Solicitar aclaración" hint="Pide información al reportante" onClick={() => setDialog('aclaracion')} />}
      {isGestor && inTriage && (
        <ActionButton
          icon={Copy}
          tone={inc.posible_duplicado ? 'warning' : 'neutral'}
          label="Revisar duplicados"
          hint={inc.posible_duplicado ? 'Marcada como posible duplicado' : 'Compara con solicitudes abiertas'}
          onClick={() => setDialog('duplicados')}
        />
      )}
      {isGestor && inTriage && <ActionButton icon={Siren} tone={inc.es_riesgo_inmediato ? 'danger' : 'neutral'} label="Evaluar riesgo" hint="Protocolo de emergencia" onClick={() => setDialog('riesgo')} />}
      {canPriority && <ActionButton icon={Gauge} label="Recalcular prioridad" hint="Queda registrado en el historial" onClick={() => setDialog('prioridad')} />}

      <ReasonDialog
        open={dialog === 'aclaracion'}
        onClose={() => setDialog(null)}
        icon={<MessageSquareMore className="h-5 w-5" />}
        title="Solicitar aclaración al reportante"
        description="La solicitud pasa a Pendiente de información y el reportante recibe una notificación con un plazo para responder."
        label="¿Qué información necesitas?"
        placeholder="Ej.: ¿La luminaria parpadea o está totalmente apagada? Adjunta una foto del tablero."
        min={10}
        confirmLabel="Enviar solicitud"
        tone="warning"
        onSubmit={(text) => opsService.solicitarAclaracion(inc.id, text)}
        onDone={() => onDone('Aclaración solicitada al reportante.')}
      />
      <DuplicateComparator open={dialog === 'duplicados'} onClose={() => setDialog(null)} ctx={ctx} />
      <ClassifyDialog open={dialog === 'clasificar'} onClose={() => setDialog(null)} ctx={ctx} />
      <PriorityDialog open={dialog === 'prioridad'} onClose={() => setDialog(null)} ctx={ctx} />
      <RiskDialog open={dialog === 'riesgo'} onClose={() => setDialog(null)} ctx={ctx} />
    </ActionGroup>
  );
}

/** Comparación lado a lado y vinculación formal de duplicados (HU-5.2, KAN-202). */
function DuplicateComparator({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const candidates = useApiQuery(open ? `duplicados:${inc.id}` : null, () => opsService.posiblesDuplicados(inc.id));
  const [selected, setSelected] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const submit = useSubmit();
  const list = candidates.data ?? [];
  const current = list.find((c) => c.id === selected) ?? list[0];

  const link = async () => {
    if (!current) return;
    if (await submit.run(() => opsService.vincularDuplicado(inc.id, current.id, notes.trim() || undefined))) {
      onClose();
      onDone(`Unificada con ${current.codigo_ticket}. El reportante seguirá la solicitud principal.`);
    }
  };
  const discard = async () => {
    if (await submit.run(() => opsService.descartarDuplicado(inc.id, notes.trim() || undefined))) {
      onClose();
      onDone('Se descartó la sugerencia de duplicado.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="xl"
      icon={<Copy className="h-5 w-5" />}
      title="Comparar posibles duplicados"
      description="Candidatos ponderados por ubicación, categoría y similitud de la descripción."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={discard} disabled={submit.busy}>
            <XCircle className="h-4 w-4" aria-hidden="true" />
            No es duplicado
          </button>
          <button type="button" className="btn-warning" onClick={link} disabled={submit.busy || !current}>
            <Link2 className="h-4 w-4" aria-hidden="true" />
            {current ? `Unificar con ${current.codigo_ticket}` : 'Unificar'}
          </button>
        </>
      }
    >
      {candidates.initialLoading ? (
        <LoadingState compact label="Buscando coincidencias" />
      ) : list.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No hay solicitudes abiertas parecidas. Puedes descartar la sugerencia.</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {list.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelected(c.id)}
                className={`rounded-xl border px-3 py-2 text-left text-xs transition ${current?.id === c.id ? 'border-praxis-blue bg-sky-50' : 'border-praxis-line hover:border-slate-300'}`}
              >
                <span className="font-mono font-bold text-slate-800">{c.codigo_ticket}</span>
                <span className={`ml-2 rounded-full px-1.5 py-0.5 font-bold ${c.puntaje >= 80 ? 'bg-red-100 text-red-700' : c.puntaje >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{c.puntaje}%</span>
              </button>
            ))}
          </div>
          {current && (
            <div className="grid gap-4 md:grid-cols-2">
              <CompareCard title="Esta solicitud" code={inc.codigo_ticket} resumen={inc.resumen} descripcion={inc.descripcion} espacio={inc.ubicacion.espacio?.nombre} categoria={inc.categoria?.nombre} fecha={inc.fecha_registro} estado={inc.estado} />
              <CompareCard title="Candidata a principal" code={current.codigo_ticket} resumen={current.resumen} descripcion={current.descripcion} espacio={current.espacio.nombre} categoria={current.categoria.nombre} fecha={current.fecha_registro} estado={current.estado} highlight />
            </div>
          )}
          {current && (
            <ul className="flex flex-wrap gap-2 text-xs">
              <Criterion ok={current.criterios.misma_ubicacion} label="Misma ubicación" />
              <Criterion ok={current.criterios.misma_categoria} label="Misma categoría" />
              <li className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">Similitud de descripción: {current.criterios.similitud_descripcion}%</li>
            </ul>
          )}
          <TextArea id="dup-notes" label="Observaciones" value={notes} onChange={setNotes} max={500} optional rows={2} />
          <FormError message={submit.error} />
        </div>
      )}
    </Modal>
  );
}

function Criterion({ ok, label }: { ok: boolean; label: string }) {
  return <li className={`rounded-full px-3 py-1 font-semibold ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500 line-through'}`}>{label}</li>;
}

function CompareCard(props: { title: string; code: string; resumen: string; descripcion: string; espacio?: string; categoria?: string; fecha: string; estado: { codigo: string; nombre: string }; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${props.highlight ? 'border-amber-300 bg-amber-50/50' : 'border-praxis-line bg-white'}`}>
      <p className="eyebrow">{props.title}</p>
      <p className="mt-2 flex items-center gap-2">
        <span className="font-mono text-sm font-bold text-slate-900">{props.code}</span>
        <StatusBadge code={props.estado.codigo} name={props.estado.nombre} />
      </p>
      <p className="mt-2 font-semibold text-slate-900">{props.resumen}</p>
      <p className="mt-1 text-xs text-slate-500">
        {props.espacio} · {props.categoria} · {formatRelative(props.fecha)}
      </p>
      <p className="mt-3 rounded-xl bg-white/80 p-3 text-sm leading-relaxed text-slate-700">{props.descripcion}</p>
    </div>
  );
}

/** Procedencia y prioridad por Impacto × Urgencia (HU-5.3). */
function ClassifyDialog({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const [procedente, setProcedente] = useState(true);
  const [impacto, setImpacto] = useState<Nivel3 | null>(inc.impacto);
  const [urgencia, setUrgencia] = useState<Urgencia | null>(inc.urgencia);
  const [text, setText] = useState('');
  const submit = useSubmit();

  const save = async () => {
    if (procedente && (!impacto || !urgencia)) return submit.setError('Elige impacto y urgencia en la matriz.');
    if (!procedente && text.trim().length < 20) return submit.setError('Explica por qué no procede (mínimo 20 caracteres).');
    const ok = await submit.run(() =>
      opsService.clasificar(inc.id, procedente ? { procedente, impacto: impacto!, urgencia: urgencia!, justificacion: text.trim() || undefined } : { procedente, motivo: text.trim() }),
    );
    if (ok) {
      onClose();
      onDone(procedente ? 'Solicitud clasificada: pasa a pendiente de asignación.' : 'Solicitud marcada como no procedente.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<CheckCircle2 className="h-5 w-5" />}
      title="Clasificar solicitud"
      description={`${inc.codigo_ticket} · ${inc.categoria?.nombre ?? ''}`}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className={procedente ? 'btn-primary' : 'btn-danger'} onClick={save} disabled={submit.busy}>
            {submit.busy ? 'Guardando…' : procedente ? 'Clasificar y enviar a asignación' : 'Marcar como no procedente'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-praxis-field p-1" role="radiogroup" aria-label="Procedencia">
          {[
            [true, 'Procede · es de planta física'],
            [false, 'No procede'],
          ].map(([value, label]) => (
            <button
              key={String(value)}
              type="button"
              role="radio"
              aria-checked={procedente === value}
              onClick={() => setProcedente(value as boolean)}
              className={`relative rounded-xl px-3 py-2.5 text-sm font-semibold transition ${procedente === value ? 'text-slate-900' : 'text-slate-500'}`}
            >
              {procedente === value && <motion.span layoutId="proc-pill" className="absolute inset-0 rounded-xl bg-white shadow-sm" />}
              <span className="relative">{label as string}</span>
            </button>
          ))}
        </div>
        {procedente ? (
          <>
            <PriorityMatrix impacto={impacto} urgencia={urgencia} onChange={(i, u) => { setImpacto(i); setUrgencia(u); }} />
            <TextArea id="class-just" label="Justificación" value={text} onChange={setText} max={500} optional rows={2} />
          </>
        ) : (
          <TextArea id="class-motivo" label="¿Por qué no procede?" value={text} onChange={setText} min={20} max={1000} placeholder="Ej.: corresponde a soporte de TI, no a infraestructura física." />
        )}
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}

function PriorityDialog({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const [impacto, setImpacto] = useState<Nivel3 | null>(inc.impacto);
  const [urgencia, setUrgencia] = useState<Urgencia | null>(inc.urgencia);
  const [why, setWhy] = useState('');
  const submit = useSubmit();
  const save = async () => {
    if (!impacto || !urgencia) return submit.setError('Elige impacto y urgencia.');
    if (why.trim().length < 10) return submit.setError('La justificación debe tener al menos 10 caracteres.');
    if (await submit.run(() => opsService.cambiarPrioridad(inc.id, { impacto, urgencia, justificacion: why.trim() }))) {
      onClose();
      onDone('Prioridad recalculada.');
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<Gauge className="h-5 w-5" />}
      title="Recalcular prioridad"
      description="El cambio queda en el historial con su justificación (RN-020)."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={submit.busy}>
            {submit.busy ? 'Guardando…' : 'Guardar prioridad'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <PriorityMatrix impacto={impacto} urgencia={urgencia} onChange={(i, u) => { setImpacto(i); setUrgencia(u); }} />
        <TextArea id="prio-just" label="Justificación del cambio" value={why} onChange={setWhy} min={10} max={500} rows={2} />
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}

const CONTAINMENT = ['Acordonar o señalizar el área', 'Cortar el suministro (energía, agua o gas)', 'Notificar al personal de seguridad', 'Evacuar a las personas del espacio', 'Retirar equipos o mobiliario en riesgo'];

/** Calificación de riesgo inmediato y protocolo de emergencia (HU-5.4, KAN-212). */
function RiskDialog({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const [risk, setRisk] = useState(inc.es_riesgo_inmediato);
  const [level, setLevel] = useState(inc.es_riesgo_inmediato ? 'INMEDIATO' : 'BAJO');
  const [checks, setChecks] = useState<string[]>([]);
  const [actions, setActions] = useState('');
  const [notes, setNotes] = useState('');
  const submit = useSubmit();
  const actionsText = [...checks, actions.trim()].filter(Boolean).join('. ');

  const save = async () => {
    if (risk && actionsText.length < 10) return submit.setError('Indica las acciones de contención adoptadas.');
    const ok = await submit.run(() =>
      opsService.evaluarRiesgo(inc.id, { tiene_riesgo_inmediato: risk, nivel_riesgo: level, acciones_adoptadas: risk ? actionsText : undefined, observaciones: notes.trim() || undefined }),
    );
    if (ok) {
      onClose();
      onDone(risk ? 'Protocolo de emergencia activado: la solicitud pasa directo a asignación.' : 'Evaluación de riesgo registrada.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<ShieldAlert className="h-5 w-5 text-red-600" />}
      title="Evaluación de riesgo inmediato"
      description={inc.descripcion_riesgo ? `Reportado: “${inc.descripcion_riesgo}”` : 'Determina si hay peligro para las personas o la infraestructura.'}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className={risk ? 'btn-danger' : 'btn-primary'} onClick={save} disabled={submit.busy}>
            {submit.busy ? 'Guardando…' : risk ? 'Activar protocolo de emergencia' : 'Registrar evaluación'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        {risk && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white">
            <Siren className="h-5 w-5 animate-pulse" aria-hidden="true" />
            Riesgo inmediato: la solicitud saltará a pendiente de asignación con prioridad crítica.
          </motion.div>
        )}
        <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-praxis-line p-4">
          <span>
            <span className="block font-semibold text-slate-900">¿Hay riesgo inmediato?</span>
            <span className="block text-sm text-slate-500">Peligro para la vida, la salud o daño mayor a la infraestructura.</span>
          </span>
          <input type="checkbox" className="h-5 w-5 accent-red-600" checked={risk} onChange={(e) => { setRisk(e.target.checked); setLevel(e.target.checked ? 'INMEDIATO' : 'BAJO'); }} />
        </label>
        <div>
          <p className="field-label">Nivel de riesgo</p>
          <div className="grid grid-cols-4 gap-2">
            {['BAJO', 'MEDIO', 'ALTO', 'INMEDIATO'].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={level === n}
                onClick={() => setLevel(n)}
                className={`rounded-xl px-2 py-2.5 text-xs font-bold transition ${level === n ? (n === 'INMEDIATO' || n === 'ALTO' ? 'bg-red-600 text-white' : 'bg-praxis-navy text-white') : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {n.charAt(0) + n.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        {risk && (
          <div className="space-y-3">
            <p className="field-label">Checklist de contención</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {CONTAINMENT.map((c) => (
                <li key={c}>
                  <label className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition ${checks.includes(c) ? 'border-red-300 bg-red-50 text-red-900' : 'border-praxis-line'}`}>
                    <input type="checkbox" className="h-4 w-4 accent-red-600" checked={checks.includes(c)} onChange={(e) => setChecks((list) => (e.target.checked ? [...list, c] : list.filter((x) => x !== c)))} />
                    {c}
                  </label>
                </li>
              ))}
            </ul>
            <TextArea id="risk-actions" label="Otras acciones adoptadas" value={actions} onChange={setActions} max={1500} optional rows={2} />
          </div>
        )}
        <TextArea id="risk-notes" label="Observaciones" value={notes} onChange={setNotes} max={1000} optional rows={2} />
        <FormError message={submit.error} />
        {!risk && <p className="flex items-center gap-2 text-xs text-slate-500"><Ban className="h-3.5 w-3.5" aria-hidden="true" />Sin riesgo, la solicitud sigue el flujo normal de clasificación.</p>}
      </div>
    </Modal>
  );
}
