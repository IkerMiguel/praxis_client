"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, ClipboardCheck, HardHat, Hourglass, MapPin } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, QueryBoundary } from '@/components/ui/States';
import { PriorityBadge } from '@/components/ui/Badges';
import { CategoryIcon } from '@/components/report/categoryIcon';
import { opsService } from '@/services/opsService';
import { useApiQuery } from '@/lib/useApiQuery';
import { formatRelative } from '@/lib/format';

/** Bandeja de verificación de calidad: intervenciones terminadas, las más antiguas primero (HU-9.1). */
export default function VerificationQueueView() {
  const query = useApiQuery('verificacion:pendientes', () => opsService.verificacionPendientes());
  const items = query.data?.data ?? [];
  const [now] = useState(() => Date.now());

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Verificación' }]}
        title="Verificación de calidad"
        description="Revisa que cada intervención terminada quedó bien antes de cerrarla o pedir la conformidad del reportante."
        badge={query.data && <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 ring-1 ring-cyan-200">{query.data.meta.total} por verificar</span>}
      />
      <QueryBoundary loading={query.initialLoading} error={query.error} onRetry={query.reload} label="Cargando verificaciones">
        {items.length === 0 ? (
          <div className="card">
            <EmptyState icon={<ClipboardCheck className="h-7 w-7" />} title="No hay intervenciones por verificar" description="Cuando un técnico registre una intervención terminada aparecerá aquí." />
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item, i) => {
              const days = Math.floor((now - new Date(item.fecha_actualizacion).getTime()) / 86_400_000);
              return (
                <motion.li key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/incidencias/${item.id}`} className="group flex h-full flex-col gap-4 rounded-2xl border border-praxis-line bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                        <CategoryIcon codigo={item.categoria?.codigo} className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-500">{item.codigo_ticket}</span>
                          <PriorityBadge code={item.prioridad?.codigo} name={item.prioridad?.nombre} color={item.prioridad?.color} />
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">{item.resumen}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        <span className="truncate">{item.ubicacion?.texto.replace(/ > /g, ' · ')}</span>
                      </p>
                      {item.tecnico_asignado && (
                        <p className="flex items-center gap-2">
                          <HardHat className="h-4 w-4 text-slate-400" aria-hidden="true" />
                          {item.tecnico_asignado.name}
                        </p>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${days >= 2 ? 'text-orange-700' : 'text-slate-500'}`}>
                        <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
                        Esperando {formatRelative(item.fecha_actualizacion).replace('hace ', '')}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700">
                        Verificar
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
