import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    // If not authenticated, redirect to sign-in
    return redirect('/api/auth/signin');
  }

  // If authenticated, redirect to dashboard
  return redirect('/dashboard');
}
