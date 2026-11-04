"use client";

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import AuthShowcase from './AuthShowcase';
import { AuthItem, staggerVariants } from './AuthMotion';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Contenido sobre el título (por ejemplo, "Volver al inicio de sesión"). */
  top?: ReactNode;
  showcaseTitle?: ReactNode;
  showcaseDescription?: ReactNode;
  /** Cambia para reanimar la entrada del contenido (por ejemplo, al cambiar de paso). */
  contentKey?: string;
}

/** Diseño común de login y recuperación: panel institucional y tarjeta de 420 px con halo animado. */
export default function AuthLayout({ title, subtitle, children, top, showcaseTitle, showcaseDescription, contentKey }: AuthLayoutProps) {
  const reduceMotion = useReducedMotion();
  return (
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#F3F4F8]">
      <AuthShowcase title={showcaseTitle} description={showcaseDescription} />

      <section className="relative flex items-center justify-center overflow-hidden p-4 sm:p-6 lg:p-8 bg-[#F3F4F8]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:22px_22px] opacity-40" aria-hidden="true" />

        <div className="relative w-full max-w-[420px]">
          {/* Halo de marca que gira lentamente detrás de la tarjeta */}
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-6 rounded-[44px] opacity-60 blur-2xl"
            style={{ background: 'conic-gradient(from 0deg, #1CA3E9, #35BE8B, #0A65A8, #1CA3E9)' }}
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className="relative w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/70 space-y-5 lg:space-y-6"
            initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div key={contentKey} variants={staggerVariants} initial={reduceMotion ? false : 'hidden'} animate="show" className="space-y-5 lg:space-y-6">
              {top && <AuthItem>{top}</AuthItem>}
              <AuthItem className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
                </div>
                <motion.img
                  src="/images/Logo2.png"
                  alt="PRAXIS"
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0"
                  whileHover={reduceMotion ? undefined : { rotate: [0, -8, 8, 0], scale: 1.08 }}
                  transition={{ duration: 0.5 }}
                />
              </AuthItem>

              {children}

              <AuthItem className="pt-3 sm:pt-4 border-t border-slate-100 text-center text-[10px] sm:text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center justify-center gap-1.5 text-slate-600 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
                  Conexión cifrada TLS 1.3 - TI Institucional
                </div>
                <p>Sede Campus Central - Mesa de Ayuda MEP</p>
              </AuthItem>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
