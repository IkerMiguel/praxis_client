"use client";

import { motion, useReducedMotion } from 'motion/react';

export const RECOVERY_STEPS = ['Correo', 'Código', 'Contraseña'] as const;

/** Progreso compacto del restablecimiento; un valor mayor al total marca todo como completado. */
export default function StepIndicator({ current }: { current: number }) {
  const reduceMotion = useReducedMotion();
  const total = RECOVERY_STEPS.length;

  return (
    <nav aria-label="Progreso de recuperación">
      <p className="sr-only">{current > total ? 'Proceso completado' : `Paso ${current} de ${total}: ${RECOVERY_STEPS[current - 1]}`}</p>
      <ol className="flex items-center gap-2" aria-hidden="true">
        {RECOVERY_STEPS.map((label, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li key={label} className="flex flex-1 flex-col gap-1.5">
              <span className="h-1 overflow-hidden rounded-full bg-slate-200">
                <motion.span
                  className="block h-full rounded-full"
                  style={{ backgroundColor: done ? '#35BE8B' : '#111827' }}
                  initial={false}
                  animate={{ width: done || active ? '100%' : '0%' }}
                  transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
                />
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? 'text-slate-900' : done ? 'text-emerald-600' : 'text-slate-400'}`}>{label}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
