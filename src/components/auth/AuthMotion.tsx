"use client";

import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight, Check, CircleAlert, type LucideIcon } from 'lucide-react';

/** Contenedor que escalona la entrada de sus AuthItem. */
export const staggerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, filter: 'blur(4px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export function AuthItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  error?: string;
  hint?: ReactNode;
  trailing?: ReactNode;
  describedBy?: string;
  onKeyChange?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

/** Campo de acceso con ícono que se ilumina al enfocar, anillo animado y sacudida en error. */
export function AuthField({ id, label, icon: Icon, value, onChange, type = 'text', placeholder, autoComplete, autoFocus, error, hint, trailing, describedBy, onKeyChange }: AuthFieldProps) {
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const errorId = useId();
  const active = focused || value.length > 0;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className={`block text-[11px] font-bold uppercase tracking-wider transition-colors ${focused ? 'text-[#0A65A8]' : 'text-slate-700'}`}>
        {label}
      </label>
      <motion.div
        animate={error && !reduceMotion ? { x: [0, -7, 6, -4, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[3px] rounded-[15px]"
          initial={false}
          animate={{ opacity: focused ? 1 : 0, scale: focused ? 1 : 0.98 }}
          transition={{ duration: 0.2 }}
          style={{ background: error ? 'rgba(239,68,68,0.18)' : 'linear-gradient(120deg, rgba(28,163,233,0.35), rgba(53,190,139,0.35))' }}
        />
        <div className={`relative flex items-center rounded-xl border transition-colors ${error ? 'border-red-300 bg-red-50/60' : focused ? 'border-transparent bg-white' : 'border-transparent bg-[#EEF2F6]'}`}>
          <motion.span className="absolute left-3.5" initial={false} animate={{ color: error ? '#EF4444' : active ? '#0A65A8' : '#94A3B8', scale: focused ? 1.1 : 1 }} transition={{ duration: 0.2 }}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </motion.span>
          <input
            id={id}
            type={type}
            value={value}
            autoComplete={autoComplete}
            autoFocus={autoFocus}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={onKeyChange}
            onKeyUp={onKeyChange}
            aria-invalid={error ? true : undefined}
            aria-describedby={[describedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined}
            className={`w-full bg-transparent py-3 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none ${trailing ? 'pr-11' : 'pr-4'}`}
          />
          {trailing && <span className="absolute right-2 flex items-center">{trailing}</span>}
        </div>
      </motion.div>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p key="e" id={errorId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1 overflow-hidden text-xs text-red-600">
            <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.div key="h" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {hint}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type SubmitState = 'idle' | 'loading' | 'success';

/** Botón principal con brillo al pasar el cursor, puntos de carga y confirmación de éxito. */
export function AuthSubmit({ state, label, loadingLabel, successLabel = 'Listo', disabled }: { state: SubmitState; label: string; loadingLabel: string; successLabel?: string; disabled?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.button
      type="submit"
      disabled={disabled || state !== 'idle'}
      whileHover={reduceMotion || state !== 'idle' ? undefined : { y: -1 }}
      whileTap={reduceMotion ? undefined : { scale: 0.985 }}
      className={`group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors disabled:cursor-not-allowed ${
        state === 'success' ? 'bg-emerald-600 shadow-emerald-900/20' : 'bg-[#111827] shadow-slate-900/15 hover:bg-[#0B1B3A] disabled:opacity-60'
      }`}
    >
      {!reduceMotion && state === 'idle' && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-all duration-700 group-hover:left-full group-hover:opacity-100" />
      )}
      <AnimatePresence mode="wait" initial={false}>
        {state === 'idle' && (
          <motion.span key="idle" className="relative flex items-center gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.12 }}>
            {label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </motion.span>
        )}
        {state === 'loading' && (
          <motion.span key="loading" className="relative flex items-center gap-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.12 }}>
            {loadingLabel}
            <span className="flex gap-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-white" animate={reduceMotion ? {} : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </span>
          </motion.span>
        )}
        {state === 'success' && (
          <motion.span key="success" className="relative flex items-center gap-2" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
            <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            {successLabel}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/** Mensaje de error del formulario con entrada suave. */
export function AuthError({ message }: { message: string }) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -6, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-start gap-2 overflow-hidden rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"
        >
          <CircleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
