import type { Metadata } from 'next';
import RequestRecoveryFlow from '@/components/auth/recovery/RequestRecoveryFlow';

export const metadata: Metadata = {
  title: 'Recuperar contraseña | PRAXIS',
  description: 'Solicita un enlace para restablecer tu contraseña institucional',
};

export default function Page() {
  return <RequestRecoveryFlow />;
}
