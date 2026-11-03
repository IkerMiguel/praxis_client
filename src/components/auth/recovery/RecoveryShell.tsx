"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import AuthShowcase from '../AuthShowcase';
import StepIndicator from './StepIndicator';

interface RecoveryShellProps {
  step: number;
  children: ReactNode;
}

/** Diseño común de las pantallas de recuperación: panel institucional + tarjeta con el progreso. */
export default function RecoveryShell({ step, children }: RecoveryShellProps) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#F3F4F8]">
      <AuthShowcase
        title="Recupera el acceso a tu cuenta institucional."
        description="Te enviaremos un enlace seguro de un solo uso. Al crear tu nueva contraseña cerraremos las sesiones abiertas en otros equipos."
      />

      <section className="flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <motion.div
          className="w-full max-w-[560px] bg-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-200/60 space-y-8 overflow-hidden"
          initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 -ml-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1CA3E9]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Volver al inicio de sesión
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/Logo2.png" alt="PRAXIS" className="h-9 w-9 object-contain shrink-0" />
          </div>

          <StepIndicator current={step} />

          {children}
        </motion.div>
      </section>
    </main>
  );
}
