"use client";

import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';

const NOTICES = {
  restablecida: {
    tone: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    text: 'Tu contraseña se actualizó. Inicia sesión con la nueva clave.',
  },
  expirada: {
    tone: 'bg-amber-50 text-amber-800 border-amber-200',
    text: 'Tu sesión terminó. Inicia sesión de nuevo para continuar.',
  },
} as const;

/** Aviso de contexto al llegar al login (contraseña restablecida o sesión vencida). */
export default function LoginNotice() {
  const params = useSearchParams();
  const key = params.has('restablecida') ? 'restablecida' : params.get('sesion') === 'expirada' ? 'expirada' : null;
  if (!key) return null;

  return (
    <motion.div
      role="status"
      className={`rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed ${NOTICES[key].tone}`}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {NOTICES[key].text}
    </motion.div>
  );
}
