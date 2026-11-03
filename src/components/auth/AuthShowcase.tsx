import type { ReactNode } from 'react';

interface AuthShowcaseProps {
  title?: ReactNode;
  description?: ReactNode;
}

/** Panel lateral con video de fondo compartido por las pantallas de autenticación. */
export default function AuthShowcase({
  title = 'Infraestructura, trazabilidad y gestión inteligente del campus.',
  description = 'Monitoreo continuo de activos electromecánicos, bioseguridad y redes críticas de 48 pabellones universitarios en tiempo real.',
}: AuthShowcaseProps) {
  return (
    <section className="relative hidden lg:flex flex-col justify-between p-8 xl:p-12 overflow-hidden bg-white border-r border-slate-800/20">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute bottom-0 left-0 right-0 w-full h-[70%] object-cover opacity-80 pointer-events-none translate-y-2 mix-blend-multiply"
      >
        <source src="/videos/background.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-[#0B0F19]/85 pointer-events-none" />

      <div className="relative z-10 space-y-3 pt-2">
        <div className="inline-flex items-center gap-5.5 bg-[#1E293B]/40 text-slate-300 text-[10px] font-semibold px-3 py-2 rounded backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          PRAXIS // CAMPUS CRMS <span className="text-emerald-400 font-bold ml-0.5">v4.8.2</span>
        </div>

        <div className="space-y-4 max-w-lg">
          <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">{title}</h1>
          <p className="text-slate-300 text-sm leading-relaxed font-normal">{description}</p>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80">
        <span className="font-medium tracking-wide">Sistema Central de Planta Física</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </section>
  );
}
