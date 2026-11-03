import type { Metadata } from 'next';
import ParametersView from '@/components/admin/ParametersView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Parámetros del sistema | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['ADMIN_PARAMETROS']}>
      <ParametersView />
    </RequireModule>
  );
}
