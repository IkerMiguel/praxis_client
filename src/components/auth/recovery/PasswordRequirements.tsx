"use client";

import { motion, useReducedMotion } from 'motion/react';
import { PASSWORD_RULES, passedRules } from '@/lib/passwordPolicy';

const STRENGTH = [
  { label: 'Muy débil', color: '#EF4444' },
  { label: 'Débil', color: '#F97316' },
  { label: 'Aceptable', color: '#EAB308' },
  { label: 'Buena', color: '#1CA3E9' },
  { label: 'Cumple la política', color: '#35BE8B' },
];

/** Medidor y lista de requisitos que se actualizan mientras la persona escribe. */
export default function PasswordRequirements({ id, password }: { id: string; password: string }) {
  const reduceMotion = useReducedMotion();
  const passed = passedRules(password);
  const ratio = passed.size / PASSWORD_RULES.length;
  const level = STRENGTH[Math.max(passed.size - 1, 0)];

  return (
    <div id={id} className="space-y-4 rounded-2xl bg-[#F3F4F8] p-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-500">Seguridad</span>
          <span style={{ color: password ? level.color : undefined }} className={password ? '' : 'text-slate-400'}>
            {password ? level.label : 'Sin escribir'}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full origin-left rounded-full"
            initial={false}
            animate={{ scaleX: ratio, backgroundColor: level.color }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 24 }}
          />
        </div>
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2" aria-label="Requisitos de la contraseña">
        {PASSWORD_RULES.map((rule) => {
          const ok = passed.has(rule.id);
          return (
            <li key={rule.id} className={`flex items-center gap-2.5 text-sm transition-colors ${ok ? 'text-slate-900' : 'text-slate-500'}`}>
              <motion.span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                initial={false}
                animate={{ backgroundColor: ok ? '#35BE8B' : '#E2E8F0', scale: ok && !reduceMotion ? [1, 1.25, 1] : 1 }}
                transition={{ duration: 0.3 }}
              >
                <svg className={`h-3 w-3 ${ok ? 'text-white' : 'text-slate-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} aria-hidden="true">
                  {ok ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" d="M8 12h8" />
                  )}
                </svg>
              </motion.span>
              <span>
                {rule.label}
                <span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
