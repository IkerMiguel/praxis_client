"use client";

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, BadgeDollarSign, Gavel, Siren } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, QueryBoundary } from '@/components/ui/States';
import { PriorityBadge } from '@/components/ui/Badges';
import { toast } from '@/components/ui/Toaster';
import { opsService } from '@/services/opsService';
import { useApiQuery } from '@/lib/useApiQuery';
import { formatMoney, formatRelative } from '@/lib/format';
import type { SolicitudRecursos } from '@/types/ops';
import DictamenForm from './DictamenForm';

const RANGES = [
  { key: 'todas', label: 'Todas', test: () => true },
  { key: 'menor', label: 'Hasta $500.000', test: (v: number) => v <= 500_000 },
  { key: 'medio', label: '$500.000 – $2.000.000', test: (v: number) => v > 500_000 && v <= 2_000_000 },
  { key: 'mayor', label: 'Más de $2.000.000', test: (v: number) => v > 2_000_000 },
];

/** Bandeja de autorizaciones pendientes con filtro por monto y panel de dictamen (HU-8.2, KAN-257). */
export default function AuthorizationsView() {
  const query = useApiQuery('autorizaciones', opsService.autorizacionesPendientes);
  const [range, setRange] = useState('todas');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const filter = RANGES.find((r) => r.key === range)!;
  const list = (query.data ?? [])
    .filter((s) => filter.test(s.costo_total_estimado ?? 0))
    .sort((a, b) => Number(b.es_emergencia) - Number(a.es_emergencia) || (b.costo_total_estimado ?? 0) - (a.costo_total_estimado ?? 0));
  const selected = list.find((s) => s.id === selectedId) ?? list[0];
  const total = (query.data ?? []).reduce((acc, s) => acc + (s.costo_total_estimado ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Autorizaciones' }]}
        title="Autorizaciones pendientes"
        description="Dictamina las solicitudes de recursos que requieren aprobación administrativa o presupuestal."
        badge={query.data && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">{query.data.length} por dictaminar · {formatMoney(total)}</span>}
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por monto">
        {RANGES.map((r) => (
          <button key={r.key} type="button" aria-pressed={range === r.key} onClick={() => setRange(r.key)} className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${range === r.key ? 'bg-praxis-navy text-white' : 'bg-white text-slate-600 ring-1 ring-praxis-line hover:bg-slate-50'}`}>
            {r.label}
          </button>
        ))}
      </div>

      <QueryBoundary loading={query.initialLoading} error={query.error} onRetry={query.reload} label="Cargando autorizaciones">
        {list.length === 0 ? (
          <div className="card">
            <EmptyState icon={<Gavel className="h-7 w-7" />} title="Sin solicitudes por dictaminar" description="Cuando coordinación pida recursos que requieren autorización aparecerán aquí." />
          </div>
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
            <ul className="space-y-3">
              {list.map((s, i) => (
                <motion.li key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <RequestCard s={s} active={selected?.id === s.id} onClick={() => setSelectedId(s.id)} />
                </motion.li>
              ))}
            </ul>
            <AnimatePresence mode="wait">
              {selected && (
                <motion.section key={selected.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="card p-6 lg:sticky lg:top-44">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs font-bold text-slate-500">{selected.incidencia?.codigo_ticket}</p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900">{selected.decision_requerida}</h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Solicitada por {selected.solicitante?.name} · {formatRelative(selected.fecha_solicitud ?? selected.created_at)}
                      </p>
                    </div>
                    {selected.incidencia && (
                      <Link href={`/incidencias/${selected.incidencia.id}`} className="btn-secondary shrink-0 px-3 py-1.5 text-xs">
                        Ficha
                        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                  <DictamenForm
                    solicitud={selected}
                    onDone={(message) => {
                      toast(message);
                      setSelectedId(null);
                      void query.reload();
                    }}
                  />
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}

function RequestCard({ s, active, onClick }: { s: SolicitudRecursos; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`w-full rounded-2xl border bg-white p-4 text-left transition hover:shadow-md hover:shadow-slate-900/5 ${active ? 'border-praxis-blue ring-4 ring-sky-100' : 'border-praxis-line'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-slate-500">{s.incidencia?.codigo_ticket}</span>
            <PriorityBadge code={s.incidencia?.prioridad?.codigo} name={s.incidencia?.prioridad?.nombre} />
            {s.es_emergencia && (
              <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                <Siren className="h-3 w-3" aria-hidden="true" />
                Emergencia
              </span>
            )}
          </p>
          <p className="mt-1.5 truncate font-semibold text-slate-900">{s.incidencia?.resumen}</p>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{s.decision_requerida}</p>
        </div>
        <span className="flex shrink-0 flex-col items-end">
          <span className="flex items-center gap-1 text-lg font-extrabold tabular-nums text-slate-900">
            <BadgeDollarSign className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            {formatMoney(s.costo_total_estimado)}
          </span>
          <span className="text-[11px] text-slate-400">{s.detalles.length} ítem{s.detalles.length === 1 ? '' : 's'}</span>
        </span>
      </div>
    </button>
  );
}
