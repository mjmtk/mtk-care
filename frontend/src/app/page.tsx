'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthBypassSession } from '@/hooks/useAuthBypass';

export default function Home() {
  const { data: session, status, isAuthBypass } = useAuthBypassSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (session) {
      // If authenticated (either via bypass or NextAuth), redirect to dashboard
      router.push('/dashboard');
    } else {
      // If not authenticated and not in bypass mode, redirect to sign-in
      router.push('/api/auth/signin');
    }
  }, [session, status, router]);

  // Show loading while determining redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
        {isAuthBypass && (
          <p className="mt-2 text-green-600">🚧 Auth Bypass Mode Active</p>
        )}
        <p className="mt-1 text-xs text-gray-500">Status: {status}</p>
      </div>
    </div>
  );
}
