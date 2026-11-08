"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleAlert, Info, TriangleAlert, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info' | 'warning';
interface ToastItem {
  id: number;
  title: string;
  message: string;
  tone: ToastTone;
  duration: number;
}

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

const TITLES: Record<ToastTone, string> = {
  success: 'Listo',
  error: 'No se pudo completar',
  info: 'Aviso',
  warning: 'Atención',
};

/** Muestra un aviso con título en la esquina inferior; se cierra solo y se pausa al pasar el cursor. */
export function toast(message: string, tone: ToastTone = 'success', title?: string) {
  const id = ++seq;
  items = [...items.slice(-3), { id, message, tone, title: title ?? TITLES[tone], duration: tone === 'error' ? 7000 : 4500 }];
  emit();
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const STYLES: Record<ToastTone, { badge: string; accent: string; bar: string; title: string }> = {
  success: { badge: 'bg-emerald-500 text-white shadow-emerald-600/30', accent: 'bg-emerald-500', bar: 'bg-emerald-500', title: 'text-emerald-700' },
  error: { badge: 'bg-red-500 text-white shadow-red-600/30', accent: 'bg-red-500', bar: 'bg-red-500', title: 'text-red-700' },
  info: { badge: 'bg-praxis-blue text-white shadow-sky-700/30', accent: 'bg-praxis-blue', bar: 'bg-praxis-sky', title: 'text-sky-800' },
  warning: { badge: 'bg-amber-500 text-white shadow-amber-600/30', accent: 'bg-amber-500', bar: 'bg-amber-500', title: 'text-amber-700' },
};

/** Check que se dibuja al aparecer el aviso de éxito. */
function SuccessIcon() {
  const reduceMotion = useReducedMotion();
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
      <motion.path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.15, duration: 0.35 }} />
    </svg>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const remaining = useRef(item.duration);
  const startedAt = useRef(0);
  const style = STYLES[item.tone];
  const Icon = item.tone === 'error' ? CircleAlert : item.tone === 'warning' ? TriangleAlert : Info;

  useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => dismiss(item.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, item.id]);

  return (
    <motion.div
      layout
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 60, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto relative overflow-hidden rounded-2xl border border-praxis-line bg-white shadow-2xl shadow-slate-900/15"
      role={item.tone === 'error' ? 'alert' : 'status'}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${style.accent}`} aria-hidden="true" />
      <div className="flex items-start gap-3 py-3.5 pl-5 pr-3">
        <motion.span
          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg ${style.badge}`}
          initial={reduceMotion ? false : { scale: 0.4, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 15 }}
        >
          {item.tone === 'success' ? <SuccessIcon /> : <Icon className="h-5 w-5" aria-hidden="true" />}
        </motion.span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className={`text-sm font-bold ${style.title}`}>{item.title}</p>
          <p className="mt-0.5 text-sm leading-snug text-slate-600">{item.message}</p>
        </div>
        <button type="button" onClick={() => dismiss(item.id)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar aviso">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      {/* Tiempo restante del aviso; se detiene al pasar el cursor */}
      <span className="absolute inset-x-0 bottom-0 h-[3px] bg-slate-100" aria-hidden="true">
        <span
          className={`block h-full origin-left ${style.bar}`}
          style={{ animation: reduceMotion ? 'none' : `praxis-toast-countdown ${item.duration}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }}
        />
      </span>
    </motion.div>
  );
}

export default function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => items);
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[95] flex w-[min(400px,calc(100vw-2.5rem))] flex-col gap-2.5" aria-live="polite">
      <AnimatePresence initial={false}>
        {list.map((t) => (
          <ToastCard key={t.id} item={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
