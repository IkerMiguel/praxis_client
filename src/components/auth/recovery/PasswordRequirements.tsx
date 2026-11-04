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

/** Medidor y requisitos compactos que se actualizan mientras la persona escribe. */
export default function PasswordRequirements({ id, password }: { id: string; password: string }) {
  const reduceMotion = useReducedMotion();
  const passed = passedRules(password);
  const ratio = passed.size / PASSWORD_RULES.length;
  const level = STRENGTH[Math.max(passed.size - 1, 0)];

  return (
    <div id={id} className="space-y-2.5 rounded-xl bg-[#F3F4F8] p-3">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full origin-left rounded-full"
            initial={false}
            animate={{ scaleX: ratio, backgroundColor: level.color }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 24 }}
          />
        </div>
        <span className="w-28 text-right text-[11px] font-semibold" style={{ color: password ? level.color : '#94A3B8' }}>
          {password ? level.label : 'Sin escribir'}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1" aria-label="Requisitos de la contraseña">
        {PASSWORD_RULES.map((rule) => {
          const ok = passed.has(rule.id);
          return (
            <li key={rule.id} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-slate-800' : 'text-slate-500'}`}>
              <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full ${ok ? 'bg-[#35BE8B] text-white' : 'bg-slate-200 text-slate-400'}`}>
                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} aria-hidden="true">
                  {ok ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" d="M8 12h8" />}
                </svg>
              </span>
              {rule.label}
              <span className="sr-only">{ok ? ' (cumplido)' : ' (pendiente)'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
