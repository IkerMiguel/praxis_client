import type { Metadata } from 'next';
import UsersView from '@/components/admin/UsersView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Usuarios y roles | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['ADMIN_USUARIOS']}>
      <UsersView />
    </RequireModule>
  );
}
