import { redirect } from 'next/navigation';

// El backend responde `redirect_to: '/login'` tras restablecer la contraseña.
export default function Page() {
  redirect('/auth/login');
}
