"use client";

import { motion } from 'motion/react';
import { CheckCircle2, Search, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { LoadingState } from '@/components/ui/States';
import { opsService } from '@/services/opsService';
import { useApiQuery } from '@/lib/useApiQuery';
import { initials } from '@/lib/format';

interface TechnicianPickerProps {
  categoriaId?: number;
  value: number | null;
  onChange: (id: number, saturated: boolean) => void;
  excludeId?: number | null;
}

/** Selector de técnico por especialidad con indicador visual de saturación WIP (HU-6.2, KAN-222). */
export default function TechnicianPicker({ categoriaId, value, onChange, excludeId }: TechnicianPickerProps) {
  const { data, initialLoading, error } = useApiQuery(`tecnicos:${categoriaId ?? 'todos'}`, () => opsService.tecnicosDisponibles(categoriaId));
  const [q, setQ] = useState('');

  if (initialLoading) return <LoadingState compact label="Cargando técnicos" />;
  if (error) return <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  const list = (data ?? []).filter((t) => t.id !== excludeId && t.nombre.toLowerCase().includes(q.toLowerCase()));
  if (!data || data.length === 0) return <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">No hay técnicos activos con la especialidad de esta categoría.</p>;

  return (
    <div className="space-y-3">
      {data.length > 5 && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar técnico" className="field h-10 pl-9" aria-label="Buscar técnico" />
        </div>
      )}
      <ul role="radiogroup" aria-label="Técnico" className="grid gap-2 sm:grid-cols-2">
        {list.map((t) => {
          const load = t.limite_wip > 0 ? t.carga_actual / t.limite_wip : 0;
          const saturated = !t.disponible || t.carga_actual >= t.limite_wip;
          const selected = value === t.id;
          const bar = saturated ? 'bg-red-500' : load >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500';
          return (
            <li key={t.id}>
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(t.id, saturated)}
                className={`w-full rounded-2xl border p-3.5 text-left transition ${selected ? 'border-praxis-blue bg-sky-50 ring-4 ring-sky-100' : 'border-praxis-line bg-white hover:border-slate-300'}`}
              >
                <span className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${selected ? 'bg-praxis-blue' : 'bg-praxis-navy'}`}>{initials(t.nombre)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-900">
                      {t.nombre}
                      {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-sky-600" aria-hidden="true" />}
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {t.especialidades.map((e) => (
                        <span key={e.id} className="rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
                          {e.nombre}
                        </span>
                      ))}
                    </span>
                  </span>
                </span>
                <span className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                  <span className={saturated ? 'text-red-600' : 'text-slate-500'}>{saturated ? 'Capacidad máxima' : 'Carga actual'}</span>
                  <span className="tabular-nums text-slate-700">
                    {t.carga_actual}/{t.limite_wip} OT
                  </span>
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.span className={`block h-full rounded-full ${bar}`} initial={{ width: 0 }} animate={{ width: `${Math.min(100, load * 100)}%` }} transition={{ duration: 0.5 }} />
                </span>
                {saturated && selected && (
                  <span className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-red-700">
                    <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    Superará su límite WIP; quedará como excepción.
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
