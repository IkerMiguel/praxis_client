"use client";

import { useState } from 'react';
import { ImageOff, MoveHorizontal } from 'lucide-react';
import type { EvidenciaDetalle } from '@/types/incident';

/** Comparador antes/después con deslizador entre la foto del reporte y la de la ejecución (KAN-267). */
export default function BeforeAfter({ before, after }: { before: EvidenciaDetalle[]; after: EvidenciaDetalle[] }) {
  const images = (list: EvidenciaDetalle[]) => list.filter((e) => e.mime_type.startsWith('image/'));
  const b = images(before);
  const a = images(after);
  const [bi, setBi] = useState(0);
  const [ai, setAi] = useState(0);
  const [pos, setPos] = useState(50);

  if (a.length === 0)
    return (
      <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <ImageOff className="h-4 w-4" aria-hidden="true" />
        La intervención no tiene fotos de ejecución para comparar.
      </p>
    );

  const beforeImg = b[bi];
  const afterImg = a[ai];

  return (
    <div className="space-y-3">
      <div className="relative aspect-video w-full select-none overflow-hidden rounded-2xl bg-slate-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={afterImg.url} alt="Después de la intervención" className="absolute inset-0 h-full w-full object-contain" />
        {beforeImg ? (
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={beforeImg.url} alt="Antes, según el reporte" className="absolute inset-0 h-full w-full object-contain" />
          </div>
        ) : null}
        {beforeImg && (
          <>
            <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)]" style={{ left: `${pos}%` }}>
              <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg">
                <MoveHorizontal className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              aria-label="Deslizar entre antes y después"
              className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
            />
            <span className="pointer-events-none absolute left-3 top-3 rounded-lg bg-slate-950/70 px-2 py-1 text-[11px] font-bold text-white">Antes</span>
          </>
        )}
        <span className="pointer-events-none absolute right-3 top-3 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white">Después</span>
      </div>
      <div className="flex flex-wrap gap-4 text-xs">
        {b.length > 1 && <Thumbs label="Antes" list={b} index={bi} onPick={setBi} />}
        {a.length > 1 && <Thumbs label="Después" list={a} index={ai} onPick={setAi} />}
        {!beforeImg && <span className="text-slate-500">El reporte no tiene foto inicial; se muestra solo el resultado.</span>}
      </div>
    </div>
  );
}

function Thumbs({ label, list, index, onPick }: { label: string; list: EvidenciaDetalle[]; index: number; onPick: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-semibold text-slate-500">{label}:</span>
      {list.map((e, i) => (
        <button key={e.id} type="button" onClick={() => onPick(i)} aria-pressed={i === index} className={`h-10 w-10 overflow-hidden rounded-lg ring-2 ${i === index ? 'ring-praxis-blue' : 'ring-transparent'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={e.url} alt={e.nombre_original} className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}
