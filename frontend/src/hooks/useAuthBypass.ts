import { useSession } from 'next-auth/react';
import { useAuthBypass } from '@/components/providers/auth-bypass-provider';

/**
 * Hook that provides session data with auth bypass support.
 * In bypass mode, returns mock session data.
 * In normal mode, returns NextAuth session data.
 */
export function useAuthBypassSession() {
  const { data: nextAuthSession, status: nextAuthStatus } = useSession();
  const { isAuthBypassMode, mockSession } = useAuthBypass();
  
  if (isAuthBypassMode) {
    return {
      data: mockSession,
      status: 'authenticated' as const,
      isAuthBypass: true,
    };
  }
  
  return {
    data: nextAuthSession,
    status: nextAuthStatus,
    isAuthBypass: false,
  };
}

/**
 * Hook to get access token with bypass support.
 * In bypass mode, returns a mock token.
 * In normal mode, returns the real access token.
 */
export function useAccessToken() {
  const { data: session, isAuthBypass } = useAuthBypassSession();
  
  if (isAuthBypass) {
    return 'mock-bypass-token';
  }
  
  return session?.accessToken || null;
}