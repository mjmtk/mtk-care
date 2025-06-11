"use client";

import { createContext, useContext, ReactNode, useState } from 'react';
import { Session } from 'next-auth';

interface AuthBypassContextType {
  isAuthBypassMode: boolean;
  mockSession: Session | null;
  clearBypassSession: () => void;
  resetBypassSession: () => void;
}

const AuthBypassContext = createContext<AuthBypassContextType>({
  isAuthBypassMode: false,
  mockSession: null,
  clearBypassSession: () => {},
  resetBypassSession: () => {},
});

export const useAuthBypass = () => useContext(AuthBypassContext);

interface AuthBypassProviderProps {
  children: ReactNode;
}

export function AuthBypassProvider({ children }: AuthBypassProviderProps) {
  const isAuthBypassMode = process.env.NEXT_PUBLIC_AUTH_BYPASS_MODE === 'true';
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  
  const mockSession: Session | null = (isAuthBypassMode && !isLoggedOut) ? {
    user: {
      id: 'bypass-user-id',
      name: 'Test User',
      email: 'test.user@example.com',
      image: null,
      roles: ['Superuser', 'admin'], // Add admin roles for bypass mode
    },
    accessToken: 'mock-access-token-for-bypass',
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  } : null;

  const clearBypassSession = () => {
    setIsLoggedOut(true);
  };

  const resetBypassSession = () => {
    setIsLoggedOut(false);
  };

  return (
    <AuthBypassContext.Provider value={{ 
      isAuthBypassMode, 
      mockSession, 
      clearBypassSession,
      resetBypassSession
    }}>
      {children}
    </AuthBypassContext.Provider>
  );
}