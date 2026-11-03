"use client";

import { AnimatePresence, motion } from 'motion/react';

interface FormAlertProps {
  message: string;
  tone?: 'error' | 'success';
}

const tones = {
  error: 'bg-red-50 text-red-700 border-red-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

/** Mensaje bajo el formulario que aparece y desaparece con una transición corta. */
export default function FormAlert({ message, tone = 'error' }: FormAlertProps) {
  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key={message}
          role={tone === 'error' ? 'alert' : 'status'}
          className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
