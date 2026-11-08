import { redirect } from 'next/navigation';

// Solo redirige: no hay contenido que prerenderizar para la navegación instantánea.
export const instant = false;

// El backend responde `redirect_to: '/login'` tras restablecer la contraseña.
export default function Page() {
  redirect('/auth/login');
}
