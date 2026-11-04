"use client";

import { motion, useReducedMotion } from 'motion/react';

/** Muros, puertas y escaleras de un piso tipo del campus; se dibujan trazo a trazo al cargar. */
const WALLS = [
  'M40 40 H560 V560 H40 Z',
  'M40 250 H250 M300 250 H560',
  'M40 330 H120 M170 330 H560',
  'M200 40 V250 M350 40 V250 M470 40 V250',
  'M180 330 V560 M330 330 V560 M440 330 V560',
];

const DETAILS = [
  // Puertas
  'M250 250 A50 50 0 0 1 300 200',
  'M120 330 A50 50 0 0 0 170 380',
  'M380 250 A30 30 0 0 0 410 220 M380 250 V220',
  'M230 330 A30 30 0 0 1 260 360 M230 330 V360',
  // Escaleras
  'M455 350 H545 M455 365 H545 M455 380 H545 M455 395 H545 M455 410 H545 M455 425 H545 M455 440 H545',
  'M500 350 V440',
  // Mobiliario de aula
  'M70 80 H170 M70 110 H170 M70 140 H170 M70 170 H170',
  'M230 80 h90 v50 h-90 Z M230 160 h90 v50 h-90 Z',
  'M370 90 h80 M370 120 h80 M370 150 h80',
  'M60 400 h90 v110 h-90 Z',
  'M200 380 h110 M200 420 h110 M200 460 h110 M200 500 h110',
];

const ROOMS = [
  { x: 120, y: 225, label: 'Aula 201' },
  { x: 275, y: 225, label: 'Lab. 202' },
  { x: 410, y: 225, label: 'Aula 203' },
  { x: 515, y: 225, label: 'Baños' },
  { x: 110, y: 545, label: 'Bodega' },
  { x: 255, y: 545, label: 'Aula 204' },
  { x: 385, y: 545, label: 'Sala TI' },
  { x: 500, y: 545, label: 'Escalera' },
  { x: 300, y: 296, label: 'Pasillo central' },
];

/** Novedades activas ubicadas sobre el plano. */
const PINS = [
  { x: 120, y: 150, tone: '#E5484D' },
  { x: 410, y: 120, tone: '#F5A524' },
  { x: 255, y: 430, tone: '#1CA3E9' },
];

/** Fondo del panel de acceso: papel de plano con cuadrícula y un piso del campus que se traza solo. */
export default function BlueprintBackdrop() {
  const reduceMotion = useReducedMotion();
  const draw = (delay: number, duration: number) =>
    reduceMotion
      ? { initial: false as const }
      : { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { pathLength: { delay, duration, ease: 'easeInOut' as const }, opacity: { delay, duration: 0.2 } } };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#F4F7FA',
          backgroundImage:
            'linear-gradient(#D7E2ED 1px, transparent 1px), linear-gradient(90deg, #D7E2ED 1px, transparent 1px), linear-gradient(#E8EEF5 1px, transparent 1px), linear-gradient(90deg, #E8EEF5 1px, transparent 1px)',
          backgroundSize: '96px 96px, 96px 96px, 16px 16px, 16px 16px',
          backgroundPosition: '-1px -1px',
        }}
      />
      <svg className="absolute left-1/2 top-1/2 h-[min(92vh,820px)] w-auto -translate-x-1/2 -translate-y-1/2 opacity-80" viewBox="0 0 600 600" fill="none">
        {WALLS.map((d, i) => (
          <motion.path key={d} d={d} stroke="#7FA0C0" strokeWidth={3} strokeLinecap="square" {...draw(0.1 + i * 0.18, 1.1)} />
        ))}
        {DETAILS.map((d, i) => (
          <motion.path key={d} d={d} stroke="#A9C0D6" strokeWidth={1.2} {...draw(0.9 + i * 0.07, 0.8)} />
        ))}
        {ROOMS.map((room, i) => (
          <motion.text
            key={room.label}
            x={room.x}
            y={room.y}
            textAnchor="middle"
            fontSize="10"
            fontWeight={600}
            fill="#7FA0C0"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 + i * 0.05 }}
          >
            {room.label}
          </motion.text>
        ))}
        {/* Cotas del plano */}
        <motion.g stroke="#A9C0D6" strokeWidth={1} {...(reduceMotion ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 1.4 } })}>
          <path d="M40 20 H560 M40 14 V26 M560 14 V26" />
          <path d="M580 40 V560 M574 40 H586 M574 560 H586" />
        </motion.g>
        <motion.text x="300" y="14" textAnchor="middle" fontSize="9" fill="#7FA0C0" fontWeight={600} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
          Bloque C, piso 2
        </motion.text>
        {PINS.map((pin, i) => (
          <g key={`${pin.x}-${pin.y}`}>
            {!reduceMotion && (
              <motion.circle cx={pin.x} cy={pin.y} r={8} fill={pin.tone} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 2.6], opacity: [0.45, 0] }} transition={{ delay: 2 + i * 0.25, duration: 2.2, repeat: Infinity, ease: 'easeOut' }} style={{ transformOrigin: `${pin.x}px ${pin.y}px` }} />
            )}
            <motion.circle cx={pin.x} cy={pin.y} r={6} fill={pin.tone} stroke="#fff" strokeWidth={2.5} initial={reduceMotion ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.9 + i * 0.25, type: 'spring', stiffness: 400, damping: 14 }} style={{ transformOrigin: `${pin.x}px ${pin.y}px` }} />
          </g>
        ))}
      </svg>
      {/* Viñeta para que el plano se desvanezca hacia los bordes */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,#F4F7FA_95%)]" />
    </div>
  );
}
