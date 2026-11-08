"use client";

import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, CloudUpload, FileText, Loader2, Trash2, TriangleAlert } from 'lucide-react';
import { compressImage, evidenceService, type EtapaEvidencia, type Evidencia } from '@/services/evidenceService';
import { apiErrorMessage } from '@/lib/apiError';
import { formatBytes } from '@/lib/format';

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf';
const MAX_MB = 10;

interface Pending {
  key: string;
  name: string;
  size: number;
  progress: number;
  error?: string;
}

interface EvidenceUploaderProps {
  value: Evidencia[];
  onChange: (value: Evidencia[]) => void;
  max?: number;
  required?: boolean;
  etapa?: EtapaEvidencia;
  incidenciaId?: string;
  hint?: string;
  /** Avisa al formulario si hay cargas en curso para bloquear el envío. */
  onBusyChange?: (busy: boolean) => void;
}

/** Carga de evidencias con arrastrar y soltar, compresión en el navegador y vista previa (KAN-162). */
export default function EvidenceUploader({ value, onChange, max = 4, required = false, etapa, incidenciaId, hint, onBusyChange }: EvidenceUploaderProps) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const latest = useRef(value);

  useEffect(() => {
    latest.current = value;
  }, [value]);

  const remaining = max - value.length - pending.filter((p) => !p.error).length;

  const handleFiles = async (list: FileList | null) => {
    if (!list) return;
    setError('');
    const files = Array.from(list);
    const accepted = files.filter((f) => ACCEPT.split(',').includes(f.type));
    if (accepted.length < files.length) setError('Solo se aceptan fotos JPG, PNG o WEBP y documentos PDF.');
    const tooBig = accepted.filter((f) => f.size > MAX_MB * 1024 * 1024 && f.type === 'application/pdf');
    if (tooBig.length) setError(`Los PDF deben pesar menos de ${MAX_MB} MB.`);
    const usable = accepted.filter((f) => !tooBig.includes(f)).slice(0, Math.max(remaining, 0));
    if (accepted.length > Math.max(remaining, 0)) setError(`Puedes adjuntar hasta ${max} archivos.`);
    if (usable.length === 0) return;

    onBusyChange?.(true);
    await Promise.all(
      usable.map(async (original) => {
        const key = `${original.name}-${original.size}-${Math.random().toString(36).slice(2)}`;
        setPending((p) => [...p, { key, name: original.name, size: original.size, progress: 0 }]);
        try {
          const file = await compressImage(original);
          if (file.size > MAX_MB * 1024 * 1024) throw new Error(`“${original.name}” supera ${MAX_MB} MB incluso comprimida.`);
          const [uploaded] = await evidenceService.upload([file], {
            incidencia_id: incidenciaId,
            etapa: incidenciaId ? etapa : undefined,
            onProgress: (progress) => setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))),
          });
          setPending((p) => p.filter((x) => x.key !== key));
          onChange([...latest.current, uploaded]);
        } catch (err) {
          const message = err instanceof Error && !('isAxiosError' in err) ? err.message : apiErrorMessage(err, 'No se pudo subir el archivo.');
          setPending((p) => p.map((x) => (x.key === key ? { ...x, error: message } : x)));
        }
      }),
    );
    onBusyChange?.(false);
    if (input.current) input.current.value = '';
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragging ? 'border-praxis-sky bg-sky-50' : 'border-slate-200 bg-slate-50/60 hover:border-praxis-sky/60 hover:bg-sky-50/40'
        } ${remaining <= 0 ? 'pointer-events-none opacity-50' : ''}`}
      >
        <motion.span
          className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700"
          animate={dragging ? { y: -4, scale: 1.08 } : { y: 0, scale: 1 }}
        >
          <CloudUpload className="h-6 w-6" aria-hidden="true" />
        </motion.span>
        <span className="text-sm font-bold text-slate-800">Arrastra tus fotos aquí o haz clic para elegirlas</span>
        <span className="text-xs text-slate-500">{hint ?? `JPG, PNG, WEBP o PDF hasta ${MAX_MB} MB · máximo ${max} archivos`}</span>
        {required && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">Esta categoría exige al menos una foto</span>}
        <input ref={input} id={inputId} type="file" accept={ACCEPT} multiple className="sr-only" onChange={(e) => void handleFiles(e.target.files)} />
      </label>

      {error && (
        <p role="alert" className="flex items-center gap-2 text-sm text-red-600">
          <TriangleAlert className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      )}

      {(value.length > 0 || pending.length > 0) && (
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-500">
            Archivos adjuntos ({value.length} de {max})
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence initial={false}>
              {value.map((ev) => (
                <motion.li
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="flex items-center gap-3 rounded-xl border border-praxis-line bg-white p-2.5"
                >
                  {ev.mime_type.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ev.url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                      <FileText className="h-6 w-6" aria-hidden="true" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800">{ev.nombre_original}</span>
                    <span className="flex items-center gap-2 text-xs text-slate-500">
                      {formatBytes(ev.tamano_bytes)}
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Cargado
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((x) => x.id !== ev.id))}
                    aria-label={`Quitar ${ev.nombre_original}`}
                    className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
              {pending.map((p) => (
                <motion.li key={p.key} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`rounded-xl border p-3 ${p.error ? 'border-red-200 bg-red-50' : 'border-praxis-line bg-white'}`}>
                  <div className="flex items-center gap-2 text-sm">
                    {p.error ? <TriangleAlert className="h-4 w-4 text-red-500" aria-hidden="true" /> : <Loader2 className="h-4 w-4 animate-spin text-sky-600" aria-hidden="true" />}
                    <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{p.name}</span>
                    {p.error && (
                      <button type="button" onClick={() => setPending((list) => list.filter((x) => x.key !== p.key))} className="text-xs font-semibold text-red-700">
                        Descartar
                      </button>
                    )}
                  </div>
                  {p.error ? (
                    <p className="mt-1 text-xs text-red-700">{p.error}</p>
                  ) : (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <motion.div className="h-full rounded-full bg-praxis-sky" animate={{ width: `${p.progress}%` }} />
                    </div>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
    </div>
  );
}
