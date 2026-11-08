import { Eye } from 'lucide-react';

/** Aviso para roles con acceso de solo lectura a una vista de administración (D09: L). */
export default function ReadOnlyNotice() {
  return (
    <p className="flex items-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <Eye className="h-4 w-4 shrink-0" aria-hidden="true" />
      Tienes acceso de solo lectura a esta sección. Los cambios los realiza la administración de la plataforma.
    </p>
  );
}
