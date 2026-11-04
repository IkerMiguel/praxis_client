"use client";

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import AuthShowcase from './AuthShowcase';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Contenido sobre el título (por ejemplo, "Volver al inicio de sesión"). */
  top?: ReactNode;
  showcaseTitle?: ReactNode;
  showcaseDescription?: ReactNode;
}

/** Diseño común de login y recuperación: panel institucional y tarjeta de 420 px. */
export default function AuthLayout({ title, subtitle, children, top, showcaseTitle, showcaseDescription }: AuthLayoutProps) {
  const reduceMotion = useReducedMotion();
  return (
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#F3F4F8]">
      <AuthShowcase title={showcaseTitle} description={showcaseDescription} />

      <section className="flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F3F4F8]">
        <motion.div
          className="w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/60 space-y-5 lg:space-y-6"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {top}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/Logo2.png" alt="PRAXIS" className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0" />
          </div>

          {children}

          <div className="pt-3 sm:pt-4 border-t border-slate-100 text-center text-[10px] sm:text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 font-semibold">
              <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Conexión cifrada TLS 1.3 - TI Institucional
            </div>
            <p>Sede Campus Central - Mesa de Ayuda MEP</p>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
