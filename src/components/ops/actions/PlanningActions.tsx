"use client";

import { useState } from 'react';
import { CalendarCheck2, CalendarClock, CircleSlash, PauseCircle, PlayCircle, Undo2, UserPlus, UserRoundCog } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ReasonDialog from '@/components/ui/ReasonDialog';
import { opsService } from '@/services/opsService';
import TechnicianPicker from '../TechnicianPicker';
import { ActionButton, ActionGroup, FormError, ScheduleFields, TextArea, hasRole, scheduleValid, todayISO, useSubmit, type ActionContext } from './ActionKit';

type Dialog = 'asignar' | 'programar' | 'reprogramar' | 'devolver' | 'no-confirmada' | 'suspender' | 'reanudar' | null;

/** Acciones de coordinación: asignación, programación, suspensión y reanudación (E06, HU-7.4). */
export default function PlanningActions(ctx: ActionContext) {
  const { inc, role, userId, onDone } = ctx;
  const [dialog, setDialog] = useState<Dialog>(null);
  const code = inc.estado.codigo;
  const coord = hasRole(role, 'R03');
  const isAssignedTech = role === 'R04' && inc.tecnico_asignado?.id === userId;
  // Diagnóstico enviado por el técnico que espera la decisión de coordinación.
  const diagnosis = [...inc.diagnosticos].reverse().find((d) => d.estado === 'REGISTRADO');
  const discarded = diagnosis?.incidencia_confirmada === false;
  const canSuspend = ['E06', 'E07', 'E09', 'E10', 'E11'].includes(code) && (coord || isAssignedTech);
  const canReassign = coord && inc.tecnico_asignado && ['E06', 'E07', 'E10', 'E11', 'E13', 'E18'].includes(code);

  const items = [
    coord && code === 'E05' && <ActionButton key="a" icon={UserPlus} tone="primary" label="Asignar técnico" hint="Por especialidad y capacidad" onClick={() => setDialog('asignar')} />,
    coord && code === 'E07' && diagnosis && !discarded && !diagnosis.requiere_recursos && (
      <ActionButton key="p" icon={CalendarCheck2} tone="primary" label="Aprobar y programar" hint="El diagnóstico no requiere recursos" onClick={() => setDialog('programar')} />
    ),
    coord && code === 'E07' && diagnosis && !discarded && <ActionButton key="d" icon={Undo2} label="Devolver diagnóstico" hint="Insuficiente: vuelve a inspección" onClick={() => setDialog('devolver')} />,
    coord && code === 'E07' && discarded && <ActionButton key="n" icon={CircleSlash} tone="dark" label="Validar descarte y cerrar" hint="Daño no confirmado en inspección" onClick={() => setDialog('no-confirmada')} />,
    coord && code === 'E10' && <ActionButton key="r" icon={CalendarClock} label="Reprogramar intervención" hint="Guarda la fecha anterior y el motivo" onClick={() => setDialog('reprogramar')} />,
    canReassign && <ActionButton key="ra" icon={UserRoundCog} label="Reasignar técnico" hint="Requiere motivo (RN-025)" onClick={() => setDialog('asignar')} />,
    canSuspend && <ActionButton key="s" icon={PauseCircle} label="Suspender atención" hint="Causa y condiciones para reanudar" onClick={() => setDialog('suspender')} />,
    coord && code === 'E18' && <ActionButton key="re" icon={PlayCircle} tone="primary" label="Reanudar atención" hint="Vuelve a programada o en atención" onClick={() => setDialog('reanudar')} />,
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <ActionGroup title={coord ? 'Coordinación' : 'Atención'}>
      {items}
      <AssignDialog open={dialog === 'asignar'} onClose={() => setDialog(null)} ctx={ctx} />
      <ScheduleDialog open={dialog === 'programar' || dialog === 'reprogramar'} reschedule={dialog === 'reprogramar'} onClose={() => setDialog(null)} ctx={ctx} />
      <ReasonDialog
        open={dialog === 'devolver'}
        onClose={() => setDialog(null)}
        icon={<Undo2 className="h-5 w-5" />}
        title="Devolver diagnóstico al técnico"
        description="La incidencia vuelve a Pendiente de inspección y el técnico debe completar el diagnóstico."
        label="¿Qué le falta al diagnóstico?"
        min={10}
        confirmLabel="Devolver diagnóstico"
        tone="warning"
        onSubmit={(text) => opsService.devolverDiagnostico(inc.id, text)}
        onDone={() => onDone('Diagnóstico devuelto al técnico.')}
      />
      <ReasonDialog
        open={dialog === 'no-confirmada'}
        onClose={() => setDialog(null)}
        icon={<CircleSlash className="h-5 w-5" />}
        title="Cerrar como no confirmada"
        description="Das el visto bueno al descarte del técnico: la incidencia se cierra con resultado No confirmada en inspección y se informa al reportante."
        label="Observaciones del cierre"
        min={0}
        confirmLabel="Cerrar incidencia"
        tone="dark"
        onSubmit={(text) => opsService.cerrarNoConfirmada(inc.id, text || undefined)}
        onDone={() => onDone('Incidencia cerrada como no confirmada.')}
      />
      <SuspendDialog open={dialog === 'suspender'} onClose={() => setDialog(null)} ctx={ctx} />
      <ResumeDialog open={dialog === 'reanudar'} onClose={() => setDialog(null)} ctx={ctx} />
    </ActionGroup>
  );
}

function AssignDialog({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const reassign = Boolean(inc.tecnico_asignado);
  const [tech, setTech] = useState<number | null>(null);
  const [instructions, setInstructions] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const submit = useSubmit();
  const [min] = useState(todayISO);

  const save = async () => {
    if (!tech) return submit.setError('Elige un técnico.');
    if (reassign && reason.trim().length < 10) return submit.setError('Indica el motivo de la reasignación (mínimo 10 caracteres).');
    const ok = await submit.run(() =>
      opsService.asignar(inc.id, { tecnico_id: tech, instrucciones: instructions.trim() || undefined, fecha_visita_tentativa: date || undefined, motivo_reasignacion: reassign ? reason.trim() : undefined }),
    );
    if (ok) {
      onClose();
      onDone(reassign ? 'Técnico reasignado y notificado.' : 'Técnico asignado: la incidencia pasa a pendiente de inspección.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="xl"
      icon={<UserPlus className="h-5 w-5" />}
      title={reassign ? 'Reasignar técnico responsable' : 'Asignar técnico responsable'}
      description={`${inc.codigo_ticket} · ${inc.categoria?.nombre ?? ''} · ${inc.ubicacion.espacio?.nombre ?? ''}`}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={submit.busy}>
            {submit.busy ? 'Asignando…' : reassign ? 'Reasignar' : 'Asignar y derivar a inspección'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <TechnicianPicker categoriaId={inc.categoria?.id} value={tech} onChange={(id) => setTech(id)} excludeId={inc.tecnico_asignado?.id} />
        <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
          <TextArea id="assign-instr" label="Instrucciones para el técnico" value={instructions} onChange={setInstructions} max={1000} optional rows={2} />
          <label className="field-label">
            Visita tentativa
            <input type="date" min={min} className="field mt-1.5 font-normal" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        {reassign && <TextArea id="assign-reason" label="Motivo de la reasignación" value={reason} onChange={setReason} min={10} max={500} rows={2} />}
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}

function ScheduleDialog({ open, reschedule, onClose, ctx }: { open: boolean; reschedule: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const [value, setValue] = useState({ fecha_programada: '', hora_inicio: '', hora_fin: '', cuadrilla: '' });
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const submit = useSubmit();

  const save = async () => {
    const invalid = scheduleValid(value);
    if (invalid) return submit.setError(invalid);
    if (reschedule && reason.trim().length < 10) return submit.setError('Indica el motivo de la reprogramación.');
    const body = { ...value, cuadrilla: value.cuadrilla || undefined, observaciones: notes.trim() || undefined };
    const ok = await submit.run(() => (reschedule ? opsService.reprogramar(inc.id, { ...body, motivo: reason.trim() }) : opsService.programar(inc.id, body)));
    if (ok) {
      onClose();
      onDone(reschedule ? 'Intervención reprogramada.' : 'Diagnóstico aprobado e intervención programada.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<CalendarClock className="h-5 w-5" />}
      title={reschedule ? 'Reprogramar intervención' : 'Aprobar diagnóstico y programar'}
      description="Elige fecha y franja; el técnico y el reportante reciben la notificación."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={submit.busy}>
            {submit.busy ? 'Guardando…' : reschedule ? 'Reprogramar' : 'Programar intervención'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ScheduleFields value={value} onChange={(v) => setValue({ ...value, ...v, cuadrilla: v.cuadrilla ?? '' })} />
        <TextArea id="sched-notes" label="Observaciones" value={notes} onChange={setNotes} max={1000} optional rows={2} />
        {reschedule && <TextArea id="sched-reason" label="Motivo de la reprogramación" value={reason} onChange={setReason} min={10} max={500} rows={2} />}
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}

const CAUSES = [
  ['ACCESO_RESTRINGIDO', 'Acceso restringido'],
  ['CLIMA', 'Condiciones climáticas'],
  ['PROVEEDOR', 'Demora de proveedor'],
  ['EVENTO_INSTITUCIONAL', 'Evento institucional'],
  ['SEGURIDAD', 'Condición de seguridad'],
  ['OTRA', 'Otra causa'],
];

/** Suspensión documentada con causa y condiciones (HU-7.4, KAN-247). */
function SuspendDialog({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const [cause, setCause] = useState('');
  const [detail, setDetail] = useState('');
  const [conditions, setConditions] = useState('');
  const submit = useSubmit();
  const save = async () => {
    if (!cause) return submit.setError('Elige la causa de la suspensión.');
    if (detail.trim().length < 10 || conditions.trim().length < 10) return submit.setError('Describe el motivo y las condiciones para reanudar (mínimo 10 caracteres cada uno).');
    if (await submit.run(() => opsService.suspender(inc.id, { causal: cause, motivo_detallado: detail.trim(), condiciones_reanudacion: conditions.trim() }))) {
      onClose();
      onDone('Atención suspendida y comunicada al reportante.');
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<PauseCircle className="h-5 w-5 text-amber-600" />}
      title="Suspender la atención"
      description="El reloj del SLA se detiene y el reportante recibe la causa."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-warning" onClick={save} disabled={submit.busy}>
            {submit.busy ? 'Guardando…' : 'Suspender'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="field-label">Causa</p>
          <div className="flex flex-wrap gap-2">
            {CAUSES.map(([value, label]) => (
              <button key={value} type="button" aria-pressed={cause === value} onClick={() => setCause(value)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${cause === value ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <TextArea id="susp-detail" label="Motivo detallado" value={detail} onChange={setDetail} min={10} max={1000} />
        <TextArea id="susp-cond" label="Condiciones para reanudar" value={conditions} onChange={setConditions} min={10} max={1000} placeholder="Ej.: cuando el proveedor entregue el repuesto" />
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}

function ResumeDialog({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const [target, setTarget] = useState<'E10' | 'E11'>('E10');
  const [note, setNote] = useState('');
  const [reschedule, setReschedule] = useState(false);
  const [value, setValue] = useState({ fecha_programada: '', hora_inicio: '', hora_fin: '' });
  const submit = useSubmit();
  const save = async () => {
    if (note.trim().length < 10) return submit.setError('La observación debe tener al menos 10 caracteres.');
    if (target === 'E10' && reschedule) {
      const invalid = scheduleValid(value);
      if (invalid) return submit.setError(invalid);
    }
    const ok = await submit.run(() => opsService.reanudar(inc.id, { estado_destino: target, observacion: note.trim(), ...(target === 'E10' && reschedule ? value : {}) }));
    if (ok) {
      onClose();
      onDone('Atención reanudada.');
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<PlayCircle className="h-5 w-5" />}
      title="Reanudar atención"
      description="Se registra cuánto duró la pausa."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={submit.busy}>
            {submit.busy ? 'Guardando…' : 'Reanudar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ['E10', 'Volver a programada'],
              ['E11', 'Continuar en atención'],
            ] as const
          ).map(([value, label]) => (
            <button key={value} type="button" aria-pressed={target === value} onClick={() => setTarget(value)} className={`rounded-xl px-3 py-3 text-sm font-semibold transition ${target === value ? 'bg-praxis-navy text-white' : 'bg-slate-100 text-slate-700'}`}>
              {label}
            </button>
          ))}
        </div>
        {target === 'E10' && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={reschedule} onChange={(e) => setReschedule(e.target.checked)} className="h-4 w-4 accent-sky-600" />
            Definir nueva fecha y franja
          </label>
        )}
        {target === 'E10' && reschedule && <ScheduleFields value={value} onChange={(v) => setValue(v)} withCrew={false} />}
        <TextArea id="resume-note" label="Observación" value={note} onChange={setNote} min={10} max={1000} />
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}
