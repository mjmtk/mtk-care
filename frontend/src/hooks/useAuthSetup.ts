import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { setTokenRefreshFunction } from '@/services/axios-client';

/**
 * Hook that sets up automatic token refresh for axios interceptors.
 * This connects NextAuth session management with axios automatic token refresh.
 */
export function useAuthSetup() {
  const { data: session, update } = useSession();

  useEffect(() => {
    // Set up the token refresh function for axios interceptors
    const refreshTokenFunction = async (): Promise<string | null> => {
      try {
        console.log('Attempting to refresh NextAuth session...');
        
        // Force NextAuth to refresh the session, which will trigger the JWT callback
        // and automatically refresh the access token if needed
        const refreshedSession = await update();
        
        if (refreshedSession?.accessToken) {
          console.log('NextAuth session refreshed successfully');
          return refreshedSession.accessToken;
        } else {
          console.warn('NextAuth session refresh did not return access token');
          return null;
        }
      } catch (error) {
        console.error('Error refreshing NextAuth session:', error);
        return null;
      }
    };

    // Set the refresh function in axios client
    setTokenRefreshFunction(refreshTokenFunction);

    // Cleanup function
    return () => {
      setTokenRefreshFunction(null);
    };
  }, [update]);

  return {
    session,
    isAuthenticated: !!session?.accessToken,
    accessToken: session?.accessToken || null,
  };
}