"use client";

import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { Check, CircleAlert, type LucideIcon } from 'lucide-react';

/** Contenedor que escalona la entrada de sus AuthItem. */
export const staggerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.45 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

export function AuthItem({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

/** Etiqueta de campo compartida (login, recuperación y código). */
export const authFieldLabel = 'block text-[13px] font-semibold text-[#0B1B3A]';

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

/** Campo de trazo: línea base que se dibuja con los colores de marca al enfocar y se sacude ante un error. */
export function AuthField({ id, label, icon: Icon, value, onChange, type = 'text', placeholder, autoComplete, autoFocus, error, hint, trailing, describedBy, onKeyChange }: AuthFieldProps) {
  const reduceMotion = useReducedMotion();
  const [focused, setFocused] = useState(false);
  const errorId = useId();
  const filled = value.length > 0;

  return (
    <div>
      <label htmlFor={id} className={authFieldLabel}>
        {label}
      </label>
      <motion.div animate={error && !reduceMotion ? { x: [0, -7, 6, -4, 3, 0] } : { x: 0 }} transition={{ duration: 0.4 }} className="relative mt-1.5">
        <div className={`relative flex items-center border-b-[1.5px] transition-colors ${error ? 'border-red-300' : 'border-[#C9D6E3]'}`}>
          <motion.span className="absolute left-0" initial={false} animate={{ color: error ? '#D93A3A' : focused || filled ? '#0A65A8' : '#94A3B8', y: focused ? -1 : 0 }} transition={{ duration: 0.2 }}>
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
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
            className={`w-full bg-transparent py-3 pl-8 text-[15px] font-medium text-[#0B1B3A] placeholder:font-normal placeholder:text-slate-400 focus:outline-none ${trailing ? 'pr-10' : 'pr-1'}`}
          />
          {trailing && <span className="absolute right-0 flex items-center">{trailing}</span>}
        </div>
        {/* Línea activa que se traza de izquierda a derecha */}
        <motion.span
          aria-hidden="true"
          className="absolute -bottom-px left-0 h-[2px] w-full origin-left rounded-full"
          style={{ background: error ? '#D93A3A' : 'linear-gradient(90deg, #0A65A8, #1CA3E9 60%, #35BE8B)' }}
          initial={false}
          animate={{ scaleX: focused || error ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p key="e" id={errorId} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-1 overflow-hidden pt-1.5 text-xs text-red-600">
            <CircleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {error}
          </motion.p>
        ) : hint ? (
          <motion.div key="h" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden pt-1.5">
            {hint}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type SubmitState = 'idle' | 'loading' | 'success';

/** Botón principal: barra de progreso mientras carga y barrido verde al confirmar. */
export function AuthSubmit({ state, label, loadingLabel, successLabel = 'Listo', disabled }: { state: SubmitState; label: string; loadingLabel: string; successLabel?: string; disabled?: boolean }) {
  const reduceMotion = useReducedMotion();
  const text = state === 'loading' ? loadingLabel : state === 'success' ? successLabel : label;
  return (
    <motion.button
      type="submit"
      aria-busy={state === 'loading'}
      disabled={disabled || state !== 'idle'}
      whileTap={reduceMotion || state !== 'idle' ? undefined : { scale: 0.985 }}
      className="relative flex h-[52px] w-full items-center justify-center overflow-hidden rounded-xl bg-[#0B1B3A] px-4 text-[15px] font-semibold text-white transition-[background-color,opacity] hover:bg-[#0A2E5C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#1CA3E9]/40 disabled:cursor-not-allowed disabled:hover:bg-[#0B1B3A] [&:disabled:not([aria-busy=true])]:opacity-50"
    >
      {/* Barrido verde de confirmación */}
      <motion.span aria-hidden="true" className="absolute inset-0 origin-left bg-[#1F9D6B]" initial={false} animate={{ scaleX: state === 'success' ? 1 : 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} />
      {/* Barra de progreso indeterminada */}
      {state === 'loading' && (
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] overflow-hidden bg-white/10">
          <motion.span className="absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r from-[#1CA3E9] to-[#35BE8B]" animate={reduceMotion ? { left: '33%' } : { left: ['-35%', '100%'] }} transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }} />
        </span>
      )}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={state} className="relative flex items-center gap-2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
          {state === 'success' && <Check className="h-[18px] w-[18px]" strokeWidth={3} aria-hidden="true" />}
          {text}
        </motion.span>
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
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <span className="flex items-start gap-2 rounded-lg border-l-[3px] border-red-500 bg-red-50 px-3 py-2.5 text-[13px] leading-snug text-red-800">
            <CircleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden="true" />
            {message}
          </span>
        </motion.p>
      )}
    </AnimatePresence>
  );
}
