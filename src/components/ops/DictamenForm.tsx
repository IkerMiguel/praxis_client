"use client";

import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { opsService } from '@/services/opsService';
import { formatMoney } from '@/lib/format';
import type { SolicitudRecursos } from '@/types/ops';
import { FormError, ScheduleFields, TextArea, scheduleValid, useSubmit } from './actions/ActionKit';

const REJECT_ACTIONS = [
  ['DEVOLVER_DIAGNOSTICO', 'Devolver a diagnóstico', 'El técnico replantea la intervención'],
  ['SUSPENDER', 'Suspender', 'Se retoma cuando se cumplan condiciones'],
  ['CANCELAR', 'Cancelar la incidencia', 'No se atenderá'],
] as const;

/** Dictamen de una solicitud de recursos: aprobar o rechazar con acción (HU-8.2, KAN-257). */
export default function DictamenForm({ solicitud, onDone }: { solicitud: SolicitudRecursos; onDone: (message: string) => void }) {
  const [result, setResult] = useState<'APROBADA' | 'RECHAZADA'>('APROBADA');
  const [available, setAvailable] = useState(false);
  const [schedule, setSchedule] = useState(false);
  const [value, setValue] = useState({ fecha_programada: '', hora_inicio: '', hora_fin: '' });
  const [why, setWhy] = useState('');
  const [action, setAction] = useState<string>('DEVOLVER_DIAGNOSTICO');
  const [conditions, setConditions] = useState('');
  const submit = useSubmit();

  const save = async () => {
    if (result === 'RECHAZADA') {
      if (why.trim().length < 10) return submit.setError('Justifica el rechazo (mínimo 10 caracteres).');
      if (action === 'SUSPENDER' && conditions.trim().length < 10) return submit.setError('Indica las condiciones para reanudar.');
    }
    if (result === 'APROBADA' && available && schedule) {
      const invalid = scheduleValid(value);
      if (invalid) return submit.setError(invalid);
    }
    const ok = await submit.run(() =>
      opsService.dictamen(solicitud.id, {
        resultado: result,
        justificacion: why.trim() || undefined,
        recursos_disponibles: result === 'APROBADA' ? available : undefined,
        accion_rechazo: result === 'RECHAZADA' ? action : undefined,
        condiciones_reanudacion: result === 'RECHAZADA' && action === 'SUSPENDER' ? conditions.trim() : undefined,
        ...(result === 'APROBADA' && available && schedule ? value : {}),
      }),
    );
    if (ok) onDone(result === 'APROBADA' ? 'Solicitud aprobada.' : 'Solicitud rechazada.');
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-praxis-line">
        <ul className="divide-y divide-slate-100">
          {solicitud.detalles.map((d) => (
            <li key={d.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-800">{d.recurso_nombre}</span>
              <span className="text-slate-500">
                {d.cantidad} {d.unidad} · {formatMoney(d.costo_estimado)}
              </span>
            </li>
          ))}
        </ul>
        <p className="flex justify-between border-t border-praxis-line bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-900">
          <span>Total estimado</span>
          <span>{formatMoney(solicitud.costo_total_estimado)}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            ['APROBADA', 'Aprobar', CheckCircle2, 'bg-emerald-600'],
            ['RECHAZADA', 'Rechazar', XCircle, 'bg-red-600'],
          ] as const
        ).map(([value, label, Icon, tone]) => (
          <button key={value} type="button" aria-pressed={result === value} onClick={() => setResult(value)} className={`relative flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold transition ${result === value ? 'text-white' : 'bg-slate-100 text-slate-600'}`}>
            {result === value && <motion.span layoutId="dictamen-pill" className={`absolute inset-0 rounded-xl ${tone}`} />}
            <Icon className="relative h-4 w-4" aria-hidden="true" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {result === 'APROBADA' ? (
        <div className="space-y-3">
          <label className="flex items-center gap-3 rounded-xl border border-praxis-line p-3 text-sm font-medium text-slate-800">
            <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={available} onChange={(e) => setAvailable(e.target.checked)} />
            Los recursos ya están disponibles (pasa directo a programada)
          </label>
          {available && (
            <label className="flex items-center gap-3 px-1 text-sm text-slate-700">
              <input type="checkbox" className="h-4 w-4 accent-sky-600" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
              Programar ahora la intervención
            </label>
          )}
          {available && schedule && <ScheduleFields value={value} onChange={setValue} withCrew={false} />}
          <TextArea id="dict-just" label="Observaciones" value={why} onChange={setWhy} max={1000} optional rows={2} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {REJECT_ACTIONS.map(([value, label, hint]) => (
              <button key={value} type="button" aria-pressed={action === value} onClick={() => setAction(value)} className={`rounded-xl border p-3 text-left transition ${action === value ? 'border-red-300 bg-red-50' : 'border-praxis-line hover:border-slate-300'}`}>
                <span className="block text-sm font-semibold text-slate-900">{label}</span>
                <span className="text-xs text-slate-500">{hint}</span>
              </button>
            ))}
          </div>
          <TextArea id="dict-why" label="Justificación del rechazo" value={why} onChange={setWhy} min={10} max={1000} rows={2} />
          {action === 'SUSPENDER' && <TextArea id="dict-cond" label="Condiciones para reanudar" value={conditions} onChange={setConditions} min={10} max={1000} rows={2} />}
        </div>
      )}
      <FormError message={submit.error} />
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={submit.busy} className={result === 'APROBADA' ? 'btn-primary bg-none bg-emerald-600 hover:bg-emerald-500' : 'btn-danger'}>
          {submit.busy ? 'Guardando…' : result === 'APROBADA' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
        </button>
      </div>
    </div>
  );
}
