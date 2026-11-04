"use client";

import { Fragment } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, KeyRound, LockKeyhole, Mail, type LucideIcon } from 'lucide-react';

export const RECOVERY_STEPS = ['Correo', 'Código', 'Contraseña'] as const;
const ICONS: LucideIcon[] = [Mail, KeyRound, LockKeyhole];

/** Progreso del restablecimiento: un nodo con ícono por paso unido por conectores que se llenan; un valor mayor al total marca todo como completado. */
export default function StepIndicator({ current }: { current: number }) {
  const reduceMotion = useReducedMotion();
  const total = RECOVERY_STEPS.length;
  const spring = reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 300, damping: 24 };

  return (
    <nav aria-label="Progreso de recuperación">
      <p className="sr-only">{current > total ? 'Proceso completado' : `Paso ${current} de ${total}: ${RECOVERY_STEPS[current - 1]}`}</p>
      <ol className="flex items-start" aria-hidden="true">
        {RECOVERY_STEPS.map((label, index) => {
          const step = index + 1;
          const done = step < current;
          const active = step === current;
          const Icon = done ? Check : ICONS[index];
          return (
            <Fragment key={label}>
              <li className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                <span className="relative flex h-10 w-10 items-center justify-center">
                  {active && !reduceMotion && (
                    <motion.span
                      className="absolute inset-0 rounded-full bg-[#1CA3E9]/25"
                      initial={{ scale: 0.8, opacity: 0.9 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                    />
                  )}
                  <motion.span
                    className="relative flex h-10 w-10 items-center justify-center rounded-full border-2"
                    initial={false}
                    animate={{
                      backgroundColor: done ? '#1F9D6B' : active ? '#0B1B3A' : '#FFFFFF',
                      borderColor: done ? '#1F9D6B' : active ? '#0B1B3A' : '#C9D6E3',
                      color: done || active ? '#FFFFFF' : '#94A3B8',
                      scale: active ? 1.08 : 1,
                    }}
                    transition={spring}
                  >
                    <motion.span key={done ? 'done' : 'icon'} initial={reduceMotion ? false : { scale: 0.4, rotate: -45, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={spring}>
                      <Icon className="h-[18px] w-[18px]" strokeWidth={done ? 3 : 2} />
                    </motion.span>
                  </motion.span>
                </span>
                <span className={`text-[12px] font-semibold transition-colors ${active ? 'text-[#0B1B3A]' : done ? 'text-[#1F9D6B]' : 'text-slate-400'}`}>{label}</span>
              </li>
              {index < total - 1 && (
                <li className="relative mt-5 h-[3px] flex-1 overflow-hidden rounded-full bg-[#E3EAF2]">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#1F9D6B] to-[#1CA3E9]"
                    initial={false}
                    animate={{ width: done ? '100%' : '0%' }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  />
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
