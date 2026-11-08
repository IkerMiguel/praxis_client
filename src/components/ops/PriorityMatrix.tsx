"use client";

import { motion } from 'motion/react';
import type { Nivel3, Urgencia } from '@/types/ops';
import { PriorityBadge } from '@/components/ui/Badges';
import { TONE_CLASSES, priorityTone } from '@/lib/tones';

/** Matriz ITIL por defecto del backend (MatrizItil::POR_DEFECTO); solo para la vista previa. */
const DEFAULT_MATRIX: Record<Nivel3, Record<Urgencia, string>> = {
  ALTO: { ALTA: 'CRITICA', MEDIA: 'ALTA', BAJA: 'MEDIA' },
  MEDIO: { ALTA: 'ALTA', MEDIA: 'BAJA', BAJA: 'BAJA' },
  BAJO: { ALTA: 'MEDIA', MEDIA: 'BAJA', BAJA: 'BAJA' },
};
const NAMES: Record<string, string> = { CRITICA: 'Crítica', ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' };
const IMPACTS: { value: Nivel3; label: string; hint: string }[] = [
  { value: 'ALTO', label: 'Alto', hint: 'Afecta un edificio, un servicio crítico o muchas personas' },
  { value: 'MEDIO', label: 'Medio', hint: 'Afecta un espacio o un grupo de usuarios' },
  { value: 'BAJO', label: 'Bajo', hint: 'Afecta un elemento puntual sin frenar actividades' },
];
const URGENCIES: { value: Urgencia; label: string }[] = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

interface PriorityMatrixProps {
  impacto: Nivel3 | null;
  urgencia: Urgencia | null;
  onChange: (impacto: Nivel3, urgencia: Urgencia) => void;
}

/** Cuadrícula Impacto × Urgencia con la prioridad resultante en tiempo real (HU-5.3, KAN-207). */
export default function PriorityMatrix({ impacto, urgencia, onChange }: PriorityMatrixProps) {
  const result = impacto && urgencia ? DEFAULT_MATRIX[impacto][urgencia] : null;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-praxis-line">
        <table className="w-full text-center text-sm">
          <caption className="sr-only">Matriz de prioridad: impacto por urgencia</caption>
          <thead>
            <tr className="bg-slate-50 text-[11px] font-semibold text-slate-500">
              <th className="px-3 py-2.5 text-left">Impacto \ Urgencia</th>
              {URGENCIES.map((u) => (
                <th key={u.value} className="px-3 py-2.5">
                  {u.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {IMPACTS.map((i) => (
              <tr key={i.value} className="border-t border-praxis-line">
                <th scope="row" className="px-3 py-2 text-left">
                  <span className="block text-sm font-semibold text-slate-800">{i.label}</span>
                  <span className="block text-[11px] font-normal leading-snug text-slate-500">{i.hint}</span>
                </th>
                {URGENCIES.map((u) => {
                  const code = DEFAULT_MATRIX[i.value][u.value];
                  const selected = impacto === i.value && urgencia === u.value;
                  const tone = TONE_CLASSES[priorityTone(code)];
                  return (
                    <td key={u.value} className="p-1.5">
                      <button
                        type="button"
                        aria-pressed={selected}
                        aria-label={`Impacto ${i.label}, urgencia ${u.label}: prioridad ${NAMES[code]}`}
                        onClick={() => onChange(i.value, u.value)}
                        className={`relative h-14 w-full rounded-xl text-xs font-bold transition ${selected ? `${tone.bar} text-white shadow-lg` : `${tone.soft} ${tone.text} hover:ring-2 hover:ring-inset hover:ring-slate-300`}`}
                      >
                        {selected && <motion.span layoutId="matrix-cell" className="absolute inset-0 rounded-xl ring-4 ring-praxis-navy/20" />}
                        <span className="relative">{NAMES[code]}</span>
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
        <span className="text-sm text-slate-600">Prioridad resultante</span>
        {result ? (
          <motion.span key={result} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <PriorityBadge code={result} name={NAMES[result]} />
          </motion.span>
        ) : (
          <span className="text-sm text-slate-400">Elige impacto y urgencia</span>
        )}
      </div>
      <p className="text-[11px] text-slate-400">La prioridad final la calcula el sistema con la matriz vigente configurada por administración.</p>
    </div>
  );
}
