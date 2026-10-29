"use client";

import { useId } from "react";
import { Montserrat } from "next/font/google";
import type { CSSProperties } from "react";

interface PraxisLoaderProps {
  /** Ancho del logo en px */
  size?: number;
  /** Texto bajo el logo. Pasa null para ocultarlo */
  label?: string | null;
  /** Partículas sutiles alrededor del logo (como en el video) */
  particles?: boolean;
}

const font = Montserrat({ subsets: ["latin"], weight: ["500", "600"] });

/* ───────── Colores tomados del logo ───────── */
const BLUE = "#1CA3E9";
const GREEN = "#35BE8B";
const NAVY = "#132240";

/** Interpola entre dos colores HEX (#rrggbb) */
function mix(a: string, b: string, t: number) {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  const c = [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/* ───────── Geometría (coordenadas del logo, viewBox 20 -30 720 780) ───────── */
// Contorno hexagonal fino (fase 1)
const HEX = "M380 10 L695 185 L695 535 L385 718 L72 535 L72 185 Z";
// Líneas finas de la cara superior (fase 2)
// El video la dibuja desde el lado derecho hacia el izquierdo
const TOP_LINES = "M695 185 L385 355 L72 185";
const TOP_HOLE = "M222 185 L380 95 L545 185 L380 275 Z";

// Formas sólidas finales (fase 3)
const BLUE_FRAME =
  "M72 185 L380 10 L695 185 L385 355 Z M222 185 L380 95 L545 185 L380 275 Z";
const NAVY_P =
  "M72 190 L385 358 L385 495 Q385 542 335 538 L150 482 L150 582 L72 545 Z " +
  "M140 305 L300 392 Q322 405 318 435 Q312 465 285 460 L140 392 Z";
const GREEN_CHECK =
  "M386 392 L478 464 L625 232 L695 192 L695 222 L508 572 L486 580 L386 485 Z";
const GREEN_BRACKET =
  "M160 520 L385 635 L627 497 L627 366 L695 239 L695 535 L385 718 L160 592 Z";

// Trazos guía que "dibujan" cada forma sólida (se usan dentro de máscaras)
const GUIDE_BLUE = "M147 185 L380 52 L620 185 L382 315 Z";
// El check se traza empezando por arriba a la derecha (brazo largo) y termina en el brazo corto
const GUIDE_CHECK = "M700 190 L486 525 L380 440";
// La escuadra verde baja por la derecha y recorre la base hacia la izquierda
const GUIDE_BRACKET = "M661 280 L661 520 L385 676 L180 560";

/* ───────── Partículas decorativas (posiciones fijas = sin hydration mismatch) ───────── */
const PARTICLES = [
  { x: 60, y: 60, l: 26, a: -30, dx: 40, dy: -30, d: 0.0, c: BLUE },
  { x: 700, y: 90, l: 20, a: 25, dx: -30, dy: -40, d: 0.8, c: GREEN },
  { x: 40, y: 400, l: 22, a: 60, dx: 30, dy: 30, d: 1.6, c: GREEN },
  { x: 730, y: 430, l: 28, a: -50, dx: -40, dy: 20, d: 0.4, c: BLUE },
  { x: 150, y: 700, l: 18, a: 20, dx: 25, dy: 35, d: 2.1, c: GREEN },
  { x: 600, y: 710, l: 24, a: -20, dx: -35, dy: 30, d: 1.2, c: BLUE },
  { x: 330, y: -10, l: 20, a: 80, dx: 10, dy: -35, d: 2.6, c: BLUE },
  { x: 520, y: 20, l: 16, a: -70, dx: 30, dy: -25, d: 1.9, c: GREEN },
  { x: 20, y: 230, l: 18, a: 15, dx: -30, dy: -20, d: 3.0, c: BLUE },
  { x: 745, y: 280, l: 22, a: 40, dx: 35, dy: -10, d: 2.3, c: GREEN },
];

export default function PraxisLoader({
  size = 202,
  label = "Cargando",
  particles = true,
}: PraxisLoaderProps) {
  // IDs únicos por instancia (los ":" de useId rompen url(#...))
  const uid = useId().replace(/:/g, "");
  const gradId = `${uid}-grad`;
  const maskBlue = `${uid}-mb`;
  const maskCheck = `${uid}-mc`;
  const maskBracket = `${uid}-mg`;

  const maskArea = { x: 0, y: -40, width: 780, height: 800 };

  return (
    <div
      className="flex flex-col items-center justify-center gap-6"
      role="status"
      aria-live="polite"
      aria-label={label ?? "Cargando"}
    >
      <style jsx>{`
        .loader {
          --d: 5.6s; /* duración total del ciclo */
          --ease: cubic-bezier(0.65, 0, 0.35, 1);
        }

        /* Todo el logo entra y sale suavemente para que el loop no se note */
        .stage {
          animation: stage var(--d) linear infinite;
        }
        .pop {
          transform-box: fill-box;
          transform-origin: center;
          animation: pop var(--d) var(--ease) infinite;
        }

        /* Fase 1: contorno hexagonal con degradado azul → verde */
        .hex {
          stroke-dasharray: 1 1;
          stroke-dashoffset: 1;
          animation: hex var(--d) var(--ease) infinite;
        }
        /* Fase 2: líneas finas de la cara superior */
        .thin {
          stroke-dasharray: 1 1;
          stroke-dashoffset: 1;
          animation: thin var(--d) var(--ease) infinite;
        }
        /* La P aparece desde abajo */
        .p {
          transform-box: fill-box;
          transform-origin: center;
          animation: p3d var(--d) cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        /* Fase 3: las formas sólidas se "dibujan" con máscaras */
        .guide {
          stroke-dasharray: 1 1;
          stroke-dashoffset: 1;
        }
        .g-check {
          animation: drawCheck var(--d) var(--ease) infinite;
        }
        .g-blue {
          animation: drawBlue var(--d) var(--ease) infinite;
        }
        .g-bracket {
          animation: drawBracket var(--d) var(--ease) infinite;
        }

        .particle {
          opacity: 0;
          animation: drift 3.4s ease-out infinite;
        }

        .glow {
          animation: glow var(--d) ease-in-out infinite;
        }
        /* Texto: color azul → verde letra por letra + ola de letras */
        .letter {
          display: inline-block;
          animation: letter 1.9s cubic-bezier(0.45, 0, 0.55, 1) infinite;
        }

        @keyframes stage {
          0% { opacity: 0; }
          3% { opacity: 1; }
          88% { opacity: 1; }
          96%, 100% { opacity: 0; }
        }
        /* 1 · contorno hexagonal */
        @keyframes hex {
          0% { stroke-dashoffset: 1; opacity: 1; }
          16% { stroke-dashoffset: 0; opacity: 1; }
          58% { stroke-dashoffset: 0; opacity: 1; }
          70%, 100% { stroke-dashoffset: 0; opacity: 0; }
        }
        /* 2 · "V" interna de la cara superior (derecha → centro → izquierda) */
        @keyframes thin {
          0%, 16% { stroke-dashoffset: 1; opacity: 1; }
          29% { stroke-dashoffset: 0; opacity: 1; }
          58% { stroke-dashoffset: 0; opacity: 1; }
          70%, 100% { stroke-dashoffset: 0; opacity: 0; }
        }
        /* P 3D: entra al instante junto con el contorno */
        @keyframes p3d {
          0% { opacity: 0; transform: scale(0.94); }
          8%, 100% { opacity: 1; transform: scale(1); }
        }
        /* 3 · check (primero en rellenarse) */
        @keyframes drawCheck {
          0%, 30% { stroke-dashoffset: 1; }
          42%, 100% { stroke-dashoffset: 0; }
        }
        /* 4 · escuadra verde */
        @keyframes drawBracket {
          0%, 46% { stroke-dashoffset: 1; }
          59%, 100% { stroke-dashoffset: 0; }
        }
        /* 5 · marco azul (último) */
        @keyframes drawBlue {
          0%, 49% { stroke-dashoffset: 1; }
          66%, 100% { stroke-dashoffset: 0; }
        }
        @keyframes pop {
          0%, 68% { transform: scale(1); }
          75% { transform: scale(1.035); }
          84%, 100% { transform: scale(1); }
        }
        @keyframes drift {
          0% { opacity: 0; transform: translate(0, 0); }
          30% { opacity: 0.75; }
          100% { opacity: 0; transform: translate(var(--dx), var(--dy)); }
        }
        @keyframes glow {
          0%, 55% { opacity: 0; transform: scale(0.8); }
          76% { opacity: 0.5; transform: scale(1.05); }
          96%, 100% { opacity: 0; transform: scale(0.9); }
        }
        @keyframes letter {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          25% { opacity: 1; transform: translateY(-4px); }
        }

        /* Accesibilidad: sin movimiento, se muestra el logo final estático */
        @media (prefers-reduced-motion: reduce) {
          .stage, .pop, .p, .guide, .letter {
            animation: none !important;
            opacity: 1;
            transform: none;
            stroke-dashoffset: 0;
          }
          .hex, .thin, .particle, .glow {
            animation: none !important;
            opacity: 0;
          }
        }
      `}</style>

      <div
        className="loader relative"
        style={{ width: size, height: size * (780 / 720) } as CSSProperties}
      >
        {/* Resplandor suave detrás del logo */}
        <div
          className="glow absolute inset-0 -z-10 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${BLUE}55 0%, ${GREEN}33 55%, transparent 75%)`,
          }}
        />

        <svg
          viewBox="20 -40 720 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1="380"
              y1="10"
              x2="385"
              y2="718"
            >
              <stop offset="0%" stopColor={BLUE} />
              <stop offset="100%" stopColor={GREEN} />
            </linearGradient>

            <mask id={maskBlue} maskUnits="userSpaceOnUse" {...maskArea}>
              <path
                d={GUIDE_BLUE}
                pathLength={1}
                stroke="#fff"
                strokeWidth={175}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="guide g-blue"
              />
            </mask>
            <mask id={maskCheck} maskUnits="userSpaceOnUse" {...maskArea}>
              <path
                d={GUIDE_CHECK}
                pathLength={1}
                stroke="#fff"
                strokeWidth={120}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="guide g-check"
              />
            </mask>
            <mask id={maskBracket} maskUnits="userSpaceOnUse" {...maskArea}>
              <path
                d={GUIDE_BRACKET}
                pathLength={1}
                stroke="#fff"
                strokeWidth={160}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="guide g-bracket"
              />
            </mask>
          </defs>

          {/* Partículas */}
          {particles && (
            <g>
              {PARTICLES.map((p, i) => (
                <line
                  key={i}
                  x1={p.x}
                  y1={p.y}
                  x2={p.x + p.l * Math.cos((p.a * Math.PI) / 180)}
                  y2={p.y + p.l * Math.sin((p.a * Math.PI) / 180)}
                  stroke={p.c}
                  strokeWidth={5}
                  strokeLinecap="round"
                  className="particle"
                  style={
                    {
                      "--dx": `${p.dx}px`,
                      "--dy": `${p.dy}px`,
                      animationDelay: `${p.d}s`,
                    } as CSSProperties
                  }
                />
              ))}
            </g>
          )}

          <g className="stage">
            <g className="pop">
              {/* 1 · contorno hexagonal con degradado */}
              <path
                d={HEX}
                pathLength={1}
                stroke={`url(#${gradId})`}
                strokeWidth={9}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="hex"
              />

              {/* 2 · V interna de la cara superior */}
              <path
                d={TOP_LINES}
                pathLength={1}
                stroke={BLUE}
                strokeWidth={8}
                strokeLinejoin="round"
                strokeLinecap="round"
                className="thin"
              />
              <path
                d={TOP_HOLE}
                pathLength={1}
                stroke={BLUE}
                strokeWidth={8}
                strokeLinejoin="round"
                className="thin"
              />

              {/* P 3D visible desde el inicio */}
              <path d={NAVY_P} fill={NAVY} fillRule="evenodd" className="p" />

              {/* 3 · check → escuadra verde → marco azul */}
              <path
                d={GREEN_CHECK}
                fill={GREEN}
                mask={`url(#${maskCheck})`}
              />
              <path
                d={BLUE_FRAME}
                fill={BLUE}
                fillRule="evenodd"
                mask={`url(#${maskBlue})`}
              />
              <path
                d={GREEN_BRACKET}
                fill={GREEN}
                mask={`url(#${maskBracket})`}
              />
            </g>
          </g>
        </svg>
      </div>

      {label && (
        <span
          aria-hidden="true"
          className={`${font.className} uppercase`}
          style={{
            fontSize: Math.max(12, size * 0.075),
            fontWeight: 500,
            letterSpacing: "0.38em",
            paddingLeft: "0.38em", // compensa el espaciado final para centrar
          }}
        >
          {Array.from(label).map((ch, i, arr) => (
            <span
              key={i}
              className="letter"
              style={{
                color: mix(BLUE, GREEN, arr.length > 1 ? i / (arr.length - 1) : 0),
                animationDelay: `${i * 0.12}s`,
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}