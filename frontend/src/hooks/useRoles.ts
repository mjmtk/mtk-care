import { useAuthBypassSession } from './useAuthBypass';
import { useRoleSwitcher } from '@/components/providers/role-switcher-provider';
import { useEffect, useState } from 'react';

/**
 * Hook to get current user roles, respecting role switcher overrides
 */
export function useRoles() {
  const { data: session } = useAuthBypassSession();
  const { currentRoles, isRoleSwitching } = useRoleSwitcher();
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    // Use overridden roles if role switching is active
    if (isRoleSwitching) {
      setRoles(currentRoles);
    } else {
      setRoles(session?.user?.roles || []);
    }
  }, [session, currentRoles, isRoleSwitching]);

  // Listen for role changes
  useEffect(() => {
    const handleRoleChange = () => {
      // Force re-render when roles change
      setRoles(isRoleSwitching ? currentRoles : session?.user?.roles || []);
    };

    window.addEventListener('rolesChanged', handleRoleChange);
    return () => window.removeEventListener('rolesChanged', handleRoleChange);
  }, [session, currentRoles, isRoleSwitching]);

  return roles;
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: string): boolean {
  const roles = useRoles();
  return roles.some(r => r.toLowerCase() === role.toLowerCase());
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasAnyRole(requiredRoles: string[]): boolean {
  const roles = useRoles();
  return requiredRoles.some(required => 
    roles.some(r => r.toLowerCase() === required.toLowerCase())
  );
}

/**
 * Hook to check if user has all of the specified roles
 */
export function useHasAllRoles(requiredRoles: string[]): boolean {
  const roles = useRoles();
  return requiredRoles.every(required => 
    roles.some(r => r.toLowerCase() === required.toLowerCase())
  );
}

/**
 * Hook for role-based conditional rendering
 */
export function useRoleBasedAccess(config: {
  allowedRoles?: string[];
  deniedRoles?: string[];
  requireAll?: boolean;
}) {
  const roles = useRoles();
  
  let hasAccess = true;

  // Check allowed roles
  if (config.allowedRoles && config.allowedRoles.length > 0) {
    if (config.requireAll) {
      hasAccess = config.allowedRoles.every(required =>
        roles.some(r => r.toLowerCase() === required.toLowerCase())
      );
    } else {
      hasAccess = config.allowedRoles.some(required =>
        roles.some(r => r.toLowerCase() === required.toLowerCase())
      );
    }
  }

  // Check denied roles
  if (config.deniedRoles && config.deniedRoles.length > 0) {
    const hasDeniedRole = config.deniedRoles.some(denied =>
      roles.some(r => r.toLowerCase() === denied.toLowerCase())
    );
    if (hasDeniedRole) {
      hasAccess = false;
    }
  }

  return { hasAccess, roles };
}