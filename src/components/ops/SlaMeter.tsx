import { Clock, TimerOff } from 'lucide-react';
import type { SlaInfo } from '@/types/ops';
import { SLA_LABELS, TONE_CLASSES, slaTone } from '@/lib/tones';

function remaining(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h >= 48) return `${Math.round(h / 24)} d`;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m} min`;
}

/** Semáforo SLA con tiempo restante y barra de consumo (HU-10.3). */
export default function SlaMeter({ sla, compact = false }: { sla?: SlaInfo | null; compact?: boolean }) {
  if (!sla) return <span className="text-xs text-slate-400">Sin SLA</span>;
  const tone = TONE_CLASSES[slaTone(sla.estado)];
  const pct = Math.max(0, Math.min(100, sla.porcentaje_consumido ?? (sla.estado === 'VENCIDA' ? 100 : 0)));
  const label =
    sla.estado === 'VENCIDA' && sla.horas_retraso !== null
      ? `+${remaining(sla.horas_retraso * 60)}`
      : sla.minutos_restantes !== null && sla.minutos_restantes !== undefined
        ? remaining(sla.minutos_restantes)
        : SLA_LABELS[sla.estado] ?? sla.estado;

  return (
    <div className={compact ? 'w-24' : 'w-32'} title={`${SLA_LABELS[sla.estado] ?? sla.estado}${sla.fecha_limite ? ` · vence ${new Date(sla.fecha_limite).toLocaleString('es-CO')}` : ''}`}>
      <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold tabular-nums ring-1 ring-inset ${tone.badge}`}>
        {sla.estado === 'VENCIDA' ? <TimerOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Clock className="h-3.5 w-3.5" aria-hidden="true" />}
        {label}
      </span>
      {!compact && sla.porcentaje_consumido !== null && (
        <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
          <span className={`block h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
        </span>
      )}
    </div>
  );
}
