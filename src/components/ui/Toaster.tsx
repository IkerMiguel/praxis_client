"use client";

import { useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

/** Muestra un aviso breve en la esquina inferior; se cierra solo. */
export function toast(message: string, tone: ToastTone = 'success') {
  const id = ++seq;
  items = [...items.slice(-3), { id, message, tone }];
  emit();
  setTimeout(() => dismiss(id), tone === 'error' ? 7000 : 4500);
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const ICONS = { success: CheckCircle2, error: CircleAlert, info: Info };
const TONES = {
  success: 'border-emerald-200 bg-white text-slate-900 [&_svg.tone]:text-emerald-500',
  error: 'border-red-200 bg-white text-slate-900 [&_svg.tone]:text-red-500',
  info: 'border-sky-200 bg-white text-slate-900 [&_svg.tone]:text-sky-500',
};

export default function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => items);
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[95] flex w-[min(380px,calc(100vw-2.5rem))] flex-col gap-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {list.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40 }}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl shadow-slate-900/10 ${TONES[t.tone]}`}
              role={t.tone === 'error' ? 'alert' : 'status'}
            >
              <Icon className="tone mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button type="button" onClick={() => dismiss(t.id)} className="rounded p-0.5 text-slate-400 hover:text-slate-700" aria-label="Cerrar aviso">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
