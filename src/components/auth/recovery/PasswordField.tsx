"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eye, EyeOff, Lock, TriangleAlert } from 'lucide-react';
import { AuthField } from '../AuthMotion';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  describedBy?: string;
}

/** Campo de contraseña animado, con botón para mostrarla y aviso de Bloq Mayús. */
export default function PasswordField({ id, label, value, onChange, error, autoComplete = 'new-password', autoFocus, describedBy }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  return (
    <AuthField
      id={id}
      label={label}
      icon={Lock}
      type={visible ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      describedBy={describedBy}
      error={error}
      placeholder="••••••••••••"
      onKeyChange={(e) => setCapsLock(e.getModifierState('CapsLock'))}
      hint={
        capsLock && (
          <p className="flex items-center gap-1 text-xs font-medium text-amber-700">
            <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Bloq Mayús está activado
          </p>
        )
      }
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="rounded-lg p-1.5 text-slate-400 transition hover:text-slate-700"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={String(visible)} initial={{ opacity: 0, rotate: -30, scale: 0.7 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 30, scale: 0.7 }} transition={{ duration: 0.15 }} className="block">
              {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </motion.span>
          </AnimatePresence>
        </button>
      }
    />
  );
}
