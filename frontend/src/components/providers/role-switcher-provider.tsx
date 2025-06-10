"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuthBypassSession } from '@/hooks/useAuthBypass';
import { Session } from 'next-auth';
import { ROLE_NAMES } from '@/types/auth';
import { useDynamicRoles } from '@/contexts/DynamicRoleProvider';

interface RoleSwitcherContextType {
  availableRoles: string[];
  currentRoles: string[];
  switchToRole: (role: string) => void;
  switchToMultipleRoles: (roles: string[]) => void;
  resetToOriginalRoles: () => void;
  isRoleSwitching: boolean;
  canSwitchRoles: boolean;
}

const RoleSwitcherContext = createContext<RoleSwitcherContextType>({
  availableRoles: [],
  currentRoles: [],
  switchToRole: () => {},
  switchToMultipleRoles: () => {},
  resetToOriginalRoles: () => {},
  isRoleSwitching: false,
  canSwitchRoles: false,
});

export const useRoleSwitcher = () => useContext(RoleSwitcherContext);

interface RoleSwitcherProviderProps {
  children: ReactNode;
}

export function RoleSwitcherProvider({ children }: RoleSwitcherProviderProps) {
  const { data: session, status } = useAuthBypassSession();
  const [overriddenRoles, setOverriddenRoles] = useState<string[] | null>(null);
  const [originalRoles, setOriginalRoles] = useState<string[]>([]);
  
  // Get dynamic roles from API (with fallback to hardcoded)
  const { getAvailableRoleNames, loading: rolesLoading } = useDynamicRoles();
  
  // All available roles in the system (dynamic from API)
  const availableRoles = rolesLoading ? Object.values(ROLE_NAMES) : getAvailableRoleNames();

  // Determine if user can switch roles (must be superuser or admin)
  const canSwitchRoles = session?.user?.roles?.some(role => 
    role.toLowerCase() === 'superuser' || 
    role.toLowerCase() === 'admin' ||
    role.toLowerCase() === 'administrator'
  ) || false;

  // Get current roles (either overridden or original)
  const currentRoles = overriddenRoles || session?.user?.roles || [];

  // Store original roles when session loads
  useEffect(() => {
    if (session?.user?.roles && originalRoles.length === 0) {
      setOriginalRoles(session.user.roles);
    }
  }, [session, originalRoles.length]);

  const switchToRole = (role: string) => {
    if (!canSwitchRoles) return;
    
    setOverriddenRoles([role]);
    
    // Store in sessionStorage for persistence across page reloads
    sessionStorage.setItem('roleSwitcherOverride', JSON.stringify([role]));
    
    // Force re-render of components that depend on roles
    window.dispatchEvent(new Event('rolesChanged'));
  };

  const switchToMultipleRoles = (roles: string[]) => {
    if (!canSwitchRoles) return;
    
    setOverriddenRoles(roles);
    sessionStorage.setItem('roleSwitcherOverride', JSON.stringify(roles));
    window.dispatchEvent(new Event('rolesChanged'));
  };

  const resetToOriginalRoles = () => {
    setOverriddenRoles(null);
    sessionStorage.removeItem('roleSwitcherOverride');
    window.dispatchEvent(new Event('rolesChanged'));
  };

  // Check for stored role override on mount
  useEffect(() => {
    const storedOverride = sessionStorage.getItem('roleSwitcherOverride');
    if (storedOverride && canSwitchRoles) {
      try {
        const roles = JSON.parse(storedOverride);
        setOverriddenRoles(roles);
      } catch (e) {
        console.error('Failed to parse stored role override:', e);
      }
    }
  }, [canSwitchRoles]);

  // Create a modified session with overridden roles
  const modifiedSession = session && overriddenRoles ? {
    ...session,
    user: {
      ...session.user,
      roles: overriddenRoles,
    },
  } : session;

  // Override the session in the window object for other components to access
  useEffect(() => {
    if (modifiedSession && overriddenRoles) {
      (window as any).__ROLE_SWITCHER_SESSION__ = modifiedSession;
    } else {
      delete (window as any).__ROLE_SWITCHER_SESSION__;
    }
  }, [modifiedSession, overriddenRoles]);

  const value = {
    availableRoles,
    currentRoles,
    switchToRole,
    switchToMultipleRoles,
    resetToOriginalRoles,
    isRoleSwitching: overriddenRoles !== null,
    canSwitchRoles,
  };

  return (
    <RoleSwitcherContext.Provider value={value}>
      {children}
    </RoleSwitcherContext.Provider>
  );
}