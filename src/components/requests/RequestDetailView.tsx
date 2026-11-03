"use client";

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  Ban,
  BellRing,
  CalendarDays,
  Check,
  ChevronLeft,
  ClipboardCopy,
  GitMerge,
  MapPin,
  MessageSquareReply,
  RotateCcw,
  Star,
  Tag,
  ThumbsDown,
  Timer,
} from 'lucide-react';
import { QueryBoundary } from '@/components/ui/States';
import { IncidentFlags, PriorityBadge, StatusBadge } from '@/components/ui/Badges';
import EvidenceGallery from '@/components/ui/EvidenceGallery';
import EvidenceUploader from '@/components/ui/EvidenceUploader';
import StatusTimeline from '@/components/ui/StatusTimeline';
import ReasonDialog from '@/components/ui/ReasonDialog';
import Modal from '@/components/ui/Modal';
import { toast } from '@/components/ui/Toaster';
import { requestService } from '@/services/requestService';
import type { Evidencia } from '@/services/evidenceService';
import type { SolicitudDetalle } from '@/types/incident';
import { useApiQuery } from '@/lib/useApiQuery';
import { apiErrorMessage } from '@/lib/apiError';
import { formatDate, formatDateTime, formatRelative } from '@/lib/format';

/** Ficha de seguimiento de una solicitud propia o seguida (HU-4.2). */
export default function RequestDetailView({ id }: { id: string }) {
  const query = useApiQuery(`solicitud:${id}`, () => requestService.detail(id));

  return (
    <QueryBoundary loading={query.initialLoading} error={query.status === 404 ? 'Esta solicitud no existe o no tienes acceso a ella.' : query.error} onRetry={query.reload} label="Cargando solicitud">
      {query.data && <Detail data={query.data} reload={query.reload} />}
    </QueryBoundary>
  );
}

function Detail({ data, reload }: { data: SolicitudDetalle; reload: () => Promise<void> }) {
  const [dialog, setDialog] = useState<'aclaracion' | 'cancelar' | 'reabrir' | 'rechazar' | null>(null);
  const [copied, setCopied] = useState(false);
  const { acciones } = data;
  const done = (message: string) => {
    toast(message);
    void reload();
  };

  const copy = async () => {
    await navigator.clipboard.writeText(data.codigo_ticket).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const reportEvidence = data.evidencias;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <Link href="/mis-solicitudes" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Volver al listado
        </Link>
        <span className="hidden h-6 w-px bg-praxis-line lg:block" aria-hidden="true" />
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl font-extrabold tracking-tight text-slate-900">#{data.codigo_ticket}</h1>
          <StatusBadge code={data.estado.codigo} name={data.estado.nombre} color={data.estado.color} size="md" />
          <IncidentFlags risk={data.es_riesgo_inmediato} />
          {data.es_seguimiento && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
              <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
              La sigues
            </span>
          )}
        </div>
        <button type="button" onClick={copy} className="btn-secondary">
          {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
          {copied ? 'Copiado' : 'Copiar código radicado'}
        </button>
      </div>

      {data.incidencia_principal && (
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4 sm:flex-row sm:items-center">
          <GitMerge className="h-5 w-5 shrink-0 text-violet-700" aria-hidden="true" />
          <p className="flex-1 text-sm text-violet-900">
            Esta solicitud se unificó con <span className="font-mono font-bold">{data.incidencia_principal.codigo_ticket}</span>, que reporta el mismo daño. Ahora recibes las actualizaciones de esa solicitud.
          </p>
          <Link href={`/mis-solicitudes/${data.incidencia_principal.id}`} className="btn-secondary">
            Ver solicitud principal
          </Link>
        </div>
      )}

      <AnimatePresence>
        {data.aclaracion_pendiente && acciones.puede_responder_aclaracion && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 rounded-2xl border border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 sm:flex-row sm:items-center"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="font-bold text-amber-950">Acción requerida: la mesa de ayuda necesita una aclaración</p>
              <p className="mt-0.5 text-sm text-amber-900">“{data.aclaracion_pendiente.pregunta}”</p>
              {data.aclaracion_pendiente.fecha_limite_respuesta && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-orange-800">
                  <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                  Responde antes del {formatDateTime(data.aclaracion_pendiente.fecha_limite_respuesta)} o la solicitud se cancelará.
                </p>
              )}
            </div>
            <button type="button" onClick={() => setDialog('aclaracion')} className="btn-warning shrink-0">
              <MessageSquareReply className="h-4 w-4" aria-hidden="true" />
              Responder y subsanar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {acciones.puede_confirmar && <ConfirmCard id={data.id} onDone={done} onReject={() => setDialog('rechazar')} />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="eyebrow">Detalles generales</h2>
            <p className="mt-2 text-lg font-bold text-slate-900">{data.resumen}</p>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field icon={<MapPin className="h-4 w-4" />} label="Ubicación física" value={data.ubicacion.espacio?.nombre ?? '—'} hint={[data.ubicacion.sede?.nombre, data.ubicacion.edificio?.nombre, data.ubicacion.piso?.nombre].filter(Boolean).join(' · ')} />
              <Field icon={<Tag className="h-4 w-4" />} label="Categoría" value={[data.categoria?.nombre, data.subcategoria?.nombre].filter(Boolean).join(' / ') || '—'} />
              <Field icon={<CalendarDays className="h-4 w-4" />} label="Fecha de radicación" value={formatDateTime(data.fecha_registro)} hint={`Actualizada ${formatRelative(data.fecha_actualizacion)}`} />
              <div>
                <dt className="text-xs font-semibold text-slate-500">Prioridad de atención</dt>
                <dd className="mt-1.5">
                  {data.prioridad ? <PriorityBadge code={data.prioridad.codigo} name={data.prioridad.nombre} color={data.prioridad.color} /> : <span className="text-sm text-slate-500">Se define en la revisión</span>}
                </dd>
              </div>
            </dl>
            <div className="mt-6 border-t border-praxis-line pt-5">
              <h3 className="text-xs font-semibold text-slate-500">Descripción del reporte</h3>
              <p className="mt-2 whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">{data.descripcion}</p>
            </div>
            {data.estado.significado && (
              <p className="mt-4 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
                <span className="font-semibold">{data.estado.nombre}:</span> {data.estado.significado}
              </p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="eyebrow mb-4">Evidencias ({reportEvidence.length})</h2>
            <EvidenceGallery items={reportEvidence} />
          </section>

          {(acciones.puede_cancelar || acciones.puede_reabrir || acciones.mensaje_cancelacion || data.estado.codigo === 'E15') && (
            <section className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
              <div className="flex-1 text-sm text-slate-600">
                {acciones.puede_cancelar && 'Si el daño ya no existe o lo reportaste por error, puedes cancelar la solicitud mientras no tenga técnico asignado.'}
                {!acciones.puede_cancelar && acciones.mensaje_cancelacion}
                {acciones.puede_reabrir && (
                  <>
                    ¿El problema volvió? Puedes reabrirla hasta el {formatDate(acciones.reapertura.fecha_limite)} ({acciones.reapertura.reaperturas_restantes} reapertura
                    {acciones.reapertura.reaperturas_restantes === 1 ? '' : 's'} disponible{acciones.reapertura.reaperturas_restantes === 1 ? '' : 's'}).
                  </>
                )}
                {!acciones.puede_reabrir && data.estado.codigo === 'E15' && acciones.reapertura.motivo && <>{acciones.reapertura.motivo}</>}
              </div>
              {acciones.puede_cancelar && (
                <button type="button" onClick={() => setDialog('cancelar')} className="btn-secondary text-red-600">
                  <Ban className="h-4 w-4" aria-hidden="true" />
                  Cancelar solicitud
                </button>
              )}
              {acciones.puede_reabrir && (
                <button type="button" onClick={() => setDialog('reabrir')} className="btn-dark">
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Reabrir solicitud
                </button>
              )}
              {!acciones.puede_reabrir && acciones.puede_crear_reporte_basado && (
                <Link href="/reportes/nuevo" className="btn-primary">
                  Crear un nuevo reporte
                </Link>
              )}
            </section>
          )}
        </div>

        <aside className="card p-6 lg:sticky lg:top-44">
          <h2 className="eyebrow mb-5">Trazabilidad técnica</h2>
          <StatusTimeline events={data.historial} />
        </aside>
      </div>

      <ClarificationDialog open={dialog === 'aclaracion'} onClose={() => setDialog(null)} data={data} onDone={done} />
      <ReasonDialog
        open={dialog === 'cancelar'}
        onClose={() => setDialog(null)}
        icon={<Ban className="h-5 w-5 text-red-600" />}
        title="Cancelar solicitud"
        description="La solicitud quedará cancelada y la mesa de ayuda dejará de atenderla. Esta acción no se puede deshacer."
        label="Motivo de la cancelación"
        placeholder="Ej.: el personal de vigilancia ya resolvió el problema"
        min={15}
        confirmLabel="Cancelar solicitud"
        tone="danger"
        onSubmit={(motivo) => requestService.cancelar(data.id, motivo).then((r) => done(r.mensaje))}
      />
      <ReasonDialog
        open={dialog === 'reabrir'}
        onClose={() => setDialog(null)}
        icon={<RotateCcw className="h-5 w-5" />}
        title="Reabrir solicitud"
        description="La prioridad pasará a Alta y la coordinación recibirá una alerta para revisarla de nuevo."
        label="¿Qué volvió a fallar?"
        min={20}
        confirmLabel="Reabrir solicitud"
        tone="dark"
        onSubmit={(motivo) => requestService.reabrir(data.id, motivo).then((r) => done(r.mensaje))}
      />
      <ReasonDialog
        open={dialog === 'rechazar'}
        onClose={() => setDialog(null)}
        icon={<ThumbsDown className="h-5 w-5 text-orange-600" />}
        title="El problema no quedó resuelto"
        description="La solicitud volverá a corrección para que el equipo técnico la revise."
        label="Cuéntanos qué sigue fallando"
        min={10}
        confirmLabel="Enviar a corrección"
        tone="warning"
        onSubmit={(motivo) => requestService.rechazarConformidad(data.id, motivo).then((r) => done(r.mensaje))}
      />
    </div>
  );
}

function Field({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
        <span className="text-slate-400">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 font-semibold text-slate-900">{value}</dd>
      {hint && <dd className="text-xs text-slate-500">{hint}</dd>}
    </div>
  );
}

/** Confirmación de cierre con calificación del servicio (E14, KAN-277). */
function ConfirmCard({ id, onDone, onReject }: { id: string; onDone: (message: string) => void; onReject: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const labels = ['', 'Muy insatisfecho', 'Insatisfecho', 'Aceptable', 'Satisfecho', 'Excelente'];

  const confirm = async () => {
    if (!rating) {
      setError('Elige una calificación de 1 a 5 estrellas.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await requestService.confirmar(id, rating, comment.trim());
      onDone(result.mensaje);
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo confirmar la solución.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50"
    >
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="text-lg font-bold text-slate-900">El trabajo terminó y fue verificado. ¿Quedó resuelto?</p>
          <p className="mt-1 text-sm text-slate-600">Califica la atención para cerrar la solicitud. Si el problema continúa, envíala a corrección.</p>
          <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Calificación del servicio" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= (hover || rating);
              return (
                <motion.button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} estrella${n === 1 ? '' : 's'}`}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => {
                    setRating(n);
                    setError('');
                  }}
                  whileTap={{ scale: 0.85 }}
                  className="rounded-lg p-1"
                >
                  <Star className={`h-8 w-8 transition ${active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
                </motion.button>
              );
            })}
            <span className="ml-2 text-sm font-semibold text-slate-600">{labels[hover || rating]}</span>
          </div>
          <label htmlFor="confirm-comment" className="sr-only">
            Comentario
          </label>
          <textarea
            id="confirm-comment"
            rows={2}
            maxLength={500}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comentario opcional sobre la atención"
            className="field mt-3 max-w-xl bg-white"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex flex-col gap-2 md:w-56">
          <button type="button" onClick={confirm} disabled={busy} className="btn-primary h-12 bg-none bg-emerald-600 hover:bg-emerald-500">
            <Check className="h-4 w-4" aria-hidden="true" />
            {busy ? 'Confirmando…' : 'Confirmar solución'}
          </button>
          <button type="button" onClick={onReject} disabled={busy} className="btn-secondary h-12">
            <ThumbsDown className="h-4 w-4" aria-hidden="true" />
            Sigue fallando
          </button>
        </div>
      </div>
    </motion.section>
  );
}

/** Respuesta a la aclaración con evidencias opcionales (HU-4.3, KAN-182). */
function ClarificationDialog({ open, onClose, data, onDone }: { open: boolean; onClose: () => void; data: SolicitudDetalle; onDone: (message: string) => void }) {
  const [answer, setAnswer] = useState('');
  const [files, setFiles] = useState<Evidencia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const length = answer.trim().length;

  const submit = async () => {
    if (length === 0 || length > 500) {
      setError(length === 0 ? 'Escribe tu respuesta.' : 'Máximo 500 caracteres.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await requestService.responderAclaracion(data.id, answer.trim(), files.map((f) => f.id));
      setAnswer('');
      setFiles([]);
      onClose();
      onDone(result.mensaje);
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo enviar la aclaración.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={busy}
      size="lg"
      icon={<MessageSquareReply className="h-5 w-5" />}
      title="Responder aclaración"
      description={data.aclaracion_pendiente ? `“${data.aclaracion_pendiente.pregunta}”` : undefined}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Volver
          </button>
          <button type="button" className="btn-warning" onClick={submit} disabled={busy || uploading}>
            {busy ? 'Enviando…' : 'Enviar aclaración'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="clarify" className="field-label">
              Tu respuesta
            </label>
            <span className={`text-xs tabular-nums ${length > 500 ? 'text-red-600' : 'text-slate-400'}`}>{length} / 500</span>
          </div>
          <textarea id="clarify" rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} className="field resize-y" placeholder="Describe lo que te preguntaron con el mayor detalle posible." />
        </div>
        <div>
          <p className="field-label">Fotos adicionales (opcional)</p>
          <EvidenceUploader value={files} onChange={setFiles} onBusyChange={setUploading} />
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </Modal>
  );
}
