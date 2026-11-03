"use client";

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

const NAVY = '#132240';
const NAVY_LIGHT = '#1B2E52';
const BLUE = '#1CA3E9';
const GREEN = '#35BE8B';

/**
 * Momento principal del flujo: la carta entra al sobre, la solapa se cierra y aparece la confirmación.
 * `playKey` reinicia la animación (por ejemplo, al reenviar el enlace).
 */
export default function MailSentIllustration({ playKey = 0 }: { playKey?: number }) {
  const scope = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        { motion: '(prefers-reduced-motion: no-preference)', reduce: '(prefers-reduced-motion: reduce)' },
        (context) => {
          const { reduce } = context.conditions as { motion: boolean; reduce: boolean };

          gsap.set('.flap-open', { scaleY: 1, svgOrigin: '120 70' });
          gsap.set('.flap-closed', { scaleY: 0, svgOrigin: '120 70' });
          gsap.set('.badge', { scale: 0, svgOrigin: '190 66' });
          gsap.set('.ring', { scale: 1, opacity: 0, svgOrigin: '190 66' });

          if (reduce) {
            gsap.set('.letter', { y: 44, opacity: 1 });
            gsap.set('.flap-open', { scaleY: 0 });
            gsap.set('.flap-closed', { scaleY: 1 });
            gsap.set('.badge', { scale: 1 });
            return;
          }

          gsap
            .timeline({ defaults: { ease: 'power2.out' } })
            .from('.envelope', { y: 18, opacity: 0, duration: 0.45 })
            .fromTo('.letter', { y: -36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45 }, '-=0.1')
            .to('.letter', { y: 44, duration: 0.6, ease: 'power2.inOut' }, '+=0.15')
            .to('.flap-open', { scaleY: 0, duration: 0.16, ease: 'power1.in' })
            .to('.flap-closed', { scaleY: 1, duration: 0.24, ease: 'back.out(2)' })
            .to('.envelope', { y: -8, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '-=0.05')
            .to('.trail', { strokeDashoffset: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, '<')
            .to('.badge', { scale: 1, duration: 0.45, ease: 'back.out(2.4)' }, '-=0.25')
            .to('.trail', { opacity: 0, duration: 0.4 }, '+=0.2')
            .fromTo(
              '.ring',
              { scale: 1, opacity: 0.6 },
              { scale: 2.1, opacity: 0, duration: 1.6, repeat: -1, ease: 'power1.out' },
              '-=0.5',
            );
        },
      );

      return () => mm.revert();
    },
    { scope, dependencies: [playKey], revertOnUpdate: true },
  );

  return (
    <svg ref={scope} viewBox="0 0 240 170" className="mx-auto h-40 w-auto sm:h-48" role="img" aria-label="Correo enviado">
      <ellipse cx="120" cy="160" rx="72" ry="6" fill="#E2E8F0" />

      <g stroke={BLUE} strokeWidth="3" strokeLinecap="round" strokeDasharray="22" strokeDashoffset="22">
        <path className="trail" opacity="0" d="M28 64h14" />
        <path className="trail" opacity="0" d="M20 92h22" />
        <path className="trail" opacity="0" d="M30 120h12" />
      </g>

      <g className="envelope">
        <rect x="50" y="70" width="140" height="82" rx="10" fill={NAVY} />
        <path className="flap-open" d="M50 70 L120 26 L190 70 Z" fill={NAVY_LIGHT} />

        <g className="letter">
          <rect x="68" y="22" width="104" height="78" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="80" y="36" width="44" height="6" rx="3" fill={BLUE} />
          <rect x="80" y="50" width="80" height="4" rx="2" fill="#E2E8F0" />
          <rect x="80" y="60" width="68" height="4" rx="2" fill="#E2E8F0" />
          <rect x="80" y="74" width="36" height="10" rx="5" fill={GREEN} />
        </g>

        <path d="M50 84 L120 124 L190 84 V142 a10 10 0 0 1 -10 10 H60 a10 10 0 0 1 -10 -10 Z" fill={NAVY_LIGHT} />
        <path className="flap-closed" d="M50 70 L120 112 L190 70 Z" fill="#22385F" />
      </g>

      <circle className="ring" cx="190" cy="66" r="16" fill="none" stroke={GREEN} strokeWidth="2" />
      <g className="badge">
        <circle cx="190" cy="66" r="16" fill={GREEN} />
        <path d="M182 66.5l5.5 5.5 10.5-11" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
