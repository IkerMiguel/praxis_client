"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, QueryBoundary } from '@/components/ui/States';
import IncidentTable from '@/components/ops/IncidentTable';
import { opsService } from '@/services/opsService';
import { catalogService } from '@/services/catalogService';
import { useApiQuery } from '@/lib/useApiQuery';
import { useSession } from '@/lib/session/SessionProvider';
import { TONE_CLASSES, stateTone } from '@/lib/tones';
import type { ConsolaFila } from '@/types/ops';

const STATES = ['E01', 'E02', 'E03', 'E04', 'E05', 'E06', 'E07', 'E08', 'E09', 'E10', 'E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'E17', 'E18'];
const STATE_NAMES: Record<string, string> = {
  E01: 'Registrada', E02: 'Pend. información', E03: 'En revisión', E04: 'En clasificación', E05: 'Pend. asignación', E06: 'Pend. inspección', E07: 'En diagnóstico', E08: 'Pend. autorización', E09: 'Pend. recursos',
  E10: 'Programada', E11: 'En atención', E12: 'Pend. verificación', E13: 'En corrección', E14: 'Pend. confirmación', E15: 'Cerrada', E16: 'No procedente', E17: 'Cancelada', E18: 'Suspendida',
};
const PRIORITIES = [
  ['CRITICA', 'Crítica'],
  ['ALTA', 'Alta'],
  ['MEDIA', 'Media'],
  ['BAJA', 'Baja'],
];
const FILTER_KEYS = ['estado', 'prioridad', 'categoria_id', 'sede_id', 'edificio_id', 'fecha_desde', 'fecha_hasta', 'riesgo_inmediato'];

function exportCsv(rows: ConsolaFila[]) {
  const header = ['Código', 'Resumen', 'Estado', 'Prioridad', 'Categoría', 'Ubicación', 'Técnico', 'Registro', 'SLA'];
  const lines = rows.map((r) =>
    [r.codigo_ticket, r.resumen, r.estado.nombre, r.prioridad?.nombre ?? '', r.categoria?.nombre ?? '', r.ubicacion?.texto ?? '', r.tecnico_asignado?.name ?? '', r.fecha_registro, r.sla?.estado ?? '']
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `praxis-consola-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Consola de incidencias con buscador, panel retráctil de filtros y semáforo SLA (HU-10.1, KAN-302). */
export default function ConsoleView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { menu } = useSession();
  const assignedOnly = menu.find((m) => m.codigo === 'CONSOLA')?.nivel_acceso === 'ASIGNADAS';
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [panel, setPanel] = useState(false);
  const page = Number(params.get('page') ?? 1);
  const get = (k: string) => params.get(k) ?? '';
  const estados = get('estado') ? get('estado').split(',') : [];
  const activeFilters = FILTER_KEYS.filter((k) => params.get(k)).length;

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
    if (search === (params.get('q') ?? '')) return;
    const t = setTimeout(() => update({ q: search.trim() || null }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const catalogs = useApiQuery(panel ? 'consola:catalogos' : null, async () => {
    const [sedes, categorias] = await Promise.all([catalogService.ubicaciones(), catalogService.categorias()]);
    return { sedes, categorias };
  });
  const key = params.toString();
  const query = useApiQuery(`consola:${key}`, () =>
    opsService.consola({
      q: get('q'),
      estado: get('estado'),
      prioridad: get('prioridad'),
      categoria_id: Number(get('categoria_id')) || undefined,
      sede_id: Number(get('sede_id')) || undefined,
      edificio_id: Number(get('edificio_id')) || undefined,
      fecha_desde: get('fecha_desde'),
      fecha_hasta: get('fecha_hasta'),
      riesgo_inmediato: get('riesgo_inmediato') === '1',
      page,
      per_page: 25,
    }),
  );
  const sede = catalogs.data?.sedes.find((s) => String(s.id) === get('sede_id'));

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Consola de incidencias' }]}
        title="Consola de incidencias"
        description={assignedOnly ? 'Incidencias asignadas a ti con su tiempo de atención y semáforo de plazos.' : 'Todas las incidencias del campus con filtros combinables, tiempo de atención y semáforo SLA.'}
        actions={
          query.data && query.data.data.length > 0 && (
            <button type="button" onClick={() => exportCsv(query.data!.data)} className="btn-secondary">
              <Download className="h-4 w-4" aria-hidden="true" />
              Exportar página (CSV)
            </button>
          )
        }
      />

      <section className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-praxis-line p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <label htmlFor="console-search" className="sr-only">
              Buscar
            </label>
            <input id="console-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código (TKT-…) o resumen" className="field h-11 pl-10" />
          </div>
          <button type="button" onClick={() => setPanel((v) => !v)} aria-expanded={panel} aria-controls="console-filters" className={`btn-secondary h-11 ${panel ? 'border-praxis-navy' : ''}`}>
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            Filtros
            {activeFilters > 0 && <span className="rounded-full bg-praxis-navy px-1.5 text-[10px] font-bold text-white">{activeFilters}</span>}
          </button>
          {activeFilters > 0 && (
            <button type="button" onClick={() => update(Object.fromEntries(FILTER_KEYS.map((k) => [k, null])))} className="btn-ghost h-11 text-xs">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Limpiar
            </button>
          )}
        </div>

        <AnimatePresence initial={false}>
          {panel && (
            <motion.div id="console-filters" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-praxis-line bg-slate-50/60">
              <div className="space-y-5 p-5">
                <div>
                  <p className="field-label">Estado</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATES.map((code) => {
                      const on = estados.includes(code);
                      const t = TONE_CLASSES[stateTone(code)];
                      return (
                        <button
                          key={code}
                          type="button"
                          aria-pressed={on}
                          onClick={() => update({ estado: (on ? estados.filter((e) => e !== code) : [...estados, code]).join(',') || null })}
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${on ? 'bg-praxis-navy text-white' : 'bg-white text-slate-600 ring-1 ring-praxis-line hover:bg-slate-100'}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} aria-hidden="true" />
                          {STATE_NAMES[code]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <label className="field-label">
                    Prioridad
                    <select className="field mt-1.5 h-10 font-normal" value={get('prioridad')} onChange={(e) => update({ prioridad: e.target.value || null })}>
                      <option value="">Todas</option>
                      {PRIORITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </label>
                  <label className="field-label">
                    Categoría
                    <select className="field mt-1.5 h-10 font-normal" value={get('categoria_id')} onChange={(e) => update({ categoria_id: e.target.value || null })}>
                      <option value="">Todas</option>
                      {catalogs.data?.categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </label>
                  <label className="field-label">
                    Sede
                    <select className="field mt-1.5 h-10 font-normal" value={get('sede_id')} onChange={(e) => update({ sede_id: e.target.value || null, edificio_id: null })}>
                      <option value="">Todas</option>
                      {catalogs.data?.sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                    </select>
                  </label>
                  <label className="field-label">
                    Edificio
                    <select className="field mt-1.5 h-10 font-normal" disabled={!sede} value={get('edificio_id')} onChange={(e) => update({ edificio_id: e.target.value || null })}>
                      <option value="">{sede ? 'Todos' : 'Elige sede'}</option>
                      {sede?.edificios.map((ed) => <option key={ed.id} value={ed.id}>{ed.nombre}</option>)}
                    </select>
                  </label>
                  <label className="field-label">
                    Desde
                    <input type="date" className="field mt-1.5 h-10 font-normal" value={get('fecha_desde')} onChange={(e) => update({ fecha_desde: e.target.value || null })} />
                  </label>
                  <label className="field-label">
                    Hasta
                    <input type="date" className="field mt-1.5 h-10 font-normal" min={get('fecha_desde') || undefined} value={get('fecha_hasta')} onChange={(e) => update({ fecha_hasta: e.target.value || null })} />
                  </label>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold text-slate-700">
                    <input type="checkbox" className="h-4 w-4 accent-red-600" checked={get('riesgo_inmediato') === '1'} onChange={(e) => update({ riesgo_inmediato: e.target.checked ? '1' : null })} />
                    Solo riesgo inmediato
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <QueryBoundary loading={query.initialLoading} error={query.error} onRetry={query.reload} label="Cargando consola">
          {query.data && query.data.data.length === 0 ? (
            <EmptyState icon={<Search className="h-7 w-7" />} title="Sin resultados" description="Ninguna incidencia coincide con la búsqueda o los filtros." />
          ) : (
            query.data && (
              <div className={query.loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                <IncidentTable rows={query.data.data} />
                <div className="flex items-center justify-between border-t border-praxis-line px-5 py-3 text-sm text-slate-500">
                  <span>{query.data.meta.total} incidencias</span>
                  {query.data.meta.last_page > 1 && (
                    <span className="flex items-center gap-2">
                      <button type="button" className="btn-secondary px-2.5 py-1.5" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })} aria-label="Página anterior">
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <span className="font-semibold text-slate-700">
                        {page} / {query.data.meta.last_page}
                      </span>
                      <button type="button" className="btn-secondary px-2.5 py-1.5" disabled={page >= query.data.meta.last_page} onClick={() => update({ page: String(page + 1) })} aria-label="Página siguiente">
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )
          )}
        </QueryBoundary>
      </section>
    </div>
  );
}
