"use client";

import { motion, useReducedMotion } from 'motion/react';
import { Paperclip } from 'lucide-react';
import type { EventoHistorial } from '@/types/incident';
import { TONE_CLASSES, stateTone } from '@/lib/tones';
import { formatDateTime } from '@/lib/format';

const EVENT_LABELS: Record<string, string> = {
  CREACION: 'Reporte registrado',
  CAMBIO_ESTADO: 'Cambio de estado',
  ACLARACION_SOLICITADA: 'Se pidió una aclaración',
  ACLARACION_RESPONDIDA: 'Aclaración respondida',
  ASIGNACION: 'Técnico asignado',
  REASIGNACION: 'Técnico reasignado',
  PRIORIDAD: 'Prioridad actualizada',
  CAMBIO_PRIORIDAD: 'Prioridad actualizada',
  CLASIFICACION: 'Clasificación',
  EVALUACION_RIESGO: 'Evaluación de riesgo',
  DIAGNOSTICO: 'Diagnóstico registrado',
  PROGRAMACION: 'Intervención programada',
  REPROGRAMACION: 'Intervención reprogramada',
  INTERVENCION: 'Intervención registrada',
  VERIFICACION: 'Verificación de calidad',
  SUSPENSION: 'Atención suspendida',
  REANUDACION: 'Atención reanudada',
  CONFIRMACION: 'Solución confirmada',
  REAPERTURA: 'Solicitud reabierta',
  CANCELACION: 'Solicitud cancelada',
  DUPLICADO_VINCULADO: 'Unificada con otra solicitud',
};

const ROLE_LABELS: Record<string, string> = {
  R01: 'Reportante',
  R02: 'Mesa de ayuda',
  R03: 'Coordinación',
  R04: 'Técnico',
  R05: 'Autorizaciones',
  R06: 'Verificación',
  R07: 'Administración',
};

function eventTitle(event: EventoHistorial): string {
  if (event.estado_nuevo && (!event.tipo_evento || event.tipo_evento === 'CAMBIO_ESTADO')) return event.estado_nuevo.nombre;
  return EVENT_LABELS[event.tipo_evento] ?? event.tipo_evento.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

/** Línea de tiempo vertical de la trazabilidad, del evento más reciente al más antiguo. */
export default function StatusTimeline({ events, compact = false }: { events: EventoHistorial[]; compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  const ordered = [...events].sort((a, b) => new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime());

  if (ordered.length === 0) return <p className="text-sm text-slate-500">Sin movimientos registrados.</p>;

  return (
    <ol className="relative">
      {ordered.map((event, index) => {
        const tone = TONE_CLASSES[stateTone(event.estado_nuevo?.codigo)];
        const latest = index === 0;
        const who = event.usuario?.name ?? event.usuario?.nombre;
        return (
          <motion.li
            key={event.id}
            className="relative pb-6 pl-8 last:pb-0"
            initial={reduceMotion ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index, 8) * 0.04 }}
          >
            {index < ordered.length - 1 && <span className="absolute left-[7px] top-4 h-full w-px bg-slate-200" aria-hidden="true" />}
            <span className={`absolute left-0 top-1 flex h-[15px] w-[15px] items-center justify-center rounded-full ring-4 ring-white ${latest ? tone.dot : 'bg-slate-300'}`} aria-hidden="true">
              {latest && <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${tone.dot}`} />}
            </span>
            <p className={`text-sm font-bold ${latest ? tone.text : 'text-slate-800'}`}>{eventTitle(event)}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {formatDateTime(event.fecha_hora)}
              {(who || event.rol) && ` · ${who ?? ''}${who && event.rol ? ' · ' : ''}${event.rol ? ROLE_LABELS[event.rol] ?? event.rol : ''}`}
            </p>
            {event.motivo && !compact && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{event.motivo}</p>}
            {event.evidencias && event.evidencias.length > 0 && !compact && (
              <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500">
                <Paperclip className="h-3.5 w-3.5" aria-hidden="true" />
                {event.evidencias.length} evidencia{event.evidencias.length === 1 ? '' : 's'}
              </p>
            )}
          </motion.li>
        );
      })}
    </ol>
  );
}
