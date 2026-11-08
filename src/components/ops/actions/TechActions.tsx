"use client";

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardPen, Hammer, Minus, Plus, ScanSearch, SearchX, Timer, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import EvidenceUploader from '@/components/ui/EvidenceUploader';
import { opsService } from '@/services/opsService';
import type { Evidencia } from '@/services/evidenceService';
import { ActionButton, ActionGroup, FormError, TextArea, useSubmit, type ActionContext } from './ActionKit';

type Dialog = 'diagnostico' | 'descarte' | 'intervencion' | null;
const timerKey = (id: string) => `praxis.cronometro.${id}`;

function readTimer(id: string): number | null {
  try {
    const raw = localStorage.getItem(timerKey(id));
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

/** Acciones del técnico asignado en sitio (E07: HU-7.1 a 7.3). */
export default function TechActions(ctx: ActionContext) {
  const { inc, role, userId, onDone } = ctx;
  const [dialog, setDialog] = useState<Dialog>(null);
  const start = useSubmit();
  const code = inc.estado.codigo;
  const assigned = inc.tecnico_asignado?.id === userId;
  const allowed = (role === 'R04' && assigned) || role === 'R07';
  const pendingDecision = code === 'E07' && inc.diagnosticos.some((d) => d.estado === 'REGISTRADO');

  if (!allowed || !['E06', 'E07', 'E10', 'E11'].includes(code)) return null;

  const begin = (fn: () => Promise<unknown>, message: string, after?: () => void) =>
    start.run(fn).then((ok) => {
      if (ok) {
        after?.();
        onDone(message);
      }
    });

  return (
    <ActionGroup title="Técnico en sitio">
      {code === 'E06' && <ActionButton icon={ScanSearch} tone="primary" label="Iniciar inspección" hint="Registra tu llegada al sitio" disabled={start.busy} onClick={() => begin(() => opsService.iniciarInspeccion(inc.id), 'Inspección iniciada.')} />}
      {code === 'E07' && !pendingDecision && (
        <>
          <ActionButton icon={ClipboardPen} tone="primary" label="Registrar diagnóstico" hint="Daño confirmado e intervención propuesta" onClick={() => setDialog('diagnostico')} />
          <ActionButton icon={SearchX} label="No se confirmó el daño" hint="Descartar con evidencia del estado funcional" onClick={() => setDialog('descarte')} />
        </>
      )}
      {code === 'E07' && pendingDecision && <p className="rounded-xl bg-violet-50 px-3 py-2.5 text-xs font-medium text-violet-800">Diagnóstico enviado. Espera la decisión de coordinación.</p>}
      {code === 'E10' && (
        <ActionButton
          icon={Hammer}
          tone="primary"
          label="Iniciar atención"
          hint="Arranca el cronómetro de la intervención"
          disabled={start.busy}
          onClick={() =>
            begin(() => opsService.iniciarAtencion(inc.id), 'Atención iniciada. El cronómetro está corriendo.', () => {
              try {
                localStorage.setItem(timerKey(inc.id), String(Date.now()));
              } catch {
                // Sin almacenamiento: el tiempo se ingresa a mano.
              }
            })
          }
        />
      )}
      {code === 'E11' && (
        <>
          <Stopwatch id={inc.id} />
          <ActionButton icon={ClipboardPen} tone="success" label="Registrar intervención" hint="Actividades, tiempo, materiales y fotos" onClick={() => setDialog('intervencion')} />
        </>
      )}
      <FormError message={start.error} />
      <DiagnosisDialog open={dialog === 'diagnostico'} onClose={() => setDialog(null)} ctx={ctx} />
      <DiscardDialog open={dialog === 'descarte'} onClose={() => setDialog(null)} ctx={ctx} />
      <InterventionDialog open={dialog === 'intervencion'} onClose={() => setDialog(null)} ctx={ctx} />
    </ActionGroup>
  );
}

function useElapsed(id: string) {
  const [state, setState] = useState<{ startAt: number | null; now: number }>({ startAt: null, now: 0 });
  useEffect(() => {
    const tick = () => setState({ startAt: readTimer(id), now: Date.now() });
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [id]);
  return state.startAt ? Math.max(0, state.now - state.startAt) : null;
}

/** Cronómetro de la intervención en curso (KAN-242). */
function Stopwatch({ id }: { id: string }) {
  const elapsed = useElapsed(id);
  if (elapsed === null) return null;
  const s = Math.floor(elapsed / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-praxis-navy px-4 py-3 text-white">
      <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1, repeat: Infinity }} className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
        <Timer className="h-5 w-5" aria-hidden="true" />
      </motion.span>
      <span>
        <span className="block text-[10px] font-semibold text-sky-200">Tiempo en atención</span>
        <span className="font-mono text-xl font-bold tabular-nums" aria-live="off">
          {hh}:{mm}:{ss}
        </span>
      </span>
    </div>
  );
}

function DiagnosisDialog({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const [f, setF] = useState({ hallazgos: '', descripcion_problema: '', alcance: '', intervencion_propuesta: '' });
  const [recursos, setRecursos] = useState(false);
  const [autorizacion, setAutorizacion] = useState(false);
  const [files, setFiles] = useState<Evidencia[]>([]);
  const [uploading, setUploading] = useState(false);
  const submit = useSubmit();
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  const save = async () => {
    if ([f.hallazgos, f.descripcion_problema, f.intervencion_propuesta].some((v) => v.trim().length < 10)) return submit.setError('Hallazgos, problema e intervención propuesta requieren al menos 10 caracteres.');
    const ok = await submit.run(() =>
      opsService.diagnostico(inc.id, {
        hallazgos: f.hallazgos.trim(),
        descripcion_problema: f.descripcion_problema.trim(),
        alcance: f.alcance.trim() || undefined,
        intervencion_propuesta: f.intervencion_propuesta.trim(),
        requiere_recursos: recursos,
        requiere_autorizacion: recursos && autorizacion,
        evidencias: files.map((e) => e.id),
      }),
    );
    if (ok) {
      onClose();
      onDone('Diagnóstico registrado y enviado a coordinación.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<ClipboardPen className="h-5 w-5" />}
      title="Diagnóstico técnico"
      description={`${inc.codigo_ticket} · ${inc.ubicacion.espacio?.nombre ?? ''}`}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={submit.busy || uploading}>
            {submit.busy ? 'Enviando…' : 'Enviar diagnóstico'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <TextArea id="dx-hall" label="Hallazgos en sitio" value={f.hallazgos} onChange={set('hallazgos')} min={10} max={4000} />
        <TextArea id="dx-prob" label="Descripción del problema (causa)" value={f.descripcion_problema} onChange={set('descripcion_problema')} min={10} max={4000} />
        <TextArea id="dx-int" label="Intervención propuesta" value={f.intervencion_propuesta} onChange={set('intervencion_propuesta')} min={10} max={4000} />
        <TextArea id="dx-alc" label="Alcance" value={f.alcance} onChange={set('alcance')} max={4000} optional rows={2} />
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle checked={recursos} onChange={(v) => { setRecursos(v); if (!v) setAutorizacion(false); }} label="Requiere materiales o repuestos" />
          <Toggle checked={autorizacion} disabled={!recursos} onChange={setAutorizacion} label="Requiere autorización presupuestal" />
        </div>
        <div>
          <p className="field-label">Fotos de la inspección</p>
          <EvidenceUploader value={files} onChange={setFiles} max={10} onBusyChange={setUploading} hint="Fotos del daño encontrado · máximo 10" />
        </div>
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}

function DiscardDialog({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const [hallazgos, setHallazgos] = useState('');
  const [why, setWhy] = useState('');
  const [files, setFiles] = useState<Evidencia[]>([]);
  const [uploading, setUploading] = useState(false);
  const submit = useSubmit();
  const save = async () => {
    if (hallazgos.trim().length < 10 || why.trim().length < 20) return submit.setError('Hallazgos (mín. 10) y justificación (mín. 20) son obligatorios.');
    if (files.length === 0) return submit.setError('Adjunta al menos una foto que muestre el estado funcional.');
    if (await submit.run(() => opsService.descartarPorInspeccion(inc.id, { hallazgos: hallazgos.trim(), justificacion: why.trim(), evidencias: files.map((e) => e.id) }))) {
      onClose();
      onDone('Descarte registrado. Coordinación debe validarlo.');
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<SearchX className="h-5 w-5" />}
      title="El daño no se confirmó en la inspección"
      description="Documenta el estado funcional encontrado; coordinación validará el cierre (HU-7.2)."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-dark" onClick={save} disabled={submit.busy || uploading}>
            {submit.busy ? 'Enviando…' : 'Enviar descarte'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <TextArea id="ds-hall" label="Hallazgos" value={hallazgos} onChange={setHallazgos} min={10} max={4000} />
        <TextArea id="ds-why" label="Justificación del descarte" value={why} onChange={setWhy} min={20} max={4000} />
        <div>
          <p className="field-label">Evidencia del estado funcional (obligatoria)</p>
          <EvidenceUploader value={files} onChange={setFiles} max={10} required onBusyChange={setUploading} />
        </div>
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}

interface Material {
  nombre: string;
  cantidad: number;
  unidad: string;
}

function InterventionDialog({ open, onClose, ctx }: { open: boolean; onClose: () => void; ctx: ActionContext }) {
  const { inc, onDone } = ctx;
  const elapsed = useElapsed(inc.id);
  const [activities, setActivities] = useState('');
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [files, setFiles] = useState<Evidencia[]>([]);
  const [uploading, setUploading] = useState(false);
  const submit = useSubmit();
  const suggested = elapsed ? Math.max(1, Math.round(elapsed / 60000)) : null;

  const save = async () => {
    const total = Number(minutes || suggested || 0);
    if (activities.trim().length < 10) return submit.setError('Describe las actividades realizadas (mínimo 10 caracteres).');
    if (!total || total < 1) return submit.setError('Indica el tiempo invertido en minutos.');
    if (files.length === 0) return submit.setError('Adjunta al menos una foto del trabajo terminado (RN-033).');
    if (materials.some((m) => !m.nombre.trim() || !(m.cantidad > 0) || !m.unidad.trim())) return submit.setError('Completa nombre, cantidad y unidad de cada material.');
    const ok = await submit.run(() =>
      opsService.registrarIntervencion(inc.id, {
        actividades_realizadas: activities.trim(),
        tiempo_invertido_minutos: total,
        dificultades_observaciones: notes.trim() || undefined,
        materiales: materials.map((m) => ({ ...m, nombre: m.nombre.trim(), unidad: m.unidad.trim() })),
        evidencias: files.map((e) => e.id),
      }),
    );
    if (ok) {
      try {
        localStorage.removeItem(timerKey(inc.id));
      } catch {
        // nada que limpiar
      }
      onClose();
      onDone('Intervención registrada: pasa a verificación de calidad.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={submit.busy}
      size="lg"
      icon={<Hammer className="h-5 w-5" />}
      title="Registrar intervención"
      description="Bitácora de lo realizado; al guardar pasa a verificación de calidad."
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={submit.busy}>
            Volver
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={submit.busy || uploading}>
            {submit.busy ? 'Guardando…' : 'Registrar y enviar a verificación'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <TextArea id="iv-act" label="Actividades realizadas" value={activities} onChange={setActivities} min={10} max={4000} rows={4} />
        <label className="field-label block">
          Tiempo invertido (minutos)
          <input type="number" min={1} inputMode="numeric" className="field mt-1.5 h-11 font-normal sm:w-48" value={minutes} placeholder={suggested ? String(suggested) : 'Ej.: 90'} onChange={(e) => setMinutes(e.target.value)} />
          {suggested && <span className="mt-1 block text-xs font-normal text-emerald-700">Según el cronómetro: {suggested} min (se usa si lo dejas vacío).</span>}
        </label>
        <div>
          <div className="flex items-center justify-between">
            <p className="field-label">Materiales usados</p>
            <button type="button" onClick={() => setMaterials((m) => [...m, { nombre: '', cantidad: 1, unidad: 'UND' }])} className="btn-ghost text-xs">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Agregar material
            </button>
          </div>
          {materials.length === 0 ? (
            <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">Sin materiales registrados.</p>
          ) : (
            <ul className="space-y-2">
              {materials.map((m, i) => (
                <li key={i} className="grid grid-cols-[1fr_auto_80px_auto] items-center gap-2">
                  <input aria-label="Material" className="field h-10" value={m.nombre} maxLength={150} placeholder="Balasto electrónico" onChange={(e) => setMaterials((list) => list.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))} />
                  <span className="flex items-center rounded-xl bg-praxis-field">
                    <button type="button" aria-label="Menos" className="p-2.5" onClick={() => setMaterials((list) => list.map((x, j) => (j === i ? { ...x, cantidad: Math.max(1, x.cantidad - 1) } : x)))}>
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums">{m.cantidad}</span>
                    <button type="button" aria-label="Más" className="p-2.5" onClick={() => setMaterials((list) => list.map((x, j) => (j === i ? { ...x, cantidad: x.cantidad + 1 } : x)))}>
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </span>
                  <input aria-label="Unidad" className="field h-10" value={m.unidad} maxLength={20} onChange={(e) => setMaterials((list) => list.map((x, j) => (j === i ? { ...x, unidad: e.target.value } : x)))} />
                  <button type="button" aria-label="Quitar material" className="rounded-lg p-2 text-red-500 hover:bg-red-50" onClick={() => setMaterials((list) => list.filter((_, j) => j !== i))}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <TextArea id="iv-notes" label="Dificultades u observaciones" value={notes} onChange={setNotes} max={4000} optional rows={2} />
        <div>
          <p className="field-label">Fotos del trabajo terminado (obligatorias)</p>
          <EvidenceUploader value={files} onChange={setFiles} max={10} required onBusyChange={setUploading} hint="Antes y después de la intervención · máximo 10" />
        </div>
        <FormError message={submit.error} />
      </div>
    </Modal>
  );
}

function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${checked ? 'border-praxis-blue bg-sky-50 text-sky-900' : 'border-praxis-line text-slate-700'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}>
      <input type="checkbox" className="h-4 w-4 accent-sky-600" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
