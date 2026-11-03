import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResetPasswordFlow, { ResetPasswordFallback } from '@/components/auth/recovery/ResetPasswordFlow';

// El token viaja en la URL: no se envía como Referer a otros sitios ni se indexa.
export const metadata: Metadata = {
  title: 'Nueva contraseña | PRAXIS',
  description: 'Crea una nueva contraseña para tu cuenta institucional',
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <TokenResetFlow params={params} />
    </Suspense>
  );
}

async function TokenResetFlow({ params }: { params: Params }) {
  const { token } = await params;
  return <ResetPasswordFlow token={token} />;
}
