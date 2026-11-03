"use client";

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { CloudOff, Inbox, RotateCw } from 'lucide-react';
import PraxisLoader from './PraxisLoader';

/** Carga de una sección con el loader institucional. */
export function LoadingState({ label = 'Cargando', compact = false }: { label?: string; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center ${compact ? 'py-10' : 'py-20'}`} role="status">
      <div className="rounded-3xl bg-[#0D111D] px-8 py-6 shadow-xl shadow-slate-900/10">
        <PraxisLoader size={compact ? 52 : 72} label={label} />
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-3 px-6 py-14 text-center"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden="true" />}
      </span>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description && <p className="max-w-md text-sm leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </motion.div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center" role="alert">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <CloudOff className="h-7 w-7" aria-hidden="true" />
      </span>
      <h3 className="text-base font-bold text-slate-900">No pudimos cargar esta información</h3>
      <p className="max-w-md text-sm leading-relaxed text-slate-500">{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-1">
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Intentar de nuevo
        </button>
      )}
    </div>
  );
}

/** Envoltura estándar de carga, error y contenido para una consulta. */
export function QueryBoundary({
  loading,
  error,
  onRetry,
  label,
  children,
}: {
  loading: boolean;
  error: string;
  onRetry?: () => void;
  label?: string;
  children: ReactNode;
}) {
  if (loading) return <LoadingState label={label} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  return <>{children}</>;
}
