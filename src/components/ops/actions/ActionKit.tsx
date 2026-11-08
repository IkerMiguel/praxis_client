"use client";

import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { apiErrorMessage, apiFieldErrors } from '@/lib/apiError';
import type { IncidenciaOperativa } from '@/types/ops';
import type { RoleCode } from '@/types/auth';

export interface ActionContext {
  inc: IncidenciaOperativa;
  role: RoleCode | null;
  /** Usuario actual (para acciones que dependen de ser el técnico asignado). */
  userId: number | null;
  onDone: (message?: string) => void;
}

export function hasRole(role: RoleCode | null, ...allowed: RoleCode[]): boolean {
  return role === 'R07' || (role !== null && allowed.includes(role));
}

const TONES = {
  primary: 'bg-gradient-to-r from-praxis-blue to-[#0b7cc4] text-white shadow-sm shadow-sky-900/20 hover:brightness-110',
  dark: 'bg-praxis-navy text-white hover:bg-praxis-navy-soft',
  warning: 'bg-orange-600 text-white hover:bg-orange-500',
  danger: 'bg-red-600 text-white hover:bg-red-500',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500',
  neutral: 'border border-praxis-line bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
};

/** Botón de acción del panel lateral, con ícono y descripción breve. */
export function ActionButton({
  icon: Icon,
  label,
  hint,
  onClick,
  tone = 'neutral',
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  onClick: () => void;
  tone?: keyof typeof TONES;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-3 rounded-xl px-3.5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${TONES[tone]}`}
    >
      <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className={`block text-xs ${tone === 'neutral' ? 'text-slate-500' : 'text-white/80'}`}>{hint}</span>}
      </span>
    </button>
  );
}

export function ActionGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="eyebrow">{title}</p>
      {children}
    </div>
  );
}

/** Estado de envío y error compartido por los formularios de acción. */
export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setBusy(true);
    setError('');
    try {
      await fn();
      return true;
    } catch (err) {
      setError(Object.values(apiFieldErrors(err))[0] ?? apiErrorMessage(err, 'No se pudo completar la acción.'));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, setError, run };
}

export function FormError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}

export function TextArea({
  id,
  label,
  value,
  onChange,
  min,
  max,
  rows = 3,
  placeholder,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max: number;
  rows?: number;
  placeholder?: string;
  optional?: boolean;
}) {
  const len = value.trim().length;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="field-label">
          {label} {optional && <span className="font-normal text-slate-400">(opcional)</span>}
        </label>
        <span className={`text-xs tabular-nums ${len > max ? 'text-red-600' : min && len >= min ? 'text-emerald-600' : 'text-slate-400'}`}>
          {len} / {max}
        </span>
      </div>
      <textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="field resize-y" />
      {min ? <p className="mt-1 text-[11px] text-slate-400">Mínimo {min} caracteres.</p> : null}
    </div>
  );
}

/** Campos de fecha y franja horaria para programar intervenciones. */
export function ScheduleFields({
  value,
  onChange,
  withCrew = true,
}: {
  value: { fecha_programada: string; hora_inicio: string; hora_fin: string; cuadrilla?: string };
  onChange: (v: { fecha_programada: string; hora_inicio: string; hora_fin: string; cuadrilla?: string }) => void;
  withCrew?: boolean;
}) {
  const [today] = useState(todayISO);
  const slots = [
    ['07:00', '09:00', 'Primera hora'],
    ['09:00', '12:00', 'Mañana'],
    ['13:00', '16:00', 'Tarde'],
    ['16:00', '18:00', 'Cierre'],
  ];
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="field-label">
          Fecha
          <input type="date" min={today} className="field mt-1.5 font-normal" value={value.fecha_programada} onChange={(e) => onChange({ ...value, fecha_programada: e.target.value })} />
        </label>
        <label className="field-label">
          Hora inicio
          <input type="time" className="field mt-1.5 font-normal" value={value.hora_inicio} onChange={(e) => onChange({ ...value, hora_inicio: e.target.value })} />
        </label>
        <label className="field-label">
          Hora fin
          <input type="time" className="field mt-1.5 font-normal" value={value.hora_fin} onChange={(e) => onChange({ ...value, hora_fin: e.target.value })} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2" aria-label="Franjas sugeridas">
        {slots.map(([start, end, label]) => {
          const active = value.hora_inicio === start && value.hora_fin === end;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange({ ...value, hora_inicio: start, hora_fin: end })}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${active ? 'bg-praxis-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {label} · {start}–{end}
            </button>
          );
        })}
      </div>
      {withCrew && (
        <label className="field-label">
          Cuadrilla <span className="font-normal text-slate-400">(opcional)</span>
          <input className="field mt-1.5 font-normal" maxLength={255} value={value.cuadrilla ?? ''} onChange={(e) => onChange({ ...value, cuadrilla: e.target.value })} placeholder="Ej.: Cuadrilla eléctrica A" />
        </label>
      )}
    </div>
  );
}

/** Fecha local de hoy en formato Y-m-d. */
export function todayISO(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function scheduleValid(v: { fecha_programada: string; hora_inicio: string; hora_fin: string }): string {
  if (!v.fecha_programada || !v.hora_inicio || !v.hora_fin) return 'Indica fecha, hora de inicio y hora de fin.';
  if (v.hora_fin <= v.hora_inicio) return 'La hora de fin debe ser posterior a la de inicio.';
  return '';
}

export type { IncidenciaOperativa };
