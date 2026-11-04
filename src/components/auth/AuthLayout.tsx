"use client";

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';
import AuthShowcase from './AuthShowcase';
import BlueprintBackdrop from './BlueprintBackdrop';
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

/** Marcas de registro en las esquinas de la hoja, como en un plano impreso. */
function CornerMarks() {
  const corner = 'absolute h-4 w-4 border-[#0A65A8]';
  return (
    <>
      <span className={`${corner} -left-2 -top-2 border-l-2 border-t-2`} />
      <span className={`${corner} -right-2 -top-2 border-r-2 border-t-2`} />
      <span className={`${corner} -bottom-2 -left-2 border-b-2 border-l-2`} />
      <span className={`${corner} -bottom-2 -right-2 border-b-2 border-r-2`} />
    </>
  );
}

/** Diseño común de login y recuperación: panel institucional a la izquierda y hoja de plano a la derecha. */
export default function AuthLayout({ title, subtitle, children, top, showcaseTitle, showcaseDescription, contentKey }: AuthLayoutProps) {
  const reduceMotion = useReducedMotion();
  return (
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#F4F7FA]">
      <AuthShowcase title={showcaseTitle} description={showcaseDescription} />

      <section className="relative flex min-h-screen flex-col overflow-hidden">
        <BlueprintBackdrop />

        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
          <motion.div
            className="relative w-full max-w-[420px]"
            initial={reduceMotion ? false : { opacity: 0, y: 28, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ delay: 0.35, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformPerspective: 1200 }}
          >
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              initial={reduceMotion ? false : { opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <CornerMarks />
            </motion.div>

            <div className="relative rounded-[20px] border border-[#D7E2ED] bg-white/90 px-6 py-7 shadow-[0_30px_60px_-30px_rgba(11,27,58,0.35)] backdrop-blur-md sm:px-9 sm:py-9">
              {/* Franja superior con los colores de marca */}
              <span className="absolute inset-x-9 top-0 h-[3px] rounded-b-full bg-gradient-to-r from-[#0A65A8] via-[#1CA3E9] to-[#35BE8B]" aria-hidden="true" />

              <motion.div key={contentKey} variants={staggerVariants} initial={reduceMotion ? false : 'hidden'} animate="show" className="space-y-6">
                {top && <AuthItem>{top}</AuthItem>}
                <AuthItem className="space-y-4">
                  <motion.img
                    src="/images/Logo2.png"
                    alt="PRAXIS"
                    className="h-10 w-10 object-contain"
                    whileHover={reduceMotion ? undefined : { rotate: [0, -8, 8, 0], scale: 1.08 }}
                    transition={{ duration: 0.5 }}
                  />
                  <div>
                    <h1 className="text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em] text-[#0B1B3A] sm:text-[28px]">{title}</h1>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{subtitle}</p>
                  </div>
                </AuthItem>

                {children}
              </motion.div>
            </div>
          </motion.div>
        </div>

        <footer className="relative z-10 flex flex-col items-center justify-between gap-1 px-6 pb-5 text-[11px] text-slate-500 sm:flex-row">
          <span className="flex items-center gap-1.5 font-semibold text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-[#35BE8B]" aria-hidden="true" />
            Conexión cifrada TLS 1.3, TI Institucional
          </span>
          <span>Sede Campus Central, Mesa de Ayuda MEP</span>
        </footer>
      </section>
    </main>
  );
}
