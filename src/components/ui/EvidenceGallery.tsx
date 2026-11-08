"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Download, FileText, ImageOff, X } from 'lucide-react';
import type { EvidenciaDetalle } from '@/types/incident';
import { formatDateTime } from '@/lib/format';

const STAGE_LABELS: Record<string, string> = {
  REPORTE: 'Reporte',
  ACLARACION: 'Aclaración',
  INSPECCION: 'Inspección',
  EJECUCION: 'Ejecución',
  VERIFICACION: 'Verificación',
};

/** Miniaturas de evidencias con visor ampliado (lightbox) y navegación con teclado. */
export default function EvidenceGallery({ items, emptyText = 'Sin evidencias adjuntas.' }: { items: EvidenciaDetalle[]; emptyText?: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const images = items.filter((e) => e.mime_type.startsWith('image/'));
  const current = index !== null ? images[index] : null;

  useEffect(() => {
    if (index === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIndex(null);
      if (event.key === 'ArrowRight') setIndex((i) => (i === null ? i : (i + 1) % images.length));
      if (event.key === 'ArrowLeft') setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, images.length]);

  if (items.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
        <ImageOff className="h-4 w-4" aria-hidden="true" />
        {emptyText}
      </p>
    );
  }

  return (
    <>
      <ul className="flex flex-wrap gap-3">
        {items.map((ev) => {
          const imageIndex = images.indexOf(ev);
          return (
            <li key={ev.id}>
              {imageIndex >= 0 ? (
                <button
                  type="button"
                  onClick={() => setIndex(imageIndex)}
                  className="group relative block h-28 w-28 overflow-hidden rounded-xl border border-praxis-line bg-slate-100"
                  aria-label={`Ver ${ev.nombre_original}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ev.url} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent px-2 pb-1.5 pt-4 text-left text-[10px] font-semibold text-white">
                    {STAGE_LABELS[ev.etapa] ?? ev.etapa}
                  </span>
                </button>
              ) : (
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-xl border border-praxis-line bg-slate-50 px-2 text-center text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                >
                  <FileText className="h-7 w-7 text-slate-400" aria-hidden="true" />
                  <span className="line-clamp-2">{ev.nombre_original}</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {current && (
              <motion.div
                className="fixed inset-0 z-[90] flex flex-col bg-slate-950/90 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="dialog"
                aria-modal="true"
                aria-label="Visor de evidencias"
              >
                <div className="flex items-center justify-between gap-4 px-5 py-4 text-white">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{current.nombre_original}</p>
                    <p className="text-xs text-slate-400">
                      {STAGE_LABELS[current.etapa] ?? current.etapa} · {formatDateTime(current.fecha_carga)}
                      {current.usuario_carga ? ` · ${current.usuario_carga.name}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={current.url} target="_blank" rel="noreferrer" className="rounded-lg p-2 hover:bg-white/10" aria-label="Abrir original">
                      <Download className="h-5 w-5" aria-hidden="true" />
                    </a>
                    <button type="button" onClick={() => setIndex(null)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Cerrar visor">
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="relative flex flex-1 items-center justify-center px-14 pb-10" onClick={() => setIndex(null)}>
                  <motion.img
                    key={current.id}
                    src={current.url}
                    alt={current.nombre_original}
                    className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {images.length > 1 && (
                    <>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setIndex((i) => ((i ?? 0) - 1 + images.length) % images.length); }} className="absolute left-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Anterior">
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); setIndex((i) => ((i ?? 0) + 1) % images.length); }} className="absolute right-3 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Siguiente">
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
