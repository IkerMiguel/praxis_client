import type { Metadata } from 'next';
import LocationsView from '@/components/admin/LocationsView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Ubicaciones | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['ADMIN_UBICACIONES']}>
      <LocationsView />
    </RequireModule>
  );
}
