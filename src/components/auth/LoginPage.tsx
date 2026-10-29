"use client";

import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-[#F3F4F8]">
      {/* SECCIÓN IZQUIERDA: FONDO BLANCO BASE CON OVERLAY OSCURO */}
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
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Infraestructura, trazabilidad y gestión inteligente del campus.
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed font-normal">
              Monitoreo continuo de activos electromecánicos, bioseguridad y redes críticas de 48 pabellones universitarios en tiempo real.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80">
          <span className="font-medium tracking-wide">Sistema Central de Planta Física</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </section>

      {/* SECCIÓN DERECHA: FORMULARIO */}
      {/* Redujimos el padding contenedor para pantallas pequeñas y medianas */}
      <section className="flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F3F4F8]">
        {/* Tarjeta interior responsiva: max-w ajustado y padding escalable */}
        <div className="w-full max-w-[420px] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/60 space-y-5 lg:space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Acceso a la Plataforma</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">Inicia sesión con tus credenciales institucionales</p>
            </div>
            <img 
              src="/images/Logo2.png" 
              alt="Praxis Icon" 
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0"
            />
          </div>

          {/* ACCESOS INSTITUCIONALES (SSO) */}
          <div className="space-y-4">
            <button
              onClick={() => alert("Redirigiendo a autenticación institucional...")}
              className="w-full py-3 px-4 bg-[#EEF2FC] hover:bg-[#E4ECF8] text-[#1E3A8A] font-semibold rounded-xl text-xs flex items-center justify-center gap-3 transition-colors duration-200 shadow-sm border border-slate-200/50"
            >
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 0h10.5v10.5H0z" fill="#f25022" />
                  <path d="M11.8 0H22.3v10.5H11.8z" fill="#7fba00" />
                  <path d="M0 11.8h10.5V22.3H0z" fill="#00a4ef" />
                  <path d="M11.8 11.8H22.3V22.3H11.8z" fill="#ffb900" />
                </svg>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.2-.61-.31-1.28-.31-1.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
              </div>
              Continuar con Correo Universitario
            </button>

            <div className="relative flex py-0.5 items-center">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">o mediante usuario local</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>
          </div>

          <LoginForm />

          <div className="pt-3 sm:pt-4 border-t border-slate-100 text-center text-[10px] sm:text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-slate-600 font-semibold">
              <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Conexión cifrada TLS 1.3 - TI Institucional
            </div>
            <p className="text-slate-400">Sede Campus Central - Mesa de Ayuda MEP</p>
          </div>
        </div>
      </section>
    </main>
  );
}