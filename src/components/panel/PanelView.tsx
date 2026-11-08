"use client";

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, BookOpen, CircleAlert, ClipboardList, Hammer, Plus, SearchCheck, Sparkles } from 'lucide-react';
import { useSession } from '@/lib/session/SessionProvider';
import { useApiQuery } from '@/lib/useApiQuery';
import { panelService, type PanelResumen } from '@/services/panelService';
import { QueryBoundary, EmptyState } from '@/components/ui/States';
import { StatusBadge } from '@/components/ui/Badges';
import { TONE_CLASSES, stateTone } from '@/lib/tones';
import { formatRelative } from '@/lib/format';

const REVIEW = ['E01', 'E03', 'E04'];
const ATTENTION = ['E05', 'E06', 'E07', 'E08', 'E09', 'E10', 'E11', 'E12', 'E13', 'E18'];

function sum(resumen: PanelResumen, codes: string[]) {
  return resumen.por_estado.filter((e) => codes.includes(e.codigo)).reduce((acc, e) => acc + e.total, 0);
}

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('es-CO', { hour: 'numeric', hour12: false, timeZone: 'America/Bogota' }).format(new Date()));
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

/** Panel principal con contadores y accesos rápidos (HU-2.3). */
export default function PanelView() {
  const reduceMotion = useReducedMotion();
  const { profile, menu } = useSession();
  const { data, error, initialLoading, reload } = useApiQuery('panel', panelService.resumen);
  const canReport = menu.some((m) => m.codigo === 'NUEVO_REPORTE');
  const firstName = profile?.nombre.split(' ')[0] ?? '';

  const rise = (index: number) =>
    reduceMotion ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 * index, duration: 0.35 } };

  return (
    <div className="space-y-6">
      <motion.section
        {...rise(0)}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#08508a] via-praxis-blue to-[#1590d6] px-6 py-8 text-white shadow-xl shadow-sky-900/20 sm:px-10"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[40px] border-white/10" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-praxis-green/25 blur-2xl" aria-hidden="true" />
        <p className="text-sm font-medium text-sky-100">{greeting()}</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Hola de nuevo, {firstName}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sky-100/90">
          Mesa de ayuda de planta física de la Universidad ECCI. Reporta una falla en segundos y sigue cada paso de su atención.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {canReport && (
            <Link href="/reportes/nuevo" className="inline-flex h-12 items-center gap-2 rounded-2xl bg-praxis-navy px-6 text-sm font-semibold text-white shadow-lg shadow-slate-950/30 transition hover:bg-praxis-navy-soft">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo reporte
            </Link>
          )}
          <Link href="/mis-solicitudes" className="inline-flex h-12 items-center gap-2.5 rounded-2xl bg-white/15 px-5 text-sm font-semibold backdrop-blur transition hover:bg-white/25">
            <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
            {data ? `${data.activas} ${data.activas === 1 ? 'solicitud activa' : 'solicitudes activas'}` : 'Mis solicitudes'}
          </Link>
        </div>
      </motion.section>

      <QueryBoundary loading={initialLoading} error={error} onRetry={reload} label="Cargando tu panel">
        {data && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <StatCard index={1} icon={<SearchCheck className="h-5 w-5" />} tone="azul" label="En revisión" value={sum(data, REVIEW)} unit="por validar" href="/mis-solicitudes?estado=E01,E03,E04" />
              <StatCard index={2} icon={<Hammer className="h-5 w-5" />} tone="violeta" label="En proceso de atención" value={sum(data, ATTENTION)} unit="con técnico o programación" href={`/mis-solicitudes?estado=${ATTENTION.join(',')}`} />
              <StatCard
                index={3}
                icon={<CircleAlert className="h-5 w-5" />}
                tone="naranja"
                label="Requieren tu atención"
                value={data.requieren_accion.pendiente_informacion + data.requieren_accion.pendiente_confirmacion}
                unit={`${data.requieren_accion.pendiente_informacion} aclaraciones · ${data.requieren_accion.pendiente_confirmacion} confirmaciones`}
                href="/mis-solicitudes?estado=E02,E14"
                highlight
              />
            </div>

            {data.total > 0 && <StateDistribution resumen={data} />}

            <motion.section {...rise(5)} className="card overflow-hidden">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-praxis-line px-6 py-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Mis reportes recientes</h2>
                  <p className="text-sm text-slate-500">Seguimiento al estado de lo que radicaste en PRAXIS.</p>
                </div>
                <Link href="/mis-solicitudes" className="btn-secondary">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  Historial completo
                </Link>
              </div>
              {data.recientes.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="h-7 w-7" />}
                  title="Todavía no has radicado reportes"
                  description="Cuando reportes una falla, aquí verás su estado y cuándo necesitamos algo de ti."
                  action={
                    canReport && (
                      <Link href="/reportes/nuevo" className="btn-primary">
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        Radicar mi primer reporte
                      </Link>
                    )
                  }
                />
              ) : (
                <ul className="divide-y divide-slate-100 p-3">
                  {data.recientes.map((item) => (
                    <RecentRow key={item.id} item={item} />
                  ))}
                </ul>
              )}
            </motion.section>
          </>
        )}
      </QueryBoundary>

      <motion.aside {...rise(6)} className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-praxis-line bg-white px-6 py-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
            <BookOpen className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold text-slate-900">¿Primera vez reportando una novedad en el campus?</p>
            <p className="text-sm text-slate-500">Conoce la guía paso a paso y qué significa cada estado de tu solicitud.</p>
          </div>
        </div>
        <Link href="/ayuda" className="btn-secondary">
          Ver guía y preguntas frecuentes
        </Link>
      </motion.aside>
    </div>
  );
}

function StatCard({
  index,
  icon,
  tone,
  label,
  value,
  unit,
  href,
  highlight = false,
}: {
  index: number;
  icon: React.ReactNode;
  tone: 'azul' | 'violeta' | 'naranja';
  label: string;
  value: number;
  unit: string;
  href: string;
  highlight?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const t = TONE_CLASSES[tone];
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35 }}
    >
      <Link
        href={href}
        className={`group flex h-full items-start gap-4 rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 ${
          highlight && value > 0 ? 'border-orange-200 ring-4 ring-orange-50' : 'border-praxis-line'
        }`}
      >
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${t.soft} ${t.text}`}>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className={`block text-xs font-semibold ${t.text}`}>{label}</span>
          <span className={`mt-1 block text-4xl font-extrabold tabular-nums tracking-tight ${highlight && value > 0 ? 'text-orange-600' : 'text-slate-900'}`}>{value}</span>
          <span className="mt-1 block text-xs text-slate-500">{unit}</span>
        </span>
        <ArrowRight className="mt-1 h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" aria-hidden="true" />
      </Link>
    </motion.div>
  );
}

/** Barra apilada con la distribución de solicitudes propias por estado. */
function StateDistribution({ resumen }: { resumen: PanelResumen }) {
  const reduceMotion = useReducedMotion();
  const states = resumen.por_estado.filter((e) => e.total > 0);
  return (
    <section className="card px-6 py-5" aria-label="Distribución por estado">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-bold text-slate-900">Tus {resumen.total} solicitudes por estado</h2>
        <Link href="/ayuda#estados" className="text-xs font-semibold text-sky-700 hover:underline">
          ¿Qué significa cada estado?
        </Link>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {states.map((state, index) => (
          <motion.span
            key={state.codigo}
            className={`h-full ${TONE_CLASSES[stateTone(state.codigo)].bar} ${index > 0 ? 'border-l-2 border-white' : ''}`}
            initial={reduceMotion ? false : { width: 0 }}
            animate={{ width: `${(state.total / resumen.total) * 100}%` }}
            transition={{ duration: 0.6, delay: 0.1 + index * 0.05, ease: 'easeOut' }}
            title={`${state.nombre}: ${state.total}`}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {states.map((state) => (
          <li key={state.codigo} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={`h-2 w-2 rounded-full ${TONE_CLASSES[stateTone(state.codigo)].dot}`} aria-hidden="true" />
            {state.nombre}
            <span className="font-bold tabular-nums text-slate-900">{state.total}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentRow({ item }: { item: PanelResumen['recientes'][number] }) {
  const needsInfo = item.estado.codigo === 'E02';
  const needsConfirm = item.estado.codigo === 'E14';
  const actionable = needsInfo || needsConfirm;

  return (
    <li className={`my-1.5 flex flex-col gap-3 rounded-2xl px-4 py-4 sm:flex-row sm:items-center ${actionable ? 'border border-amber-200 bg-amber-50/60' : 'hover:bg-slate-50'}`}>
      <div className="w-40 shrink-0">
        <p className="font-mono text-sm font-bold text-slate-900">#{item.codigo_ticket}</p>
        <p className="text-xs text-slate-400">{formatRelative(item.fecha_actualizacion)}</p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-slate-900">{item.resumen}</p>
        <p className={`truncate text-xs ${actionable ? 'font-semibold text-orange-700' : 'text-slate-500'}`}>
          {needsInfo
            ? 'Te pidieron una aclaración para continuar'
            : needsConfirm
              ? 'El trabajo terminó: confirma si quedó resuelto'
              : item.categoria?.nombre ?? 'Sin categoría'}
        </p>
      </div>
      <StatusBadge code={item.estado.codigo} name={item.estado.nombre} color={item.estado.color} size="md" />
      <Link
        href={`/mis-solicitudes/${item.id}`}
        className={`${actionable ? 'btn-warning' : 'btn-secondary'} shrink-0 sm:w-52`}
      >
        {needsInfo ? 'Completar información' : needsConfirm ? 'Confirmar solución' : 'Ver detalle'}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </li>
  );
}
