"use client";

import { useRef } from 'react';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  invalid?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

/** Código numérico en casillas: acepta pegar el código completo y navega con flechas y retroceso. */
export default function CodeInput({ value, onChange, length = 6, invalid = false, autoFocus, onComplete }: CodeInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setAt = (index: number, digit: string) => {
    const next = digits.map((d, i) => (i === index ? digit : d)).join('').slice(0, length);
    onChange(next);
    if (next.replace(/\s/g, '').length === length && !next.includes(' ')) onComplete?.(next);
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
    <div className="flex justify-between gap-2" role="group" aria-label="Código de verificación">
      {digits.map((digit, i) => (
        <input
          key={i}
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
          className={`h-12 w-full min-w-0 rounded-xl border text-center text-lg font-bold tabular-nums text-slate-900 transition focus:bg-white focus:outline-none ${
            invalid ? 'border-red-300 bg-red-50/40' : 'border-transparent bg-[#EEF2F6] focus:border-slate-400'
          }`}
        />
      ))}
    </div>
  );
}
