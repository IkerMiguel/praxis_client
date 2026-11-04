"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, ClipboardCopy, Plus, Printer, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badges';
import { useSession } from '@/lib/session/SessionProvider';
import { formatLongDate, formatTime } from '@/lib/format';
import type { Radicada } from '@/services/reportService';
import Barcode39 from './Barcode39';

interface ReportConfirmationProps {
  result: Radicada;
  ubicacion: string[];
  categoria: string;
  subcategoria?: string;
  onNew: () => void;
}

/** Duración de la "impresión" del comprobante; el sello y los siguientes pasos se sincronizan con ella. */
const PRINT_SECONDS = 1.5;
const STAMP_DELAY = PRINT_SECONDS + 0.25;

const NEXT_STEPS = [
  { title: 'Reporte radicado', text: 'Quedó registrado y la coordinación ya fue notificada.' },
  { title: 'Clasificación', text: 'Coordinación revisa el daño y le asigna una prioridad.' },
  { title: 'Asignación técnica', text: 'Un técnico de la especialidad recibe la orden de trabajo.' },
  { title: 'Atención y cierre', text: 'Se repara, se verifica la calidad y te pedimos confirmar.' },
];

/** Comprobante de radicación que sale de la impresora, recibe el sello y se puede imprimir de verdad. */
export default function ReportConfirmation({ result, ubicacion, categoria, subcategoria, onNew }: ReportConfirmationProps) {
  const { profile } = useSession();
  const reduceMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const [printing, setPrinting] = useState(false);
  const animate = !reduceMotion;

  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done);
    const frame = requestAnimationFrame(() => window.print());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('afterprint', done);
    };
  }, [printing]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.codigo_ticket);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const ticketProps = { result, ubicacion, categoria, subcategoria, reportante: profile?.nombre };
  const ticket = <Ticket {...ticketProps} />;

  return (
    <div className="mx-auto grid max-w-5xl items-start gap-10 py-2 lg:grid-cols-[440px_minmax(0,1fr)] lg:gap-14">
      {/* Impresora y comprobante */}
      <div className="mx-auto w-full max-w-[440px]">
        <div className="relative z-10 flex h-11 items-center justify-between rounded-2xl bg-[#0B1B3A] px-5 shadow-[0_12px_30px_-12px_rgba(11,27,58,0.6)]">
          <span className="text-[12px] font-semibold text-slate-300">PRAXIS, mesa de radicación</span>
          <motion.span
            className="h-2 w-2 rounded-full bg-[#35BE8B]"
            animate={animate ? { opacity: [1, 0.25, 1] } : undefined}
            transition={{ duration: 0.35, repeat: Math.round(PRINT_SECONDS / 0.35), ease: 'linear' }}
            aria-hidden="true"
          />
          <span className="absolute inset-x-6 -bottom-1 h-2 rounded-b-md bg-[#06101F]" aria-hidden="true" />
        </div>
        <div className="-mx-4 -mt-1 overflow-hidden px-7 pb-12">
          <motion.div
            initial={animate ? { y: '-102%' } : false}
            animate={{ y: '0%' }}
            transition={{ duration: PRINT_SECONDS, ease: [0.45, 0, 0.2, 1] }}
          >
            <motion.div
              initial={false}
              animate={animate ? { rotate: [0, -0.6, 0.4, 0], y: [0, 3, 0] } : undefined}
              transition={{ delay: STAMP_DELAY + 0.12, duration: 0.3 }}
            >
              {ticket}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Mensaje, siguientes pasos y acciones */}
      <div className="lg:pt-4">
        <motion.div initial={animate ? { opacity: 0, y: 12 } : false} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <p className="flex items-center gap-2 text-sm font-semibold text-[#1F9D6B]">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1F9D6B] text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
            </span>
            Comprobante emitido
          </p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#0B1B3A] sm:text-[40px]">Tu reporte ya está en manos de mantenimiento</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-slate-600">
            Guarda el código <span className="font-bold text-[#0B1B3A]">{result.codigo_ticket}</span> para consultar el avance.
            {profile && <> Te avisaremos en la plataforma y en {profile.email}.</>}
          </p>
        </motion.div>

        {result.es_riesgo_inmediato && (
          <motion.p
            initial={animate ? { opacity: 0, y: 8 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-5 flex items-start gap-3 rounded-xl border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
          >
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            Riesgo inmediato: quedó en prioridad crítica y se alertó a la mesa de ayuda y a coordinación.
          </motion.p>
        )}

        <ol className="relative mt-8 space-y-5" aria-label="Qué sigue con tu reporte">
          <span className="absolute bottom-3 left-[13px] top-3 w-px bg-[#D7E2ED]" aria-hidden="true" />
          {NEXT_STEPS.map((step, i) => {
            const done = i === 0;
            return (
              <motion.li
                key={step.title}
                className="relative flex gap-4"
                initial={animate ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: STAMP_DELAY + 0.2 + i * 0.12, duration: 0.35 }}
              >
                <span
                  className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${
                    done ? 'bg-[#1F9D6B] text-white' : 'border-2 border-[#C9D6E3] bg-white text-slate-500'
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : i + 1}
                </span>
                <div className="pt-0.5">
                  <p className={`text-[15px] font-bold ${done ? 'text-[#1F9D6B]' : 'text-[#0B1B3A]'}`}>
                    {step.title}
                    {done && <span className="sr-only"> (completado)</span>}
                  </p>
                  <p className="text-sm text-slate-500">{step.text}</p>
                </div>
              </motion.li>
            );
          })}
        </ol>

        <motion.div
          className="mt-9 space-y-3"
          initial={animate ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: STAMP_DELAY + 0.7, duration: 0.4 }}
        >
          <Link href={`/mis-solicitudes/${result.id}`} className="btn-primary group h-[52px] w-full text-[15px]">
            Seguir este reporte
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => setPrinting(true)} className="btn-secondary h-12">
              <Printer className="h-4 w-4" aria-hidden="true" />
              Imprimir comprobante
            </button>
            <button type="button" onClick={copy} className="btn-secondary h-12" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={String(copied)} className="flex items-center gap-2" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                  {copied ? <Check className="h-4 w-4 text-[#1F9D6B]" aria-hidden="true" /> : <ClipboardCopy className="h-4 w-4" aria-hidden="true" />}
                  {copied ? 'Código copiado' : 'Copiar código'}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm">
            <button type="button" onClick={onNew} className="inline-flex items-center gap-1.5 font-semibold text-[#0A65A8] underline-offset-4 hover:underline">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Crear otro reporte
            </button>
            <Link href="/mis-solicitudes" className="font-semibold text-[#0A65A8] underline-offset-4 hover:underline">
              Ver todas mis solicitudes
            </Link>
          </div>
        </motion.div>
      </div>

      {printing && createPortal(<div className="praxis-print-root"><Ticket {...ticketProps} still /></div>, document.body)}
    </div>
  );
}

interface TicketProps {
  result: Radicada;
  ubicacion: string[];
  categoria: string;
  subcategoria?: string;
  reportante?: string;
  /** Sin animaciones (copia para imprimir). */
  still?: boolean;
}

/** El comprobante en papel: cabecera, código, renglones con guías punteadas, perforación y talón con código de barras. */
function Ticket({ result, ubicacion, categoria, subcategoria, reportante, still = false }: TicketProps) {
  const reduceMotion = useReducedMotion() || still;
  const [sede, ...resto] = ubicacion;
  const espacio = resto.at(-1) ?? sede ?? '';
  const ruta = [sede, ...resto.slice(0, -1)].filter(Boolean).join(', ');

  return (
    <article className="praxis-ticket relative text-[#0B1B3A] [filter:drop-shadow(0_12px_16px_rgba(11,27,58,0.14))]" aria-label={`Comprobante del ticket ${result.codigo_ticket}`}>
      <div className="relative rounded-t-md bg-white px-7 pb-6 pt-7">
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/images/Logo2.png" alt="" className="h-8 w-8 object-contain" />
            <div className="leading-tight">
              <p className="text-[15px] font-extrabold">PRAXIS</p>
              <p className="text-[11px] text-slate-500">Comprobante de radicación</p>
            </div>
          </div>
        </header>


        <div className="mt-6 border-y border-dashed border-[#C9D6E3] py-5">
          <p className="text-[12px] font-semibold text-slate-500">Código del ticket</p>
          <p className="ticket-code mt-1 whitespace-nowrap text-[26px] font-extrabold leading-none tracking-[-0.01em] tabular-nums sm:text-[34px]">{result.codigo_ticket}</p>
          {result.es_riesgo_inmediato && (
          <p className="mt-4 flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-[12px] font-bold text-white">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            Riesgo inmediato, prioridad crítica
          </p>
        )}
        </div>

        <dl className="mt-5 space-y-2.5 text-[13px]">
          <Row label="Fecha" value={formatLongDate(result.fecha_registro)} />
          <Row label="Hora" value={formatTime(result.fecha_registro)} />
          <Row label="Espacio" value={espacio} />
          {ruta && <Row label="Ubicación" value={ruta} />}
          <Row label="Categoría" value={[categoria, subcategoria].filter(Boolean).join(', ')} />
          {reportante && <Row label="Reportado por" value={reportante} />}
          <div className="flex items-center justify-between gap-3 pt-1">
            <dt className="text-slate-500">Estado</dt>
            <dd>
              <StatusBadge code={result.estado.codigo} name={result.estado.nombre} />
            </dd>
          </div>
        </dl>

        {/* Sello de radicado */}
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute right-5 top-5 select-none"
          initial={reduceMotion ? false : { opacity: 0, scale: 2.6, rotate: -4 }}
          animate={{ opacity: 0.88, scale: 1, rotate: -14 }}
          transition={reduceMotion ? undefined : { delay: STAMP_DELAY, duration: 0.22, ease: [0.5, 0, 0.75, 0] }}
        >
          <div className="rounded-lg border-[3px] border-[#1F9D6B] px-3 py-1.5 text-center text-[#1F9D6B] [mix-blend-mode:multiply]">
            <p className="text-[16px] font-black leading-none tracking-[0.08em] sm:text-[19px]">RADICADO</p>
            <p className="mt-1 border-t-2 border-[#1F9D6B] pt-1 text-[10px] font-bold tabular-nums">{formatTime(result.fecha_registro)}</p>
          </div>
        </motion.div>
      </div>

      {/* Perforación con muescas laterales */}
      <div className="relative h-6 bg-white" aria-hidden="true">
        <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-praxis-surface" />
        <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-praxis-surface" />
        <span className="absolute inset-x-5 top-1/2 border-t-2 border-dotted border-[#C9D6E3]" />
      </div>

      {/* Talón */}
      <div className="bg-white px-7 pb-5 pt-3 text-center">
        <div className="mx-auto px-4">
          <Barcode39 value={result.codigo_ticket} className="h-14 w-full text-[#0B1B3A]" />
        </div>
        <p className="mt-2 text-[12px] font-semibold tracking-[0.2em] tabular-nums">{result.codigo_ticket}</p>
        <p className="mt-1 text-[11px] text-slate-500">Consulta el avance con este código en Mis solicitudes.</p>
      </div>
      {/* Borde rasgado del papel */}
      <div
        aria-hidden="true"
        className="h-2.5"
        style={{
          background: 'linear-gradient(135deg, #fff 50%, transparent 50%) 0 0 / 14px 14px repeat-x, linear-gradient(225deg, #fff 50%, transparent 50%) 0 0 / 14px 14px repeat-x',
        }}
      />
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="shrink-0 text-slate-500">{label}</dt>
      <span className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-[#C9D6E3]" aria-hidden="true" />
      <dd className="max-w-[72%] text-right font-semibold [text-wrap:balance]">{value}</dd>
    </div>
  );
}
