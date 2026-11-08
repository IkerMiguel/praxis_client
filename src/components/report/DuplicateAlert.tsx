"use client";

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BellPlus, Copy, Loader2 } from 'lucide-react';
import { reportService, type Coincidencia } from '@/services/reportService';
import { StatusBadge } from '@/components/ui/Badges';
import { useApiQuery } from '@/lib/useApiQuery';
import { apiErrorMessage } from '@/lib/apiError';
import { formatRelative } from '@/lib/format';

interface DuplicateAlertProps {
  espacioId: number;
  categoriaId?: number;
  diferente: boolean;
  onDiferenteChange: (value: boolean) => void;
  onMatchesChange: (hasMatches: boolean) => void;
  onFollowed: () => void;
}

/** Alerta de posibles duplicados antes de radicar (HU-3.3, KAN-167). */
export default function DuplicateAlert({ espacioId, categoriaId, diferente, onDiferenteChange, onMatchesChange, onFollowed }: DuplicateAlertProps) {
  const { data } = useApiQuery(`coincidencias:${espacioId}:${categoriaId ?? ''}`, () => reportService.coincidencias(espacioId, categoriaId));
  const [following, setFollowing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const matches = data ?? [];

  useEffect(() => {
    onMatchesChange(matches.length > 0);
  }, [matches.length, onMatchesChange]);

  const follow = async (item: Coincidencia) => {
    setFollowing(item.id);
    setError('');
    try {
      await reportService.suscribir(item.id);
      onFollowed();
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo seguir la solicitud.'));
      setFollowing(null);
    }
  };

  return (
    <AnimatePresence>
      {matches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="overflow-hidden rounded-2xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50"
          role="region"
          aria-label="Posibles duplicados"
        >
          <div className="flex items-start gap-3 px-5 pt-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
              <Copy className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-amber-950">
                {matches.length === 1 ? 'Ya hay una solicitud abierta' : `Ya hay ${matches.length} solicitudes abiertas`} en este espacio
              </p>
              <p className="text-sm text-amber-900/80">Si es el mismo daño, síguela y recibirás sus actualizaciones sin crear un duplicado.</p>
            </div>
          </div>
          <ul className="space-y-2 px-5 py-4">
            {matches.map((item) => (
              <li key={item.id} className="flex flex-col gap-3 rounded-xl bg-white/80 p-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700">{item.codigo_ticket}</span>
                    <StatusBadge code={item.estado.codigo} name={item.estado.nombre} />
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-slate-900">{item.resumen}</p>
                  <p className="text-xs text-slate-500">
                    {item.categoria.nombre} · {formatRelative(item.fecha_registro)}
                  </p>
                </div>
                {item.es_mia ? (
                  <span className="text-xs font-semibold text-slate-500">La radicaste tú</span>
                ) : item.ya_suscrito ? (
                  <span className="text-xs font-semibold text-emerald-700">Ya la sigues</span>
                ) : (
                  <button type="button" onClick={() => follow(item)} disabled={following !== null} className="btn-secondary shrink-0">
                    {following === item.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <BellPlus className="h-4 w-4" aria-hidden="true" />}
                    Seguir esta solicitud
                  </button>
                )}
              </li>
            ))}
          </ul>
          {error && <p className="px-5 pb-2 text-sm text-red-700">{error}</p>}
          <label className="flex cursor-pointer items-center gap-3 border-t border-amber-200 bg-white/50 px-5 py-3 text-sm font-semibold text-amber-950">
            <input type="checkbox" checked={diferente} onChange={(e) => onDiferenteChange(e.target.checked)} className="h-4 w-4 rounded border-amber-400 accent-amber-600" />
            Confirmo que mi reporte es un problema diferente
          </label>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
