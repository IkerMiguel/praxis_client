"use client";

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, CalendarClock, ClipboardList, Hammer, MapPin, PackageSearch, PauseCircle, RotateCcw, ScanSearch, Stethoscope } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { EmptyState, QueryBoundary } from '@/components/ui/States';
import { IncidentFlags, PriorityBadge } from '@/components/ui/Badges';
import { CategoryIcon } from '@/components/report/categoryIcon';
import { opsService } from '@/services/opsService';
import { useApiQuery } from '@/lib/useApiQuery';
import { useSession } from '@/lib/session/SessionProvider';
import { formatRelative } from '@/lib/format';
import type { IncidenciaResumen } from '@/types/api';

const GROUPS = [
  { estados: ['E11'], title: 'En atención', hint: 'Termina y registra la intervención', icon: Hammer, tone: 'bg-cyan-500', cta: 'Registrar intervención' },
  { estados: ['E06'], title: 'Por inspeccionar', hint: 'Visita el sitio e inicia la inspección', icon: ScanSearch, tone: 'bg-violet-500', cta: 'Iniciar inspección' },
  { estados: ['E07'], title: 'En diagnóstico', hint: 'Registra el diagnóstico o descarta', icon: Stethoscope, tone: 'bg-violet-400', cta: 'Diagnosticar' },
  { estados: ['E10'], title: 'Programadas', hint: 'Intervenciones con fecha', icon: CalendarClock, tone: 'bg-sky-500', cta: 'Ver programación' },
  { estados: ['E13'], title: 'En corrección', hint: 'La verificación pidió ajustes', icon: RotateCcw, tone: 'bg-red-500', cta: 'Ver corrección' },
  { estados: ['E08', 'E09'], title: 'Esperando recursos', hint: 'Autorización o materiales en curso', icon: PackageSearch, tone: 'bg-amber-500', cta: 'Ver estado' },
  { estados: ['E18'], title: 'Suspendidas', hint: 'Pausadas por causa documentada', icon: PauseCircle, tone: 'bg-slate-400', cta: 'Ver suspensión' },
];

/** Bandeja móvil del técnico con sus incidencias activas, primero las de riesgo (E07, KAN-232). */
export default function MyTasksView() {
  const { profile } = useSession();
  const query = useApiQuery('tecnico:tareas', () => opsService.tareas());
  const tasks = query.data?.data ?? [];
  const firstName = profile?.nombre.split(' ')[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader crumbs={[{ label: 'Mis tareas' }]} title={`Tus tareas, ${firstName ?? ''}`} description="Incidencias asignadas a ti, ordenadas por lo que debes hacer primero." />

      <QueryBoundary loading={query.initialLoading} error={query.error} onRetry={query.reload} label="Cargando tareas">
        {tasks.length === 0 ? (
          <div className="card">
            <EmptyState icon={<ClipboardList className="h-7 w-7" />} title="No tienes tareas pendientes" description="Cuando coordinación te asigne una incidencia aparecerá aquí con su ubicación y prioridad." />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {GROUPS.slice(0, 4).map((g) => {
                const n = tasks.filter((t) => g.estados.includes(t.estado.codigo)).length;
                return (
                  <div key={g.title} className="card flex items-center gap-3 p-4">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-white ${g.tone}`}>
                      <g.icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="block text-2xl font-extrabold tabular-nums text-slate-900">{n}</span>
                      <span className="block text-[11px] font-semibold text-slate-500">{g.title}</span>
                    </span>
                  </div>
                );
              })}
            </div>
            {GROUPS.map((g) => {
              const items = tasks.filter((t) => g.estados.includes(t.estado.codigo));
              if (items.length === 0) return null;
              return (
                <section key={g.title} aria-labelledby={`grp-${g.title}`}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${g.tone}`} aria-hidden="true" />
                    <h2 id={`grp-${g.title}`} className="font-bold text-slate-900">
                      {g.title} <span className="text-slate-400">({items.length})</span>
                    </h2>
                    <span className="text-xs text-slate-500">· {g.hint}</span>
                  </div>
                  <ul className="grid gap-3 md:grid-cols-2">
                    {items.map((task, i) => (
                      <TaskCard key={task.id} task={task} cta={g.cta} index={i} />
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

function TaskCard({ task, cta, index }: { task: IncidenciaResumen; cta: string; index: number }) {
  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Link
        href={`/incidencias/${task.id}`}
        className={`group flex h-full flex-col gap-3 rounded-2xl border bg-white p-4 transition active:scale-[0.99] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 ${task.es_riesgo_inmediato ? 'border-red-300 ring-4 ring-red-50' : 'border-praxis-line'}`}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <CategoryIcon codigo={task.categoria?.codigo} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">{task.codigo_ticket}</span>
              <PriorityBadge code={task.prioridad?.codigo} name={task.prioridad?.nombre} color={task.prioridad?.color} />
              <IncidentFlags risk={task.es_riesgo_inmediato} />
            </p>
            <p className="mt-1 font-semibold leading-snug text-slate-900">{task.resumen}</p>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="truncate">{task.ubicacion?.texto.replace(/ > /g, ' · ') ?? '—'}</span>
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-400">Actualizada {formatRelative(task.fecha_actualizacion)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-sky-700">
            {cta}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </div>
      </Link>
    </motion.li>
  );
}
