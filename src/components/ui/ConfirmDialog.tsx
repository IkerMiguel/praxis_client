"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { CircleHelp, LogOut, Power, ShieldAlert, Trash2, TriangleAlert, type LucideIcon } from 'lucide-react';

export type ConfirmTone = 'danger' | 'warning' | 'primary';

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  /** Dato destacado (nombre del registro, código del ticket…). */
  subject?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  icon?: 'delete' | 'power' | 'logout' | 'alert' | 'shield' | 'question';
}

interface Pending extends ConfirmOptions {
  id: number;
  resolve: (ok: boolean) => void;
}

let current: Pending | null = null;
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Pide confirmación con el diálogo de PRAXIS (reemplaza window.confirm). Resuelve true si la persona confirma. */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  current?.resolve(false);
  return new Promise((resolve) => {
    current = { ...options, id: ++seq, resolve };
    emit();
  });
}

function settle(ok: boolean) {
  if (!current) return;
  current.resolve(ok);
  current = null;
  emit();
}

const ICONS: Record<NonNullable<ConfirmOptions['icon']>, LucideIcon> = {
  delete: Trash2,
  power: Power,
  logout: LogOut,
  alert: TriangleAlert,
  shield: ShieldAlert,
  question: CircleHelp,
};

const TONES: Record<ConfirmTone, { badge: string; ring: string; button: string; bar: string }> = {
  danger: { badge: 'bg-red-50 text-red-600', ring: 'bg-red-400/25', button: 'btn-danger', bar: 'from-red-500 to-rose-400' },
  warning: { badge: 'bg-amber-50 text-amber-600', ring: 'bg-amber-400/25', button: 'btn-warning', bar: 'from-amber-500 to-orange-400' },
  primary: { badge: 'bg-sky-50 text-praxis-blue', ring: 'bg-sky-400/25', button: 'btn-primary', bar: 'from-praxis-blue via-praxis-sky to-praxis-green' },
};

/** Monta el diálogo de confirmación una sola vez (AppShell). */
export default function ConfirmHost() {
  const pending = useSyncExternalStore(subscribe, () => current, () => null);
  const reduceMotion = useReducedMotion();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!pending) return;
    const previous = document.activeElement as HTMLElement | null;
    // En acciones destructivas el foco inicial va a "Cancelar" para evitar confirmar con un Enter accidental.
    const timer = setTimeout(() => (pending.tone === 'danger' ? cancelRef : confirmRef).current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
      if (e.key === 'Tab') {
        const first = cancelRef.current;
        const last = confirmRef.current;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus();
    };
  }, [pending]);

  if (typeof document === 'undefined') return null;

  const tone = TONES[pending?.tone ?? 'primary'];
  const Icon = ICONS[pending?.icon ?? (pending?.tone === 'danger' ? 'delete' : pending?.tone === 'warning' ? 'alert' : 'question')];

  return createPortal(
    <AnimatePresence>
      {pending && (
        <motion.div key={pending.id} className="fixed inset-0 z-[90] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[3px]" onClick={() => settle(false)} aria-hidden="true" />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby={pending.description ? 'confirm-description' : undefined}
            className="relative w-full max-w-[420px] overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/25"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          >
            <span className={`block h-1.5 bg-gradient-to-r ${tone.bar}`} aria-hidden="true" />
            <div className="px-6 pb-6 pt-7 text-center sm:px-8">
              <span className="relative mx-auto flex h-16 w-16 items-center justify-center">
                {!reduceMotion && (
                  <motion.span
                    className={`absolute inset-0 rounded-2xl ${tone.ring}`}
                    initial={{ scale: 0.8, opacity: 0.9 }}
                    animate={{ scale: 1.45, opacity: 0 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                    aria-hidden="true"
                  />
                )}
                <motion.span
                  className={`relative flex h-16 w-16 items-center justify-center rounded-2xl ${tone.badge}`}
                  initial={reduceMotion ? false : { scale: 0.5, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.05 }}
                >
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </motion.span>
              </span>

              <h2 id="confirm-title" className="mt-5 text-xl font-extrabold tracking-tight text-slate-900">
                {pending.title}
              </h2>
              {pending.subject && (
                <p className="mx-auto mt-3 inline-flex max-w-full items-center rounded-full border border-praxis-line bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-800">
                  <span className="truncate">{pending.subject}</span>
                </p>
              )}
              {pending.description && (
                <p id="confirm-description" className="mt-3 text-sm leading-relaxed text-slate-500">
                  {pending.description}
                </p>
              )}

              <div className="mt-7 grid grid-cols-2 gap-3">
                <button ref={cancelRef} type="button" onClick={() => settle(false)} className="btn-secondary h-12 w-full">
                  {pending.cancelLabel ?? 'Cancelar'}
                </button>
                <button ref={confirmRef} type="button" onClick={() => settle(true)} className={`${tone.button} h-12 w-full`}>
                  {pending.confirmLabel ?? 'Confirmar'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
