"use client";

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Activity, CalendarCheck2, ClipboardList, Hammer, RefreshCw, Stethoscope, UserPlus, Users } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, QueryBoundary } from '@/components/ui/States';
import { opsService } from '@/services/opsService';
import { useApiQuery } from '@/lib/useApiQuery';
import { initials } from '@/lib/format';
import IncidentTable from './IncidentTable';
import QueueStats, { type QueueStat } from './QueueStats';

const TABS = [
  { key: 'asignar', label: 'Por asignar', estado: 'E05', cta: 'Asignar' },
  { key: 'diagnostico', label: 'Decisión de diagnóstico', estado: 'E07', cta: 'Revisar' },
  { key: 'programadas', label: 'Programadas', estado: 'E10,E11', cta: 'Ver' },
  { key: 'recursos', label: 'Recursos', estado: 'E08,E09', cta: 'Gestionar' },
  { key: 'correccion', label: 'En corrección', estado: 'E13', cta: 'Planificar' },
  { key: 'suspendidas', label: 'Suspendidas', estado: 'E18', cta: 'Reanudar' },
] as const;
const ACTIVE = 'E05,E06,E07,E08,E09,E10,E11,E12,E13,E14,E18';

/** Panel de control operativo de coordinación (E06: HU-6.1 a 6.3, KAN-217). */
export default function PlanningBoardView() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('asignar');
  const current = TABS.find((t) => t.key === tab)!;

  const counts = useApiQuery('plan:conteos', async () => {
    const totals = await Promise.all(
      [ACTIVE, 'E05', 'E06,E07', 'E10,E11', ...TABS.map((t) => t.estado)].map(async (estado) => (await opsService.consola({ estado, per_page: 1 })).meta.total),
    );
    const riesgo = (await opsService.consola({ estado: 'E05', riesgo_inmediato: true, per_page: 1 })).meta.total;
    return { activas: totals[0], asignar: totals[1], inspeccion: totals[2], ejecucion: totals[3], tabs: totals.slice(4), riesgo };
  });
  const list = useApiQuery(`plan:${tab}`, () => opsService.consola({ estado: current.estado, per_page: 50 }));
  const crews = useApiQuery('plan:tecnicos', () => opsService.tecnicosDisponibles());

  const reload = () => {
    void counts.reload();
    void list.reload();
    void crews.reload();
  };

  const c = counts.data;
  const stats: QueueStat[] = [
    { key: 'activas', label: 'Incidencias activas', value: c?.activas, hint: 'En curso en el campus', tone: 'azul', icon: <Activity className="h-4 w-4" /> },
    { key: 'asignar', label: 'Pendientes de asignación', value: c?.asignar, hint: c?.riesgo ? `${c.riesgo} con riesgo inmediato` : 'Requieren técnico', tone: c?.riesgo ? 'rojo' : 'naranja', icon: <UserPlus className="h-4 w-4" /> },
    { key: 'diagnostico', label: 'En inspección y diagnóstico', value: c?.inspeccion, hint: 'Técnicos en sitio', tone: 'violeta', icon: <Stethoscope className="h-4 w-4" /> },
    { key: 'programadas', label: 'En ejecución de obra', value: c?.ejecucion, hint: 'Programadas y en atención', tone: 'cian', icon: <Hammer className="h-4 w-4" /> },
  ];

  const techs = crews.data ?? [];
  const totalLoad = techs.reduce((a, t) => a + t.carga_actual, 0);
  const totalCap = techs.reduce((a, t) => a + t.limite_wip, 0);
  const occupancy = totalCap ? Math.round((totalLoad / totalCap) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        crumbs={[{ label: 'Planificación y asignación' }]}
        title="Panel de control operativo"
        badge={c && <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">{c.activas} incidencias activas</span>}
        description="Asigna técnicos por especialidad, decide sobre los diagnósticos y programa las intervenciones."
        actions={
          <button type="button" onClick={reload} className="btn-secondary" aria-label="Actualizar datos">
            <RefreshCw className={`h-4 w-4 ${list.loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            Actualizar
          </button>
        }
      />

      <QueueStats stats={stats} active={['asignar', 'diagnostico', 'programadas'].includes(tab) ? tab : ''} onSelect={(k) => TABS.some((t) => t.key === k) && setTab(k as typeof tab)} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-praxis-line px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-slate-900">Atención prioritaria</h2>
              {c?.riesgo ? <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">{c.riesgo} críticas sin asignar</span> : null}
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Etapas">
              {TABS.map((t, i) => {
                const active = t.key === tab;
                return (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setTab(t.key)}
                    className={`relative rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${active ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {active && <motion.span layoutId="plan-tab" className="absolute inset-0 rounded-full bg-praxis-navy" />}
                    <span className="relative">
                      {t.label} {c ? `(${c.tabs[i]})` : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <QueryBoundary loading={list.initialLoading} error={list.error} onRetry={list.reload} label="Cargando incidencias">
            {list.data && list.data.data.length === 0 ? (
              <EmptyState icon={<ClipboardList className="h-7 w-7" />} title="Nada pendiente en esta etapa" description="Cuando haya incidencias en esta etapa aparecerán aquí, ordenadas por prioridad." />
            ) : (
              list.data && (
                <div className={list.loading ? 'opacity-60' : ''}>
                  <IncidentTable
                    rows={list.data.data}
                    showState={false}
                    action={(row) => (
                      <Link href={`/incidencias/${row.id}`} className={`${tab === 'asignar' ? 'btn-primary' : 'btn-secondary'} px-3 py-1.5 text-xs`}>
                        {current.cta}
                      </Link>
                    )}
                  />
                  <p className="border-t border-praxis-line px-5 py-3 text-xs text-slate-500">
                    Mostrando {list.data.data.length} de {list.data.meta.total} ·{' '}
                    <Link href={`/consola?estado=${current.estado}`} className="font-semibold text-sky-700 hover:underline">
                      Ver en la consola
                    </Link>
                  </p>
                </div>
              )
            )}
          </QueryBoundary>
        </section>

        <aside className="card p-5 xl:sticky xl:top-44">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-slate-900">
                <Users className="h-4 w-4 text-slate-400" aria-hidden="true" />
                Estado de cuadrillas
              </h2>
              <p className="text-xs text-slate-500">{techs.length} técnicos activos</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-slate-500">Ocupación global</p>
              <p className="text-2xl font-extrabold tabular-nums text-slate-900">{occupancy}%</p>
            </div>
          </div>
          <div className="mt-3 flex gap-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold">
            <span className="text-emerald-700">● {techs.filter((t) => t.carga_actual === 0).length} libres</span>
            <span className="text-sky-700">● {techs.filter((t) => t.carga_actual > 0 && t.carga_actual < t.limite_wip).length} operando</span>
            <span className="text-red-600">● {techs.filter((t) => t.carga_actual >= t.limite_wip).length} saturados</span>
          </div>
          {crews.initialLoading ? (
            <p className="py-8 text-center text-sm text-slate-400">Cargando técnicos…</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {techs.map((t, i) => {
                const load = t.limite_wip ? t.carga_actual / t.limite_wip : 0;
                const saturated = t.carga_actual >= t.limite_wip;
                const tone = saturated ? 'bg-red-500' : load >= 0.7 ? 'bg-amber-500' : load > 0 ? 'bg-sky-500' : 'bg-emerald-500';
                const label = saturated ? 'Capacidad máxima' : load > 0 ? 'Operando' : 'Disponible';
                return (
                  <motion.li key={t.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="rounded-xl border border-praxis-line p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-praxis-navy text-[11px] font-bold text-white">{initials(t.nombre)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{t.nombre}</p>
                        <p className="truncate text-[11px] text-slate-500">{t.especialidades.map((e) => e.nombre).join(' · ')}</p>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-slate-700">
                        {t.carga_actual}/{t.limite_wip}
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <motion.span className={`block h-full rounded-full ${tone}`} initial={{ width: 0 }} animate={{ width: `${Math.max(4, Math.min(100, load * 100))}%` }} transition={{ duration: 0.6, delay: i * 0.04 }} />
                      </span>
                      <span className={`text-[10px] font-bold ${saturated ? 'text-red-600' : 'text-slate-500'}`}>{label}</span>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
          <Link href="/consola/plazos" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
            <CalendarCheck2 className="h-4 w-4" aria-hidden="true" />
            Ver semáforo de plazos SLA
          </Link>
        </aside>
      </div>
    </div>
  );
}
