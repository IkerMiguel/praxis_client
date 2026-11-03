"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { AlarmClock, CircleCheck, TimerOff } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, QueryBoundary } from '@/components/ui/States';
import { PriorityBadge, StatusBadge } from '@/components/ui/Badges';
import SlaMeter from '@/components/ops/SlaMeter';
import { analyticsService } from '@/services/analyticsService';
import { useApiQuery } from '@/lib/useApiQuery';
import { formatDateTime } from '@/lib/format';
import type { ConsolaFila } from '@/types/ops';

const GROUPS = [
  { key: 'VENCIDA', label: 'Vencidas', icon: TimerOff, ring: 'border-red-200', head: 'bg-red-600', text: 'text-red-700', soft: 'bg-red-50' },
  { key: 'PROXIMA_A_VENCER', label: 'Próximas a vencer', icon: AlarmClock, ring: 'border-amber-200', head: 'bg-amber-500', text: 'text-amber-700', soft: 'bg-amber-50' },
  { key: 'EN_PLAZO', label: 'En plazo', icon: CircleCheck, ring: 'border-emerald-200', head: 'bg-emerald-600', text: 'text-emerald-700', soft: 'bg-emerald-50' },
] as const;

/** Semáforo de plazos SLA organizado por urgencia (HU-10.3, KAN-312). */
export default function DeadlinesView() {
  const [focus, setFocus] = useState<string>('');
  const query = useApiQuery(`plazos:${focus}`, () => analyticsService.plazos(focus));
  const resumen = query.data?.resumen;
  const counts: Record<string, number | undefined> = { VENCIDA: resumen?.vencidas, PROXIMA_A_VENCER: resumen?.proximas_a_vencer, EN_PLAZO: resumen?.en_plazo };
  const rows = query.data?.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{ label: 'Plazos SLA' }]} title="Semáforo de plazos" description="Incidencias abiertas según el consumo de su meta de resolución, en horas hábiles de Bogotá." />

      <div className="grid gap-4 sm:grid-cols-3">
        {GROUPS.map((g, i) => {
          const active = focus === g.key;
          return (
            <motion.button
              key={g.key}
              type="button"
              aria-pressed={active}
              onClick={() => setFocus(active ? '' : g.key)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 rounded-2xl border bg-white p-5 text-left transition hover:-translate-y-0.5 ${active ? `${g.ring} ring-4 ring-slate-100` : 'border-praxis-line'}`}
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${g.head}`}>
                <g.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span>
                <span className={`block text-xs font-semibold ${g.text}`}>{g.label}</span>
                <span className="block text-4xl font-extrabold tabular-nums tracking-tight text-slate-900">{counts[g.key] ?? '—'}</span>
              </span>
            </motion.button>
          );
        })}
      </div>

      <QueryBoundary loading={query.initialLoading} error={query.error} onRetry={query.reload} label="Calculando plazos">
        {rows.length === 0 ? (
          <div className="card">
            <EmptyState icon={<CircleCheck className="h-7 w-7" />} title="Sin incidencias en este grupo" description="No hay incidencias abiertas con este estado de plazo." />
          </div>
        ) : (
          <div className="space-y-6">
            {GROUPS.filter((g) => !focus || g.key === focus).map((g) => {
              const items = rows.filter((r) => r.sla?.estado === g.key);
              if (items.length === 0) return null;
              return (
                <section key={g.key} className={`card overflow-hidden ${g.ring}`}>
                  <h2 className={`flex items-center gap-2 px-5 py-3 text-sm font-bold ${g.soft} ${g.text}`}>
                    <g.icon className="h-4 w-4" aria-hidden="true" />
                    {g.label} ({items.length})
                  </h2>
                  <ul className="divide-y divide-slate-100">
                    {items.map((row) => (
                      <DeadlineRow key={row.id} row={row} />
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}

function DeadlineRow({ row }: { row: ConsolaFila }) {
  return (
    <li>
      <Link href={`/incidencias/${row.id}`} className="grid items-center gap-3 px-5 py-4 transition hover:bg-slate-50 md:grid-cols-[150px_minmax(0,1fr)_auto_auto_150px]">
        <span className="font-mono text-xs font-bold text-slate-600">{row.codigo_ticket}</span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-slate-900">{row.resumen}</span>
          <span className="block truncate text-xs text-slate-500">
            {row.categoria?.nombre} · {row.tecnico_asignado?.name ?? 'Sin técnico'}
          </span>
        </span>
        <StatusBadge code={row.estado.codigo} name={row.estado.nombre} color={row.estado.color} />
        <PriorityBadge code={row.prioridad?.codigo} name={row.prioridad?.nombre} color={row.prioridad?.color} />
        <span className="space-y-1">
          <SlaMeter sla={row.sla} />
          {row.sla?.fecha_limite && <span className="block text-[11px] text-slate-400">Vence {formatDateTime(row.sla.fecha_limite)}</span>}
        </span>
      </Link>
    </li>
  );
}
