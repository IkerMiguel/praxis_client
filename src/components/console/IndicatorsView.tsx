"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { BarChart3, CircleCheckBig, Clock3, Repeat, TriangleAlert } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, QueryBoundary } from '@/components/ui/States';
import { analyticsService, type Periodo } from '@/services/analyticsService';
import { useApiQuery } from '@/lib/useApiQuery';
import { formatDate, formatNumber, formatRelative } from '@/lib/format';
import { TONE_CLASSES, priorityTone } from '@/lib/tones';

const PERIODS: { key: Periodo; label: string }[] = [
  { key: 'semana', label: 'Últimos 7 días' },
  { key: 'mes', label: 'Este mes' },
  { key: 'semestre', label: 'Semestre' },
  { key: 'rango', label: 'Rango' },
];
const PRIORITY_ORDER = ['CRITICA', 'ALTA', 'MEDIA', 'BAJA', 'SIN_CLASIFICAR'];
const PRIORITY_NAMES: Record<string, string> = { CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja', SIN_CLASIFICAR: 'Sin clasificar' };

/** Indicadores del periodo: volumen, MTTR, cumplimiento SLA y fallas recurrentes (HU-10.4, KAN-317). */
export default function IndicatorsView() {
  const reduceMotion = useReducedMotion();
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const ready = periodo !== 'rango' || (desde && hasta && hasta >= desde);
  const query = useApiQuery(ready ? `metricas:${periodo}:${desde}:${hasta}` : null, () => analyticsService.metricas(periodo, desde, hasta));
  const m = query.data;
  const states = (m?.por_estado ?? []).filter((s) => s.total > 0);
  const maxState = Math.max(1, ...states.map((s) => s.total));
  const priorities = PRIORITY_ORDER.map((code) => ({ code, total: m?.por_prioridad[code] ?? 0 })).filter((p) => p.total > 0);
  const maxPriority = Math.max(1, ...priorities.map((p) => p.total));
  const sla = m?.cumplimiento_sla.porcentaje ?? null;
  const circumference = 2 * Math.PI * 42;

  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{ label: 'Indicadores' }]} title="Indicadores de gestión" description="Volumen, tiempos de resolución, cumplimiento de plazos y fallas que se repiten en el campus." />

      <div className="flex flex-wrap items-end gap-3">
        <div role="tablist" aria-label="Periodo" className="inline-flex rounded-xl border border-praxis-line bg-white p-1">
          {PERIODS.map((p) => (
            <button key={p.key} role="tab" aria-selected={periodo === p.key} onClick={() => setPeriodo(p.key)} className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold transition ${periodo === p.key ? 'text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              {periodo === p.key && <motion.span layoutId="period-pill" className="absolute inset-0 rounded-lg bg-praxis-navy" />}
              <span className="relative">{p.label}</span>
            </button>
          ))}
        </div>
        {periodo === 'rango' && (
          <>
            <label className="text-xs font-semibold text-slate-600">
              Desde
              <input type="date" className="field mt-1 h-10" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Hasta
              <input type="date" className="field mt-1 h-10" min={desde || undefined} value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </label>
          </>
        )}
        {m && (
          <span className="ml-auto text-xs text-slate-500">
            {formatDate(m.periodo.desde)} – {formatDate(m.periodo.hasta)}
          </span>
        )}
      </div>

      {!ready ? (
        <p className="rounded-2xl border border-dashed border-praxis-line bg-white px-5 py-6 text-sm text-slate-500">Elige las fechas del rango para calcular los indicadores.</p>
      ) : (
        <QueryBoundary loading={query.initialLoading} error={query.error} onRetry={query.reload} label="Calculando indicadores">
          {m && m.sin_datos ? (
            <div className="card">
              <EmptyState icon={<BarChart3 className="h-7 w-7" />} title="Sin información en el periodo" description="No se registraron ni cerraron incidencias en las fechas seleccionadas." />
            </div>
          ) : (
            m && (
              <div className={`space-y-6 ${query.loading ? 'opacity-60' : ''}`}>
                <div className="grid gap-4 md:grid-cols-3">
                  <Tile icon={<BarChart3 className="h-5 w-5" />} label="Incidencias registradas" value={formatNumber(m.total_incidencias)} hint="en el periodo" />
                  <Tile icon={<Clock3 className="h-5 w-5" />} label="Tiempo medio de resolución (MTTR)" value={m.mttr.horas_promedio !== null ? `${m.mttr.horas_promedio} h` : '—'} hint={`${m.mttr.incidencias_cerradas} cerradas · horas hábiles`} />
                  <div className="card flex items-center gap-5 p-5">
                    <svg viewBox="0 0 100 100" className="h-24 w-24 shrink-0 -rotate-90" role="img" aria-label={`Cumplimiento SLA ${sla ?? 0}%`}>
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={sla === null ? '#cbd5e1' : sla >= 90 ? '#10b981' : sla >= 75 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={reduceMotion ? false : { strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference * (1 - (sla ?? 0) / 100) }}
                        transition={{ duration: 0.9, ease: 'easeOut' }}
                      />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">Cumplimiento SLA</p>
                      <p className="text-4xl font-extrabold tabular-nums tracking-tight text-slate-900">{sla !== null ? `${sla}%` : '—'}</p>
                      <p className="text-xs text-slate-500">
                        {m.cumplimiento_sla.cumplidas} de {m.cumplimiento_sla.evaluadas} dentro del plazo
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <ChartCard title="Incidencias por estado" subtitle="Registradas en el periodo">
                    <ul className="space-y-2.5">
                      {states.map((s, i) => (
                        <li key={s.codigo} className="group grid grid-cols-[150px_1fr_40px] items-center gap-3 text-sm" title={`${s.nombre}: ${s.total}`}>
                          <span className="truncate text-slate-600">{s.nombre}</span>
                          <span className="h-5 rounded-r bg-slate-50">
                            <motion.span
                              className="block h-full rounded-r bg-praxis-blue transition group-hover:bg-praxis-sky"
                              initial={reduceMotion ? false : { width: 0 }}
                              animate={{ width: `${(s.total / maxState) * 100}%` }}
                              transition={{ duration: 0.6, delay: i * 0.04 }}
                            />
                          </span>
                          <span className="text-right font-semibold tabular-nums text-slate-900">{s.total}</span>
                        </li>
                      ))}
                    </ul>
                  </ChartCard>
                  <ChartCard title="Incidencias por prioridad" subtitle="Según la clasificación de la mesa de ayuda">
                    <ul className="space-y-3">
                      {priorities.map((p, i) => (
                        <li key={p.code} className="group grid grid-cols-[110px_1fr_40px] items-center gap-3 text-sm" title={`${PRIORITY_NAMES[p.code]}: ${p.total}`}>
                          <span className="text-slate-600">{PRIORITY_NAMES[p.code]}</span>
                          <span className="h-6 rounded-r bg-slate-50">
                            <motion.span
                              className={`block h-full rounded-r ${p.code === 'SIN_CLASIFICAR' ? 'bg-slate-300' : TONE_CLASSES[priorityTone(p.code)].bar}`}
                              initial={reduceMotion ? false : { width: 0 }}
                              animate={{ width: `${(p.total / maxPriority) * 100}%` }}
                              transition={{ duration: 0.6, delay: i * 0.05 }}
                            />
                          </span>
                          <span className="text-right font-semibold tabular-nums text-slate-900">{p.total}</span>
                        </li>
                      ))}
                    </ul>
                  </ChartCard>
                </div>

                <section className="card overflow-hidden">
                  <div className="flex items-center gap-3 border-b border-praxis-line px-5 py-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <Repeat className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div>
                      <h2 className="font-bold text-slate-900">Alertas de fallas recurrentes</h2>
                      <p className="text-xs text-slate-500">
                        Espacios con {m.fallas_recurrentes.minimo_reportes} o más reportes de la misma categoría en los últimos {m.fallas_recurrentes.ventana_dias} días
                      </p>
                    </div>
                  </div>
                  {m.fallas_recurrentes.data.length === 0 ? (
                    <p className="flex items-center gap-2 px-5 py-6 text-sm text-slate-500">
                      <CircleCheckBig className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                      No hay fallas recurrentes en la ventana actual.
                    </p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-[11px] font-semibold text-slate-500">
                          <th className="px-5 py-2.5">Espacio</th>
                          <th className="px-3 py-2.5">Categoría</th>
                          <th className="px-3 py-2.5 text-right">Reportes</th>
                          <th className="px-5 py-2.5">Último reporte</th>
                        </tr>
                      </thead>
                      <tbody>
                        {m.fallas_recurrentes.data.map((r) => (
                          <tr key={`${r.espacio_fisico_id}-${r.categoria_id}`} className="border-t border-slate-100">
                            <td className="px-5 py-3 font-semibold text-slate-900">
                              <span className="inline-flex items-center gap-2">
                                <TriangleAlert className="h-4 w-4 text-orange-500" aria-hidden="true" />
                                {r.espacio}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-slate-600">{r.categoria}</td>
                            <td className="px-3 py-3 text-right font-bold tabular-nums text-orange-700">{r.reportes}</td>
                            <td className="px-5 py-3 text-slate-500">{formatRelative(r.ultimo_reporte)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>
                <p className="text-xs text-slate-400">
                  ¿Necesitas el detalle? <Link href="/consola" className="font-semibold text-sky-700 hover:underline">Abre la consola</Link> con los mismos filtros de fecha.
                </p>
              </div>
            )
          )}
        </QueryBoundary>
      )}
    </div>
  );
}

function Tile({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">{icon}</span>
      <div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="font-bold text-slate-900">{title}</h2>
      <p className="mb-4 text-xs text-slate-500">{subtitle}</p>
      {children}
    </section>
  );
}
