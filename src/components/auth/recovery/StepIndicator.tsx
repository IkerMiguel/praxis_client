"use client";

import { motion, useReducedMotion } from 'motion/react';

export const RECOVERY_STEPS = ['Correo', 'Código', 'Contraseña'] as const;

/** Progreso del restablecimiento como una regla de cotas; un valor mayor al total marca todo como completado. */
export default function StepIndicator({ current }: { current: number }) {
  const reduceMotion = useReducedMotion();
  const total = RECOVERY_STEPS.length;
  const progress = Math.min(current - 1, total) / total;

  return (
    <nav aria-label="Progreso de recuperación">
      <p className="sr-only">{current > total ? 'Proceso completado' : `Paso ${current} de ${total}: ${RECOVERY_STEPS[current - 1]}`}</p>
      <div aria-hidden="true">
        <div className="relative h-3">
          <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-[#C9D6E3]" />
          <motion.span
            className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-gradient-to-r from-[#0A65A8] to-[#35BE8B]"
            initial={false}
            animate={{ width: `${Math.max(progress, current <= total ? (current - 0.5) / total : 1) * 100}%` }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
          {[0, 1, 2, 3].map((tick) => (
            <span key={tick} className={`absolute top-0 h-3 w-px ${tick / total <= progress ? 'bg-[#0A65A8]' : 'bg-[#C9D6E3]'}`} style={{ left: `calc(${(tick / total) * 100}% - ${tick === total ? 1 : 0}px)` }} />
          ))}
        </div>
        <ol className="mt-1.5 grid grid-cols-3 text-[12px]">
          {RECOVERY_STEPS.map((label, index) => {
            const step = index + 1;
            const done = step < current;
            const active = step === current;
            return (
              <li key={label} className={`text-center font-semibold transition-colors ${active ? 'text-[#0B1B3A]' : done ? 'text-[#1F9D6B]' : 'text-slate-400'}`}>
                {label}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
