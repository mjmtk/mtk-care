'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useAuthBypass } from '@/components/providers/auth-bypass-provider';
import { useRouter } from 'next/navigation';

export function SignInButton() {
  const { isAuthBypassMode, resetBypassSession } = useAuthBypass();
  const router = useRouter();

  const handleSignIn = () => {
    if (isAuthBypassMode) {
      // In bypass mode, reset the bypass session and redirect to dashboard
      resetBypassSession();
      router.push('/dashboard');
    } else {
      // Normal Azure AD sign-in
      signIn('azure-ad');
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Sign in with {isAuthBypassMode ? 'Test Account' : 'Microsoft'}
    </Button>
  );
}
