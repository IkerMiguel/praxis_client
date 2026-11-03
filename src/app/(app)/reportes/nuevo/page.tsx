import type { Metadata } from 'next';
import ReportForm from '@/components/report/ReportForm';
import RequireModule from '@/lib/session/RequireModule';

export const instant = false;

export const metadata: Metadata = { title: 'Nuevo reporte | PRAXIS' };

export default function Page() {
  return (
    <RequireModule modules={['NUEVO_REPORTE']}>
      <ReportForm />
    </RequireModule>
  );
}
