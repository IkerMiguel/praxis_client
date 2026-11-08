"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight, ClipboardList, MapPin, Plus, Search, UserCog, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, QueryBoundary } from '@/components/ui/States';
import { IncidentFlags, StatusBadge } from '@/components/ui/Badges';
import { requestService, type Ambito } from '@/services/requestService';
import { CategoryIcon } from '@/components/report/categoryIcon';
import { useApiQuery } from '@/lib/useApiQuery';
import { useSession } from '@/lib/session/SessionProvider';
import { formatRelative } from '@/lib/format';
import { TONE_CLASSES, stateTone } from '@/lib/tones';
import type { IncidenciaResumen } from '@/types/api';

const FILTERS = [
  { key: '', label: 'Todas' },
  { key: 'E02,E14', label: 'Requieren mi acción' },
  { key: 'E01,E03,E04', label: 'En revisión' },
  { key: 'E05,E06,E07,E08,E09,E10,E11,E12,E13,E18', label: 'En atención' },
  { key: 'E15,E16,E17', label: 'Finalizadas' },
];

/** Listado "Mis solicitudes" con búsqueda, filtros por estado y ámbito (HU-4.1). */
export default function MyRequestsView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { menu } = useSession();
  const canReport = menu.some((m) => m.codigo === 'NUEVO_REPORTE');

  const estado = params.get('estado') ?? '';
  const ambito = (params.get('ambito') as Ambito) || 'propias';
  const page = Number(params.get('page') ?? 1);
  const q = params.get('q') ?? '';
  const [search, setSearch] = useState(q);

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (!('page' in patch)) next.delete('page');
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (search === q) return;
    const timer = setTimeout(() => update({ q: search.trim() || null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const query = useApiQuery(`mis-solicitudes:${estado}:${ambito}:${q}:${page}`, () => requestService.list({ estado, ambito, q, page, per_page: 10 }));
  const data = query.data;
  const filtering = Boolean(estado || q);

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Mis solicitudes' }]}
        title="Mis solicitudes"
        description="Seguimiento al estado de tus requerimientos radicados en PRAXIS."
        actions={
          canReport && (
            <Link href="/reportes/nuevo" className="btn-primary">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo reporte
            </Link>
          )
        }
      />

      <div className="card space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div role="tablist" aria-label="Ámbito" className="inline-flex shrink-0 rounded-xl bg-praxis-field p-1">
            {(
              [
                ['propias', 'Mis reportes'],
                ['seguidas', 'Que sigo'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                role="tab"
                aria-selected={ambito === value}
                onClick={() => update({ ambito: value === 'propias' ? null : value })}
                className={`relative rounded-lg px-4 py-2 text-sm font-semibold transition ${ambito === value ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {ambito === value && <motion.span layoutId="ambito-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm" />}
                <span className="relative">{label}</span>
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <label htmlFor="req-search" className="sr-only">
              Buscar solicitud
            </label>
            <input
              id="req-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código (TKT-…) o descripción"
              className="field h-11 pl-10"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
          {FILTERS.map((f) => {
            const active = f.key === estado;
            return (
              <button
                key={f.label}
                type="button"
                aria-pressed={active}
                onClick={() => update({ estado: f.key || null })}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  active ? 'bg-praxis-navy text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                } ${f.key === 'E02,E14' && !active ? 'ring-1 ring-inset ring-orange-300' : ''}`}
              >
                {f.label}
              </button>
            );
          })}
          {filtering && (
            <button type="button" onClick={() => { setSearch(''); update({ estado: null, q: null }); }} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <QueryBoundary loading={query.initialLoading} error={query.error} onRetry={query.reload} label="Cargando solicitudes">
        {data && (
          <div className={`transition-opacity ${query.loading ? 'opacity-60' : ''}`}>
            {data.data.length === 0 ? (
              <div className="card">
                {filtering ? (
                  <EmptyState icon={<Search className="h-7 w-7" />} title="Ninguna solicitud coincide" description="Prueba con otro código, otra palabra o quita los filtros." />
                ) : ambito === 'seguidas' ? (
                  <EmptyState title="No estás siguiendo solicitudes" description="Cuando sigas un reporte de otra persona para no duplicarlo, aparecerá aquí." />
                ) : (
                  <EmptyState
                    icon={<ClipboardList className="h-7 w-7" />}
                    title="Aún no tienes solicitudes"
                    description="Cuando reportes una falla en el campus, aquí podrás seguir cada paso de su atención."
                    action={
                      canReport && (
                        <Link href="/reportes/nuevo" className="btn-primary">
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Radicar un reporte
                        </Link>
                      )
                    }
                  />
                )}
              </div>
            ) : (
              <>
                <p className="mb-3 px-1 text-sm text-slate-500">
                  {data.meta.total} solicitud{data.meta.total === 1 ? '' : 'es'}
                </p>
                <ul className="card divide-y divide-slate-100 overflow-hidden">
                  <AnimatePresence initial={false}>
                    {data.data.map((item, i) => (
                      <RequestRow key={item.id} item={item} index={i} />
                    ))}
                  </AnimatePresence>
                </ul>
                {data.meta.last_page > 1 && (
                  <nav aria-label="Paginación" className="mt-4 flex items-center justify-center gap-2">
                    <button type="button" className="btn-secondary px-3" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} aria-label="Página anterior">
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="px-3 text-sm font-semibold text-slate-600">
                      Página {data.meta.current_page} de {data.meta.last_page}
                    </span>
                    <button type="button" className="btn-secondary px-3" disabled={page >= data.meta.last_page} onClick={() => update({ page: String(page + 1) })} aria-label="Página siguiente">
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}

function RequestRow({ item, index }: { item: IncidenciaResumen; index: number }) {
  const tone = TONE_CLASSES[stateTone(item.estado.codigo, item.estado.color)];
  const needsInfo = item.estado.codigo === 'E02';
  const needsConfirm = item.estado.codigo === 'E14';
  const actionable = needsInfo || needsConfirm;

  return (
    <motion.li initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
      <Link
        href={`/mis-solicitudes/${item.id}`}
        className={`group flex flex-col gap-4 px-5 py-5 transition sm:flex-row sm:items-center ${actionable ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'}`}
      >
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.soft} ${tone.text}`}>
          <CategoryIcon codigo={item.categoria?.codigo} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900">#{item.codigo_ticket}</span>
            <StatusBadge code={item.estado.codigo} name={item.estado.nombre} color={item.estado.color} />
            <IncidentFlags risk={item.es_riesgo_inmediato} />
            <span className="text-xs text-slate-400">· {formatRelative(item.fecha_actualizacion)}</span>
          </p>
          <p className="mt-1 truncate text-[15px] font-semibold text-slate-900">{item.resumen}</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            {item.ubicacion?.texto && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {item.ubicacion.texto.replace(/ > /g, ' · ')}
              </span>
            )}
            {item.tecnico_asignado && (
              <span className="inline-flex items-center gap-1">
                <UserCog className="h-3.5 w-3.5" aria-hidden="true" />
                {item.tecnico_asignado.name}
              </span>
            )}
            {actionable && <span className="font-semibold text-orange-700">{needsInfo ? 'Responde la aclaración pendiente' : 'Confirma si quedó resuelto'}</span>}
          </p>
        </div>
        <span className={`${actionable ? 'btn-warning' : 'btn-secondary'} shrink-0`}>
          {needsInfo ? 'Completar información' : needsConfirm ? 'Confirmar solución' : 'Ver detalle'}
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </Link>
    </motion.li>
  );
}
