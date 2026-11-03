"use client";

import { Children, isValidElement } from 'react';
import { CircleCheckBig } from 'lucide-react';
import type { ActionContext } from './ActionKit';
import TriageActions from './TriageActions';
import PlanningActions from './PlanningActions';

/**
 * Panel de acciones de la ficha operativa. Cada épica aporta su bloque y cada bloque decide,
 * según el rol activo y el estado, si se muestra.
 */
export default function ActionPanel(ctx: ActionContext) {
  const blocks = [<TriageActions key="triage" {...ctx} />, <PlanningActions key="planning" {...ctx} />];
  const terminal = ['E15', 'E16', 'E17'].includes(ctx.inc.estado.codigo);

  return (
    <section className="card space-y-5 p-5" aria-label="Acciones disponibles">
      <h2 className="text-sm font-bold text-slate-900">Acciones</h2>
      {Children.toArray(blocks).filter(isValidElement)}
      <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-500">
        <CircleCheckBig className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {terminal ? 'La incidencia está finalizada.' : `Estado actual: ${ctx.inc.estado.nombre}. ${ctx.inc.estado.significado ?? ''}`}
      </p>
    </section>
  );
}
