"use client";

import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { IncidentFlags, PriorityBadge, StatusBadge } from '@/components/ui/Badges';
import { initials, formatRelative } from '@/lib/format';
import type { ConsolaFila } from '@/types/ops';
import SlaMeter from './SlaMeter';

interface IncidentTableProps {
  rows: ConsolaFila[];
  /** Acción principal por fila; por defecto "Gestionar". */
  action?: (row: ConsolaFila) => ReactNode;
  showSla?: boolean;
  showTech?: boolean;
  showState?: boolean;
  dense?: boolean;
}

/** Tabla operativa de incidencias: código, ubicación, falla, prioridad, técnico, SLA y acción. */
export default function IncidentTable({ rows, action, showSla = true, showTech = true, showState = true }: IncidentTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full text-left text-sm ${showState ? 'min-w-[980px]' : 'min-w-[860px]'}`}>
        <thead>
          <tr className="border-b border-praxis-line text-[11px] font-semibold text-slate-500">
            <th className="px-5 py-3 font-semibold">Código</th>
            <th className="px-3 py-3 font-semibold">Espacio / ubicación</th>
            <th className="px-3 py-3 font-semibold">Falla registrada</th>
            {showState && <th className="px-3 py-3 font-semibold">Estado</th>}
            <th className="px-3 py-3 font-semibold">Prioridad</th>
            {showTech && <th className="px-3 py-3 font-semibold">Técnico</th>}
            {showSla && <th className="px-3 py-3 font-semibold">SLA restante</th>}
            <th className="px-5 py-3 text-right font-semibold">Acción</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const open = !['E15', 'E16', 'E17'].includes(row.estado.codigo);
            const critical = open && (row.es_riesgo_inmediato || row.prioridad?.codigo === 'CRITICA');
            const unassigned = !row.tecnico_asignado && ['E05'].includes(row.estado.codigo);
            return (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(index, 12) * 0.02 }}
                className={`group border-b border-slate-100 align-middle transition last:border-0 hover:bg-slate-50 ${critical ? 'bg-red-50/40' : unassigned ? 'bg-amber-50/40' : ''}`}
              >
                <td className="px-5 py-3.5">
                  <Link href={`/incidencias/${row.id}`} className={`inline-block whitespace-nowrap rounded-lg px-2 py-1 font-mono text-[11px] font-bold leading-tight ${critical ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'}`}>
                    {row.codigo_ticket}
                  </Link>
                  <p className="mt-1 text-[11px] text-slate-400">{formatRelative(row.fecha_registro)}</p>
                </td>
                <td className="px-3 py-3.5">
                  <p className="whitespace-nowrap font-semibold text-slate-900">{row.ubicacion?.espacio?.nombre ?? '—'}</p>
                  <p className="text-xs text-slate-500">{[row.ubicacion?.edificio?.nombre, row.ubicacion?.piso?.nombre].filter(Boolean).join(' · ')}</p>
                </td>
                <td className="max-w-[260px] px-3 py-3.5">
                  <p className="truncate text-slate-800">{row.resumen}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                    {row.categoria?.nombre}
                    <IncidentFlags risk={row.es_riesgo_inmediato} duplicate={row.posible_duplicado} />
                  </p>
                </td>
                {showState && (
                  <td className="px-3 py-3.5">
                    <StatusBadge code={row.estado.codigo} name={row.estado.nombre} color={row.estado.color} />
                  </td>
                )}
                <td className="px-3 py-3.5">
                  <PriorityBadge code={row.prioridad?.codigo} name={row.prioridad?.nombre} color={row.prioridad?.color} />
                </td>
                {showTech && (
                  <td className="px-3 py-3.5">
                    {row.tecnico_asignado ? (
                      <span className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-praxis-navy text-[10px] font-bold text-white">{initials(row.tecnico_asignado.name)}</span>
                        <span className="max-w-[130px] truncate text-xs font-medium text-slate-700">{row.tecnico_asignado.name}</span>
                      </span>
                    ) : (
                      <span className="inline-flex rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800">Sin asignar</span>
                    )}
                  </td>
                )}
                {showSla && (
                  <td className="px-3 py-3.5">
                    <SlaMeter sla={row.sla} />
                  </td>
                )}
                <td className="px-5 py-3.5 text-right">
                  {action ? (
                    action(row)
                  ) : (
                    <Link href={`/incidencias/${row.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                      Gestionar
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  )}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
