"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  CalendarClock,
  ChevronLeft,
  ClipboardCheck,
  GitMerge,
  HardHat,
  MapPin,
  MessageSquareText,
  Package,
  PauseCircle,
  ShieldAlert,
  Stethoscope,
  Tag,
  User,
  UserCheck,
  Wrench,
  Zap,
} from 'lucide-react';
import { QueryBoundary } from '@/components/ui/States';
import { IncidentFlags, PriorityBadge, StatusBadge, ToneBadge } from '@/components/ui/Badges';
import EvidenceGallery from '@/components/ui/EvidenceGallery';
import StatusTimeline from '@/components/ui/StatusTimeline';
import { toast } from '@/components/ui/Toaster';
import { opsService } from '@/services/opsService';
import { useApiQuery } from '@/lib/useApiQuery';
import { useSession } from '@/lib/session/SessionProvider';
import { formatDate, formatDateTime, formatHours, formatMoney, formatRelative } from '@/lib/format';
import { SLA_LABELS } from '@/lib/tones';
import type { IncidenciaOperativa } from '@/types/ops';
import SlaMeter from './SlaMeter';
import ActionPanel from './actions/ActionPanel';

/** Ficha operativa de una incidencia para los roles R02 a R07. */
export default function OperationalDetailView({ id }: { id: string }) {
  const query = useApiQuery(`incidencia:${id}`, () => opsService.detail(id));
  const history = useApiQuery(`historial:${id}`, () => opsService.historial(id));

  const refresh = (message?: string) => {
    if (message) toast(message);
    void query.reload();
    void history.reload();
  };

  return (
    <QueryBoundary
      loading={query.initialLoading}
      error={query.status === 404 ? 'La incidencia no existe o no tienes acceso a ella.' : query.status === 403 ? 'Tu rol activo no puede ver esta ficha.' : query.error}
      onRetry={query.reload}
      label="Cargando ficha"
    >
      {query.data && <Detail inc={query.data} history={history.data} refresh={refresh} loading={query.loading} />}
    </QueryBoundary>
  );
}

function Detail({ inc, history, refresh, loading }: { inc: IncidenciaOperativa; history?: Awaited<ReturnType<typeof opsService.historial>>; refresh: (m?: string) => void; loading: boolean }) {
  const router = useRouter();
  const { activeRole, profile } = useSession();
  const plan = inc.planes_intervencion.find((p) => p.estado_plan === 'VIGENTE') ?? inc.planes_intervencion.at(-1);
  const asignacion = inc.asignaciones.find((a) => a.es_vigente);

  return (
    <div className={`space-y-6 transition-opacity ${loading ? 'opacity-70' : ''}`}>
      <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Volver
      </button>

      <section className={`card overflow-hidden ${inc.es_riesgo_inmediato ? 'border-red-200' : ''}`}>
        {inc.protocolo_emergencia_activo && (
          <p className="flex items-center gap-2 bg-red-600 px-6 py-2 text-xs font-bold text-white">
            <ShieldAlert className="h-4 w-4 animate-pulse" aria-hidden="true" />
            Protocolo de emergencia activo
          </p>
        )}
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-sm font-bold text-slate-500">{inc.codigo_ticket}</span>
              <StatusBadge code={inc.estado.codigo} name={inc.estado.nombre} color={inc.estado.color} size="md" />
              <PriorityBadge code={inc.prioridad?.codigo} name={inc.prioridad?.nombre} color={inc.prioridad?.color} />
              <IncidentFlags risk={inc.es_riesgo_inmediato} duplicate={inc.posible_duplicado} />
              {inc.numero_reprocesos > 0 && <ToneBadge tone="rojo">{inc.numero_reprocesos} reproceso{inc.numero_reprocesos === 1 ? '' : 's'}</ToneBadge>}
              {inc.numero_reaperturas > 0 && <ToneBadge tone="naranja">Reabierta {inc.numero_reaperturas}×</ToneBadge>}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{inc.resumen}</h1>
            <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" aria-hidden="true" />{inc.ubicacion.texto.replace(/ > /g, ' · ')}</span>
              <span className="inline-flex items-center gap-1.5"><Tag className="h-4 w-4" aria-hidden="true" />{[inc.categoria?.nombre, inc.subcategoria?.nombre].filter(Boolean).join(' / ')}</span>
            </p>
          </div>
          {inc.sla?.resolucion && (
            <div className="rounded-2xl bg-slate-50 px-5 py-4">
              <p className="text-[11px] font-semibold text-slate-500">SLA de resolución · {SLA_LABELS[inc.sla.resolucion.estado] ?? inc.sla.resolucion.estado}</p>
              <div className="mt-2">
                <SlaMeter sla={inc.sla.resolucion} />
              </div>
              {inc.sla.resolucion.fecha_limite && <p className="mt-1.5 text-xs text-slate-500">Vence {formatDateTime(inc.sla.resolucion.fecha_limite)}</p>}
            </div>
          )}
        </div>
        <dl className="grid border-t border-praxis-line sm:grid-cols-2 lg:grid-cols-4">
          <Meta icon={<User className="h-4 w-4" />} label="Reportante" value={inc.reportante?.name ?? '—'} hint={inc.reportante?.email} />
          <Meta icon={<HardHat className="h-4 w-4" />} label="Técnico asignado" value={inc.tecnico_asignado?.name ?? 'Sin asignar'} hint={asignacion?.fecha_visita_tentativa ? `Visita tentativa ${formatDate(asignacion.fecha_visita_tentativa)}` : undefined} />
          <Meta icon={<CalendarClock className="h-4 w-4" />} label="Intervención" value={plan ? `${formatDate(plan.fecha_programada)} · ${plan.hora_inicio.slice(0, 5)}–${plan.hora_fin.slice(0, 5)}` : 'Sin programar'} hint={plan?.cuadrilla ?? undefined} />
          <Meta icon={<Zap className="h-4 w-4" />} label="Impacto × urgencia" value={inc.impacto ? `${inc.impacto} × ${inc.urgencia}` : 'Por clasificar'} hint={`Radicada ${formatRelative(inc.fecha_registro)}`} />
        </dl>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card title="Descripción del reporte">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{inc.descripcion}</p>
            {inc.descripcion_riesgo && (
              <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
                <span className="font-semibold">Riesgo reportado:</span> {inc.descripcion_riesgo}
              </p>
            )}
          </Card>

          <Card title={`Evidencias (${inc.evidencias.length})`}>
            <EvidenceGallery items={inc.evidencias} />
          </Card>

          {(inc.incidencia_principal || inc.duplicados_vinculados.length > 0) && (
            <Card title="Duplicados" icon={<GitMerge className="h-4 w-4" />}>
              {inc.incidencia_principal && (
                <p className="text-sm text-slate-700">
                  Unificada con{' '}
                  <Link href={`/incidencias/${inc.incidencia_principal.id}`} className="font-mono font-bold text-sky-700 hover:underline">
                    {inc.incidencia_principal.codigo_ticket}
                  </Link>
                </p>
              )}
              {inc.duplicados_vinculados.length > 0 && (
                <ul className="space-y-2">
                  {inc.duplicados_vinculados.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <Link href={`/incidencias/${d.id}`} className="font-mono font-bold text-sky-700 hover:underline">{d.codigo_ticket}</Link>
                      <span className="truncate text-slate-600">{d.resumen}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {inc.aclaraciones.length > 0 && (
            <Card title="Aclaraciones" icon={<MessageSquareText className="h-4 w-4" />}>
              <ul className="space-y-4">
                {inc.aclaraciones.map((a) => (
                  <li key={a.id} className="space-y-2">
                    <Bubble who={a.gestor?.name ?? 'Mesa de ayuda'} when={a.fecha_solicitud} text={a.pregunta_gestor} />
                    {a.respuesta_reportante ? (
                      <Bubble who={inc.reportante?.name ?? 'Reportante'} when={a.fecha_respuesta} text={a.respuesta_reportante} mine />
                    ) : (
                      <p className="pl-4 text-xs font-semibold text-orange-700">Esperando respuesta {a.fecha_limite_respuesta ? `hasta el ${formatDateTime(a.fecha_limite_respuesta)}` : ''}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {inc.evaluaciones_riesgo.length > 0 && (
            <Card title="Evaluación de riesgo" icon={<ShieldAlert className="h-4 w-4" />}>
              {inc.evaluaciones_riesgo.map((e) => (
                <div key={e.id} className={`rounded-xl p-4 text-sm ${e.tiene_riesgo_inmediato ? 'bg-red-50' : 'bg-slate-50'}`}>
                  <p className="font-semibold text-slate-900">
                    Nivel {e.nivel_riesgo.toLowerCase()} · {e.tiene_riesgo_inmediato ? 'con riesgo inmediato' : 'sin riesgo inmediato'}
                  </p>
                  {e.acciones_adoptadas && <p className="mt-1 text-slate-700">Acciones: {e.acciones_adoptadas}</p>}
                  {e.observaciones && <p className="mt-1 text-slate-600">{e.observaciones}</p>}
                  <p className="mt-2 text-xs text-slate-400">{e.evaluador?.name} · {formatDateTime(e.created_at)}</p>
                </div>
              ))}
            </Card>
          )}

          {inc.asignaciones.length > 0 && (
            <Card title="Asignaciones" icon={<UserCheck className="h-4 w-4" />}>
              <ul className="space-y-3">
                {[...inc.asignaciones].reverse().map((a) => (
                  <li key={a.id} className={`rounded-xl border p-4 text-sm ${a.es_vigente ? 'border-sky-200 bg-sky-50/50' : 'border-praxis-line opacity-70'}`}>
                    <p className="font-semibold text-slate-900">
                      {a.tecnico?.name} {a.es_vigente && <span className="ml-1 text-xs font-bold text-sky-700">Vigente</span>}
                      {a.excepcion_wip && <span className="ml-2 text-xs font-bold text-amber-700">Excepción WIP</span>}
                    </p>
                    {a.instrucciones && <p className="mt-1 text-slate-600">{a.instrucciones}</p>}
                    {a.motivo_reasignacion && <p className="mt-1 text-slate-600">Reasignación: {a.motivo_reasignacion}</p>}
                    <p className="mt-2 text-xs text-slate-400">Por {a.asignado_por?.name} · {formatDateTime(a.created_at)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {inc.diagnosticos.length > 0 && (
            <Card title="Diagnóstico técnico" icon={<Stethoscope className="h-4 w-4" />}>
              <ul className="space-y-3">
                {[...inc.diagnosticos].reverse().map((d) => (
                  <li key={d.id} className="space-y-2 rounded-xl border border-praxis-line p-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      <ToneBadge tone={DX_TONE[d.estado] ?? 'gris'}>{DX_LABEL[d.estado] ?? d.estado}</ToneBadge>
                      {d.incidencia_confirmada === true && <ToneBadge tone="violeta">Daño confirmado</ToneBadge>}
                      {d.incidencia_confirmada === false && <ToneBadge tone="gris">Daño no confirmado</ToneBadge>}
                      {d.requiere_recursos && <ToneBadge tone="amarillo">Requiere recursos</ToneBadge>}
                      {d.requiere_autorizacion && <ToneBadge tone="naranja">Requiere autorización</ToneBadge>}
                    </div>
                    {d.hallazgos && <DL label="Hallazgos" value={d.hallazgos} />}
                    {d.descripcion_problema && <DL label="Problema" value={d.descripcion_problema} />}
                    {d.intervencion_propuesta && <DL label="Intervención propuesta" value={d.intervencion_propuesta} />}
                    {d.alcance && <DL label="Alcance" value={d.alcance} />}
                    {d.justificacion_no_confirmada && <DL label="Justificación del descarte" value={d.justificacion_no_confirmada} />}
                    {d.observaciones_devolucion && <DL label="Motivo de la devolución" value={d.observaciones_devolucion} />}
                    <p className="text-xs text-slate-400">{d.tecnico?.name} · {formatDateTime(d.created_at)}</p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {inc.solicitudes_recursos.length > 0 && (
            <Card title="Recursos" icon={<Package className="h-4 w-4" />}>
              <ul className="space-y-3">
                {inc.solicitudes_recursos.map((s) => (
                  <li key={s.id} className="rounded-xl border border-praxis-line p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <ToneBadge tone={s.estado_solicitud.includes('RECHAZ') ? 'rojo' : s.estado_solicitud.includes('APROB') || s.estado_solicitud.includes('DISPON') ? 'verde' : 'amarillo'}>
                        {s.estado_solicitud.replace(/_/g, ' ').toLowerCase()}
                      </ToneBadge>
                      {s.es_emergencia && <ToneBadge tone="rojo">Emergencia</ToneBadge>}
                      <span className="ml-auto font-bold text-slate-900">{formatMoney(s.costo_total_estimado)}</span>
                    </div>
                    <p className="mt-2 text-slate-700">{s.decision_requerida}</p>
                    <ul className="mt-3 divide-y divide-slate-100 rounded-lg bg-slate-50">
                      {s.detalles.map((d) => (
                        <li key={d.id} className="flex items-center justify-between px-3 py-2 text-xs">
                          <span className="text-slate-700">{d.recurso_nombre}</span>
                          <span className="text-slate-500">
                            {d.cantidad} {d.unidad} {d.disponible ? '· disponible' : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                    {s.justificacion_dictamen && <p className="mt-2 text-xs text-slate-600">Dictamen: {s.justificacion_dictamen}</p>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {inc.planes_intervencion.length > 0 && (
            <Card title="Programación" icon={<CalendarClock className="h-4 w-4" />}>
              <ul className="space-y-2">
                {[...inc.planes_intervencion].reverse().map((p) => (
                  <li key={p.id} className={`flex flex-wrap items-center gap-3 rounded-xl px-4 py-3 text-sm ${p.estado_plan === 'VIGENTE' ? 'bg-cyan-50' : 'bg-slate-50 opacity-70'}`}>
                    <span className="font-semibold text-slate-900">{formatDate(p.fecha_programada)}</span>
                    <span className="text-slate-600">{p.hora_inicio.slice(0, 5)}–{p.hora_fin.slice(0, 5)}</span>
                    {p.cuadrilla && <span className="text-slate-600">· {p.cuadrilla}</span>}
                    <span className={`ml-auto text-xs font-bold ${p.estado_plan === 'VIGENTE' ? 'text-cyan-700' : 'text-slate-400'}`}>{PLAN_LABEL[p.estado_plan] ?? p.estado_plan}</span>
                    {p.observaciones && <span className="w-full text-xs text-slate-500">{p.observaciones}</span>}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {inc.actividades.length > 0 && (
            <Card title="Ejecución" icon={<Wrench className="h-4 w-4" />}>
              {inc.actividades.map((a) => (
                <div key={a.id} className="space-y-2 rounded-xl border border-praxis-line p-4 text-sm">
                  {!a.actividades_realizadas ? (
                    <p className="flex items-center gap-2 font-semibold text-cyan-800">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" aria-hidden="true" />
                      Atención en curso desde {formatDateTime(a.fecha_inicio)}
                    </p>
                  ) : (
                    <>
                      <DL label="Actividades realizadas" value={a.actividades_realizadas} />
                      <p className="text-xs text-slate-500">Tiempo invertido: {formatHours(a.tiempo_invertido_minutos / 60)}</p>
                    </>
                  )}
                  {a.dificultades_observaciones && <DL label="Dificultades" value={a.dificultades_observaciones} />}
                  {a.tecnico_ejecutor && <p className="text-xs text-slate-400">{a.tecnico_ejecutor.name} · {formatDateTime(a.fecha_fin ?? a.fecha_inicio)}</p>}
                  {a.materiales && a.materiales.length > 0 && (
                    <p className="text-xs text-slate-600">Materiales: {a.materiales.map((m) => `${m.cantidad} ${m.unidad} ${m.nombre}`).join(', ')}</p>
                  )}
                </div>
              ))}
            </Card>
          )}

          {inc.suspensiones.length > 0 && (
            <Card title="Suspensiones" icon={<PauseCircle className="h-4 w-4" />}>
              {inc.suspensiones.map((s) => (
                <div key={s.id} className="rounded-xl bg-amber-50 p-4 text-sm">
                  <p className="font-semibold text-amber-900">{s.causal.replace(/_/g, ' ').toLowerCase()}</p>
                  <p className="mt-1 text-amber-900/80">{s.motivo_detallado}</p>
                  <p className="mt-1 text-xs text-amber-800">Para reanudar: {s.condiciones_reanudacion}</p>
                  <p className="mt-1 text-xs text-amber-700/80">
                    Desde {formatDateTime(s.fecha_suspension)}
                    {s.fecha_reanudacion ? ` · reanudada ${formatDateTime(s.fecha_reanudacion)}` : ' · en curso'}
                  </p>
                  {s.observacion_reanudacion && <p className="mt-1 text-xs text-amber-900">{s.observacion_reanudacion}</p>}
                </div>
              ))}
            </Card>
          )}

          {inc.verificaciones.length > 0 && (
            <Card title="Verificación de calidad" icon={<ClipboardCheck className="h-4 w-4" />}>
              {inc.verificaciones.map((v) => (
                <div key={v.id} className={`space-y-2 rounded-xl p-4 text-sm ${v.resultado_conforme ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className="font-semibold text-slate-900">{v.resultado_conforme ? 'Conforme' : 'No conforme'}</p>
                  {v.criterios_evaluados && (
                    <ul className="flex flex-wrap gap-1.5">
                      {v.criterios_evaluados.map((c) => (
                        <li key={c.criterio} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${c.cumple ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                          {c.cumple ? '✓' : '✗'} {c.criterio}
                        </li>
                      ))}
                    </ul>
                  )}
                  {v.motivo_rechazo && <DL label="Motivo" value={v.motivo_rechazo} />}
                  {v.correccion_requerida && <DL label="Corrección requerida" value={v.correccion_requerida} />}
                  {v.observaciones && <p className="text-slate-600">{v.observaciones}</p>}
                  <p className="text-xs text-slate-400">{v.verificador?.name} · {formatDateTime(v.created_at)}</p>
                </div>
              ))}
            </Card>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-44">
          <ActionPanel inc={inc} role={activeRole} userId={profile?.id ?? null} onDone={refresh} />
          <Card title="Trazabilidad">
            {history ? <StatusTimeline events={history} /> : <p className="text-sm text-slate-400">Cargando historial…</p>}
          </Card>
        </aside>
      </div>
    </div>
  );
}

const DX_LABEL: Record<string, string> = { EN_INSPECCION: 'En inspección', REGISTRADO: 'Esperando decisión', DEVUELTO: 'Devuelto', APROBADO: 'Aprobado' };
const DX_TONE: Record<string, 'violeta' | 'amarillo' | 'rojo' | 'verde'> = { EN_INSPECCION: 'violeta', REGISTRADO: 'amarillo', DEVUELTO: 'rojo', APROBADO: 'verde' };
const PLAN_LABEL: Record<string, string> = { VIGENTE: 'Vigente', EJECUTADO: 'Ejecutado', REEMPLAZADO: 'Reemplazado' };

function Card({ title, icon, children }: { title: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
        {icon && <span className="text-slate-400">{icon}</span>}
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </motion.section>
  );
}

function Meta({ icon, label, value, hint }: { icon: ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div className="border-b border-praxis-line px-6 py-4 sm:border-r lg:border-b-0 [&:nth-child(4)]:border-r-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</dd>
      {hint && <dd className="truncate text-xs text-slate-500">{hint}</dd>}
    </div>
  );
}

function DL({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="whitespace-pre-line text-slate-700">{value}</p>
    </div>
  );
}

function Bubble({ who, when, text, mine }: { who: string; when?: string | null; text: string; mine?: boolean }) {
  return (
    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${mine ? 'ml-auto rounded-br-sm bg-sky-600 text-white' : 'rounded-bl-sm bg-slate-100 text-slate-800'}`}>
      <p className={`text-[11px] font-semibold ${mine ? 'text-sky-100' : 'text-slate-500'}`}>
        {who} · {formatDateTime(when)}
      </p>
      <p className="mt-1 leading-relaxed">{text}</p>
    </div>
  );
}
