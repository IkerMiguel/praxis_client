"use client";

import { motion, useReducedMotion } from 'motion/react';

export const RECOVERY_STEPS = ['Tu correo', 'Revisa tu bandeja', 'Nueva contraseña'] as const;

interface StepIndicatorProps {
  /** Paso actual, empezando en 1. Un valor mayor al total marca todo como completado. */
  current: number;
}

export default function StepIndicator({ current }: StepIndicatorProps) {
  const reduceMotion = useReducedMotion();
  const total = RECOVERY_STEPS.length;
  const progress = Math.min(Math.max(current - 1, 0), total - 1) / (total - 1);
  const transition = reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 140, damping: 22 };

  return (
    <nav aria-label="Progreso de recuperación">
      <p className="sr-only">
        {current > total ? 'Proceso completado' : `Paso ${current} de ${total}: ${RECOVERY_STEPS[current - 1]}`}
      </p>

      <div className="relative" aria-hidden="true">
        {/* Riel que conecta los centros del primer y último paso */}
        <div className="absolute top-4 left-[16.66%] right-[16.66%] h-0.5 rounded-full bg-slate-200">
          <motion.div
            className="h-full origin-left rounded-full bg-[#35BE8B]"
            initial={false}
            animate={{ scaleX: progress }}
            transition={transition}
          />
        </div>

        <ol className="relative grid grid-cols-3 gap-x-3">
          {RECOVERY_STEPS.map((label, index) => {
            const step = index + 1;
            const done = step < current;
            const active = step === current;

            return (
              <li key={label} className="relative flex flex-col items-center gap-2 px-1 text-center">
                <motion.span
                  className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    done
                      ? 'border-[#35BE8B] bg-[#35BE8B] text-white'
                      : active
                        ? 'border-[#132240] bg-[#132240] text-white'
                        : 'border-slate-200 bg-white text-slate-400'
                  }`}
                  initial={false}
                  animate={{ scale: active ? 1.12 : 1 }}
                  transition={transition}
                >
                  {done ? (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <motion.path
                        d="M5 13l4 4L19 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={reduceMotion ? false : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                      />
                    </svg>
                  ) : (
                    step
                  )}
                  {active && !reduceMotion && (
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-[#1CA3E9]"
                      initial={{ scale: 1, opacity: 0.7 }}
                      animate={{ scale: 1.7, opacity: 0 }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                </motion.span>
                <span
                  className={`text-[11px] sm:text-xs font-semibold leading-tight ${
                    active ? 'text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
