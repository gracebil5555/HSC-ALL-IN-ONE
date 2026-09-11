import { redirect } from 'next/navigation';

export default function Home() {
  // Rediriger automatiquement vers la page de connexion
  // ou le dashboard selon la logique de votre application
  redirect('/login');
}
