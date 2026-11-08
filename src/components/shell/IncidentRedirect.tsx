"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session/SessionProvider';
import { LoadingState } from '@/components/ui/States';

/** Módulos con acceso a la ficha operativa /incidencias/{id}. */
export const OPERATIONAL_MODULES = ['TRIAJE', 'PLANIFICACION', 'MIS_TAREAS', 'AUTORIZACIONES', 'VERIFICACION', 'CONSOLA'];

export default function IncidentRedirect({ id }: { id: string }) {
  const router = useRouter();
  const { menu } = useSession();
  const operational = menu.some((item) => OPERATIONAL_MODULES.includes(item.codigo));

  useEffect(() => {
    router.replace(operational ? `/incidencias/${id}` : `/mis-solicitudes/${id}`);
  }, [id, operational, router]);

  return <LoadingState label="Abriendo solicitud" />;
}
