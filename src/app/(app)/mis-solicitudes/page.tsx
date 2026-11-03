import type { Metadata } from 'next';
import MyRequestsView from '@/components/requests/MyRequestsView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Mis solicitudes | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['MIS_SOLICITUDES']}>
      <MyRequestsView />
    </RequireModule>
  );
}
