"use client";

import { createContext, useContext, ReactNode } from 'react';
import { Session } from 'next-auth';

interface AuthBypassContextType {
  isAuthBypassMode: boolean;
  mockSession: Session | null;
}

const AuthBypassContext = createContext<AuthBypassContextType>({
  isAuthBypassMode: false,
  mockSession: null,
});

export const useAuthBypass = () => useContext(AuthBypassContext);

interface AuthBypassProviderProps {
  children: ReactNode;
}

export function AuthBypassProvider({ children }: AuthBypassProviderProps) {
  const isAuthBypassMode = process.env.NEXT_PUBLIC_AUTH_BYPASS_MODE === 'true';
  
  const mockSession: Session | null = isAuthBypassMode ? {
    user: {
      id: 'bypass-user-id',
      name: 'Test User',
      email: 'test.user@example.com',
      image: null,
    },
    accessToken: 'mock-access-token-for-bypass',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  } : null;

  return (
    <AuthBypassContext.Provider value={{ isAuthBypassMode, mockSession }}>
      {children}
    </AuthBypassContext.Provider>
  );
}