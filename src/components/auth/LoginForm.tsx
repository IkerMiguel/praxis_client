"use client";

import { useState } from 'react';
import { authService } from '@/services/authService';
import PraxisLoader from '@/components/ui/PraxisLoader';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.login({ email, password });
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
    } catch (err) {
      setError('Credenciales inválidas o error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Redujimos a space-y-5 y los márgenes de los inputs para evitar el scrollbar
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
      {error && (
        <div className="p-2.5 text-xs bg-red-50 text-red-600 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* CAMPO USUARIO */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          Usuario o Correo Institucional
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-400 text-sm font-medium">@</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="r.morales@infraestructura.uni.edu"
            className="w-full pl-9 pr-4 py-3 bg-[#EEF2F6] border border-transparent rounded-xl text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition"
          />
        </div>
      </div>

      {/* CAMPO CONTRASEÑA */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
          Contraseña
        </label>
        <div className="relative flex items-center">
          <svg className="w-4 h-4 absolute left-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>

          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full pl-10 pr-11 py-3 bg-[#EEF2F6] border border-transparent rounded-xl text-slate-900 text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-700 transition focus:outline-none flex items-center justify-center shrink-0"
          >
            {showPassword ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* RECORDAR / OLVIDÉ */}
      <div className="flex items-center justify-between text-xs pt-0.5 pb-1">
        <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
          />
          Recordar en este equipo
        </label>
        <a href="#" className="text-slate-900 font-bold hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 px-4 bg-[#111827] hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 disabled:opacity-50"
      >
        {loading ? <PraxisLoader size={22} /> : 'Iniciar Sesión →'}
      </button>
    </form>
  );
}