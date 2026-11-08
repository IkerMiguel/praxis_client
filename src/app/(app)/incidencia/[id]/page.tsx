import { Suspense } from 'react';
import IncidentRedirect from '@/components/shell/IncidentRedirect';
import { LoadingState } from '@/components/ui/States';

export const instant = false;

type Params = Promise<{ id: string }>;

/** Enlace genérico a una incidencia (notificaciones): abre la ficha que corresponde al rol activo. */
export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<LoadingState label="Abriendo solicitud" />}>
      <Resolve params={params} />
    </Suspense>
  );
}

async function Resolve({ params }: { params: Params }) {
  const { id } = await params;
  return <IncidentRedirect id={id} />;
}
