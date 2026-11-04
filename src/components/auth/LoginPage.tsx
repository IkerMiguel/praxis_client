"use client";

import { Suspense } from 'react';
import AuthLayout from './AuthLayout';
import LoginNotice from './LoginNotice';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout title="Acceso a la Plataforma" subtitle="Inicia sesión con tus credenciales institucionales">
      <Suspense fallback={null}>
        <LoginNotice />
      </Suspense>
      <LoginForm />
    </AuthLayout>
  );
}
