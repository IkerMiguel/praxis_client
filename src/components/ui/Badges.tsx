import type { ReactNode } from 'react';
import { AlertTriangle, Flame } from 'lucide-react';
import { SLA_LABELS, TONE_CLASSES, priorityTone, slaTone, stateTone, type Tone } from '@/lib/tones';

interface ToneBadgeProps {
  tone: Tone;
  children: ReactNode;
  dot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ToneBadge({ tone, children, dot = true, size = 'sm', className = '' }: ToneBadgeProps) {
  const t = TONE_CLASSES[tone];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset ${t.badge} ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      } ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusBadge({ code, name, color, size }: { code: string; name: string; color?: string | null; size?: 'sm' | 'md' }) {
  return (
    <ToneBadge tone={stateTone(code, color)} size={size}>
      {name}
    </ToneBadge>
  );
}

export function PriorityBadge({ code, name, color }: { code?: string | null; name?: string | null; color?: string | null }) {
  if (!code && !name) return <span className="text-xs text-slate-400">Sin prioridad</span>;
  return <ToneBadge tone={priorityTone(code, color)}>{name ?? code}</ToneBadge>;
}

export function SlaBadge({ code, label }: { code?: string | null; label?: string }) {
  if (!code) return <span className="text-xs text-slate-400">—</span>;
  return <ToneBadge tone={slaTone(code)}>{label ?? SLA_LABELS[code] ?? code}</ToneBadge>;
}

/** Marcas de alerta de la fila: riesgo inmediato y posible duplicado. */
export function IncidentFlags({ risk, duplicate }: { risk?: boolean; duplicate?: boolean }) {
  if (!risk && !duplicate) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      {risk && (
        <span title="Riesgo inmediato" className="inline-flex items-center gap-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
          <Flame className="h-3 w-3" aria-hidden="true" />
          Riesgo
        </span>
      )}
      {duplicate && (
        <span title="Posible duplicado" className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          Duplicado?
        </span>
      )}
    </span>
  );
}
