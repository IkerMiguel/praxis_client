import api from './api';

export type EtapaEvidencia = 'REPORTE' | 'ACLARACION' | 'INSPECCION' | 'EJECUCION' | 'VERIFICACION';

export interface Evidencia {
  id: number;
  etapa: EtapaEvidencia;
  nombre_original: string;
  mime_type: string;
  tamano_bytes: number;
  hash_sha256?: string;
  fecha_carga: string;
  url: string;
}

const MAX_SIDE = 1920;
const COMPRESSIBLE = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Reduce fotos grandes en el navegador antes de subirlas (KAN-162): lado mayor a 1920 px y JPEG al 82 %.
 * Si el archivo no es una imagen o ya es liviano, se envía tal cual.
 */
export async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE.includes(file.type) || file.size < 600 * 1024) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.(png|webp|jpe?g)$/i, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

/** POST /incidencias/evidencias/upload: sube primero y referencia los ids después. */
export const evidenceService = {
  upload: async (
    files: File[],
    options: { incidencia_id?: string; etapa?: EtapaEvidencia; onProgress?: (percent: number) => void } = {},
  ): Promise<Evidencia[]> => {
    const form = new FormData();
    for (const file of files) form.append('archivos[]', file);
    if (options.incidencia_id) form.append('incidencia_id', options.incidencia_id);
    if (options.etapa) form.append('etapa', options.etapa);
    const { data } = await api.post<{ data: Evidencia[] }>('/incidencias/evidencias/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => event.total && options.onProgress?.(Math.round((event.loaded / event.total) * 100)),
    });
    return data.data;
  },
};
