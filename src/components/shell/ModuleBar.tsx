"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, CircleHelp, Eye, LayoutGrid, Phone, X } from 'lucide-react';
import { useSession } from '@/lib/session/SessionProvider';
import type { MenuItem } from '@/types/auth';
import { MODULE_DETAILS, MODULE_HINTS, moduleIcon } from './ModuleIcon';

/** Ítem del menú cuya ruta coincide mejor con la URL actual (prefijo más largo). */
export function activeModule(menu: MenuItem[], pathname: string): MenuItem | undefined {
  return menu
    .filter((item) => pathname === item.ruta || pathname.startsWith(`${item.ruta}/`))
    .sort((a, b) => b.ruta.length - a.ruta.length)[0];
}

const GROUP_ORDER = ['General', 'Gestión', 'Operación', 'Consulta', 'Administración'];

/**
 * Segunda barra del shell: botón "Módulos" con el menú completo agrupado y accesos directos.
 * Los accesos solo muestran el ícono; el activo se expande con ícono y nombre.
 */
export default function ModuleBar() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { menu } = useSession();
  const [megaOpen, setMegaOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ label: string; x: number; y: number } | null>(null);

  const showTip = (label: string, target: HTMLElement) => {
    const box = target.getBoundingClientRect();
    setTip({ label, x: box.left + box.width / 2, y: box.bottom + 8 });
  };

  const current = activeModule(menu, pathname);
  const shortcuts = menu.filter((item) => item.codigo !== 'AYUDA');
  const help = menu.find((item) => item.codigo === 'AYUDA');

  const groups = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of menu) map.set(item.grupo, [...(map.get(item.grupo) ?? []), item]);
    return [...map.entries()].sort(([a], [b]) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b));
  }, [menu]);

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMegaOpen(false);
    // La barra superior queda por encima del velo, así que un clic allí también debe cerrar el menú.
    const onPointer = (e: PointerEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setMegaOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [megaOpen]);

  const spring = reduceMotion ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 34 };

  return (
    <div ref={barRef} className="relative border-b border-praxis-line">
      {/* Fondo de la barra en su propia capa: si el desenfoque estuviera en el contenedor, el velo fijo quedaría atrapado dentro de la barra */}
      <div className="absolute inset-0 z-50 bg-praxis-surface/80 backdrop-blur" aria-hidden="true" />
      <nav aria-label="Módulos" className="relative z-50 mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => setMegaOpen((v) => !v)}
          aria-expanded={megaOpen}
          aria-controls="mega-menu"
          className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-praxis-navy px-4 text-sm font-semibold text-white shadow-sm shadow-slate-900/20 transition hover:bg-praxis-navy-soft ${
            megaOpen ? 'ring-4 ring-praxis-sky/30' : ''
          }`}
        >
          {megaOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <LayoutGrid className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">Módulos</span>
        </button>

        <span className="mx-1 hidden h-6 w-px bg-praxis-line sm:block" aria-hidden="true" />

        <LayoutGroup id="module-tabs">
          <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
            {shortcuts.map((item) => {
              const Icon = moduleIcon(item.icono);
              // Con el menú de módulos abierto la selección pasa al botón "Módulos"; al cerrarlo vuelve aquí.
              const active = current?.codigo === item.codigo && !megaOpen;
              return (
                <li key={item.codigo} className="shrink-0">
                  <Link
                    href={item.ruta}
                    aria-current={active ? 'page' : undefined}
                    onMouseEnter={(e) => !active && showTip(item.etiqueta, e.currentTarget)}
                    onMouseLeave={() => setTip(null)}
                    onFocus={(e) => !active && showTip(item.etiqueta, e.currentTarget)}
                    onBlur={() => setTip(null)}
                    onClick={() => setTip(null)}
                    className={`relative flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors ${
                      active ? 'text-white' : 'text-slate-500 hover:bg-white hover:text-slate-900'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="module-tab-active"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-praxis-blue to-[#0b7cc4] shadow-md shadow-sky-900/25"
                        transition={spring}
                      />
                    )}
                    <Icon className="relative h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                    <AnimatePresence initial={false}>
                      {active && (
                        <motion.span
                          className="relative overflow-hidden whitespace-nowrap"
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: 'auto', opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={spring}
                        >
                          {item.etiqueta}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {!active && <span className="sr-only">{item.etiqueta}</span>}
                    {item.solo_lectura && active && <Eye className="relative h-3.5 w-3.5 opacity-80" aria-label="Solo lectura" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </LayoutGroup>

        {help && (
          <Link
            href={help.ruta}
            className={`hidden h-10 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition md:inline-flex ${
              current?.codigo === 'AYUDA' ? 'border-praxis-blue bg-sky-50 text-sky-900' : 'border-praxis-line bg-white text-slate-600 hover:text-slate-900'
            }`}
          >
            <CircleHelp className="h-4 w-4" aria-hidden="true" />
            Centro de ayuda
          </Link>
        )}
      </nav>

      <AnimatePresence>
        {tip && (
          <motion.span
            key={tip.label}
            role="tooltip"
            className="pointer-events-none fixed z-[70] -translate-x-1/2 whitespace-nowrap rounded-lg bg-praxis-navy px-2.5 py-1.5 text-xs font-medium text-white shadow-lg"
            style={{ left: tip.x, top: tip.y }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {tip.label}
          </motion.span>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {megaOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMegaOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              id="mega-menu"
              className="absolute inset-x-0 top-full z-50 origin-top rounded-b-[28px] border-b-4 border-praxis-line bg-white shadow-2xl shadow-slate-900/20"
              initial={{ opacity: 0, scaleY: 0.96 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0.96 }}
              transition={{ duration: 0.18 }}
            >
              <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 pb-8 pt-6 sm:px-6 md:flex-row lg:px-8">
                <div className="grid flex-1 gap-x-4 gap-y-6 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,185px),1fr))]">
                {groups.map(([group, items], groupIndex) => (
                  <motion.section
                    key={group}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : groupIndex * 0.04 }}
                  >
                    <h2 className="eyebrow mb-3">{group}</h2>
                    <ul className="grid gap-1 sm:grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))]">
                      {items.map((item) => {
                        const Icon = moduleIcon(item.icono);
                        const active = current?.codigo === item.codigo;
                        return (
                          <li key={item.codigo}>
                            <Link
                              href={item.ruta}
                              onClick={() => setMegaOpen(false)}
                              aria-current={active ? 'page' : undefined}
                              className={`flex gap-3 rounded-2xl px-3 transition-all duration-300 ${
                                active
                                  ? 'min-h-[150px] items-center bg-gradient-to-br from-sky-50 to-white py-6 shadow-md shadow-sky-900/10 ring-1 ring-sky-200'
                                  : 'items-start py-2.5 hover:bg-slate-50'
                              }`}
                            >
                              <span className={`flex shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${active ? 'h-11 w-11 bg-praxis-blue text-white shadow-lg shadow-sky-900/25' : 'mt-0.5 h-8 w-8 bg-slate-100 text-slate-600'}`}>
                                <Icon className={active ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
                              </span>
                              <span className="min-w-0">
                                <span className={`flex items-center gap-1.5 font-semibold ${active ? 'text-base text-sky-900' : 'text-sm text-slate-800'}`}>
                                  {item.etiqueta}
                                  {item.solo_lectura && <Eye className="h-3.5 w-3.5 text-slate-400" aria-label="Solo lectura" />}
                                </span>
                                {active && MODULE_DETAILS[item.codigo] ? (
                                  <span className="mt-1 block text-[13px] leading-relaxed text-slate-600">{MODULE_DETAILS[item.codigo]}</span>
                                ) : (
                                  <span className="block text-xs text-slate-500">{MODULE_HINTS[item.codigo] ?? ''}</span>
                                )}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.section>
                ))}
                </div>

                <aside className="shrink-0 self-start md:w-[300px] rounded-2xl bg-gradient-to-br from-praxis-navy to-[#0a3d6e] p-5 text-white">
                  <p className="text-sm font-bold">Coordinación de Planta Física</p>
                  <p className="mt-1 text-xs leading-relaxed text-sky-100/80">
                    Para emergencias con riesgo para las personas, comunícate de inmediato además de radicar el reporte.
                  </p>
                  <p className="mt-4 flex items-center gap-2 text-xs text-sky-100">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                    Mesa de ayuda operacional
                  </p>
                  <Link
                    href="/ayuda"
                    onClick={() => setMegaOpen(false)}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200"
                  >
                    Ver guía y preguntas frecuentes
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </aside>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
