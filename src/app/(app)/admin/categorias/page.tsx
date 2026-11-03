import type { Metadata } from 'next';
import CategoriesView from '@/components/admin/CategoriesView';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Categorías de daño | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['ADMIN_CATEGORIAS']}>
      <CategoriesView />
    </RequireModule>
  );
}
