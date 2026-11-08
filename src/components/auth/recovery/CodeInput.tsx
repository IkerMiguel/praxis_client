"use client";

import { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

/** Código numérico en casillas animadas: acepta pegar el código completo y navega con flechas y retroceso. */
export default function CodeInput({ value, onChange, length = 6, invalid = false, autoFocus, onComplete }: CodeInputProps) {
  const reduceMotion = useReducedMotion();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setAt = (index: number, digit: string) => {
    const next = digits.map((d, i) => (i === index ? digit : d)).join('').slice(0, length);
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const fill = (text: string, from: number) => {
    const clean = text.replace(/\D/g, '').slice(0, length - from);
    if (!clean) return;
    const next = (digits.slice(0, from).join('') + clean).slice(0, length);
    onChange(next);
    refs.current[Math.min(next.length, length - 1)]?.focus();
    if (next.length === length) onComplete?.(next);
  };

  return (
    <motion.div
      animate={invalid && !reduceMotion ? { x: [0, -8, 7, -4, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="flex justify-between gap-2"
      role="group"
      aria-label="Código de verificación"
    >
      {digits.map((digit, i) => (
        <motion.div
          key={i}
          className="relative w-full min-w-0"
          initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.15 + i * 0.05, type: 'spring', stiffness: 320, damping: 22 }}
        >
          <input
            ref={(el) => {
              refs.current[i] = el;
            }}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            autoFocus={autoFocus && i === 0}
            maxLength={length}
            aria-label={`Dígito ${i + 1}`}
            value={digit}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              if (v.length > 1) return fill(v, i);
              setAt(i, v);
              if (v && i < length - 1) refs.current[i + 1]?.focus();
            }}
            onPaste={(e) => {
              e.preventDefault();
              fill(e.clipboardData.getData('text'), i);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' && !digit && i > 0) refs.current[i - 1]?.focus();
              if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
              if (e.key === 'ArrowRight' && i < length - 1) refs.current[i + 1]?.focus();
            }}
            className={`h-14 w-full rounded-t-lg border-b-2 bg-white/60 text-center text-2xl font-bold tabular-nums text-[#0B1B3A] caret-[#0A65A8] transition-colors duration-200 focus:bg-[#EAF4FB] focus:outline-none ${
              invalid ? 'border-red-400 bg-red-50/60' : digit ? 'border-[#0A65A8]' : 'border-[#C9D6E3] focus:border-[#1CA3E9]'
            }`}
          />
          {/* Barra inferior que se llena al escribir el dígito */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -bottom-0 h-[2px] origin-left bg-gradient-to-r from-[#1CA3E9] to-[#35BE8B]"
            initial={false}
            animate={{ scaleX: digit && !invalid ? 1 : 0, opacity: digit && !invalid ? 1 : 0 }}
            transition={{ duration: 0.25 }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
