"use client";

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { TONE_CLASSES, type Tone } from '@/lib/tones';

export interface QueueStat {
  key: string;
  label: string;
  value: number | undefined;
  hint: string;
  tone: Tone;
  icon: ReactNode;
}

/** Fila de indicadores clicables que actúan como filtro de la bandeja. */
export default function QueueStats({ stats, active, onSelect }: { stats: QueueStat[]; active: string; onSelect: (key: string) => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[repeat(auto-fit,minmax(190px,1fr))]">
      {stats.map((s, i) => {
        const t = TONE_CLASSES[s.tone];
        const selected = active === s.key;
        return (
          <motion.button
            key={s.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(selected ? '' : s.key)}
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`relative overflow-hidden rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 ${selected ? 'border-praxis-navy ring-4 ring-praxis-navy/10' : 'border-praxis-line'}`}
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${t.bar}`} aria-hidden="true" />
            <span className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-500">{s.label}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.soft} ${t.text}`}>{s.icon}</span>
            </span>
            <span className="mt-1 block text-3xl font-extrabold tabular-nums tracking-tight text-slate-900">{s.value ?? '—'}</span>
            <span className={`mt-1 block text-xs font-medium ${t.text}`}>{s.hint}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
