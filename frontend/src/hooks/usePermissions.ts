import { useContext } from 'react';
import { useAuthBypassSession } from './useAuthBypass';
import { useRoleSwitcher } from '@/components/providers/role-switcher-provider';
import { AbilityContext } from '@/auth/ability-context';
import { createAbilityForUser, AppAbility } from '@/auth/ability';

/**
 * Hook to get current user's CASL ability instance
 */
export function useAbility(): AppAbility {
  const { data: session } = useAuthBypassSession();
  const { currentRoles, isRoleSwitching } = useRoleSwitcher();
  const contextAbility = useContext(AbilityContext);
  
  // Use role switcher roles if active, otherwise use session roles
  const effectiveRoles = isRoleSwitching ? currentRoles : (session?.user?.roles || []);
  
  // Create fresh ability with current roles (for role switching)
  if (isRoleSwitching || !contextAbility) {
    return createAbilityForUser({
      roles: effectiveRoles,
      id: session?.user?.id ? String(session.user.id) : undefined,
      // Add program/practice context when available
      programIds: (session?.user as any)?.programIds || undefined,
      practiceId: (session?.user as any)?.practiceId || undefined,
    });
  }
  
  return contextAbility;
}

/**
 * Hook for permission checking with CASL
 */
export function usePermissions() {
  const { data: session } = useAuthBypassSession();
  const { currentRoles, isRoleSwitching } = useRoleSwitcher();
  const ability = useAbility();
  
  // Get effective roles for legacy compatibility
  const effectiveRoles = isRoleSwitching ? currentRoles : (session?.user?.roles || []);
  
  return {
    // CASL permission methods
    can: ability.can.bind(ability),
    cannot: ability.cannot.bind(ability),
    
    // Convenience methods for common patterns
    canAccess: (subject: string) => ability.can('access', subject as any),
    canRead: (subject: string, context?: any) => ability.can('read', subject as any, context),
    canCreate: (subject: string) => ability.can('create', subject as any),
    canUpdate: (subject: string, context?: any) => ability.can('update', subject as any, context),
    canDelete: (subject: string, context?: any) => ability.can('delete', subject as any, context),
    canManage: (subject: string) => ability.can('manage', subject as any),
    canView: (subject: string, context?: any) => ability.can('view', subject as any, context),
    canExport: (subject: string) => ability.can('export', subject as any),
    
    // Role-based shortcuts (for migration compatibility)
    hasRole: (role: string) => {
      // Access the session from the hook level
      return effectiveRoles.some(r => r.toLowerCase() === role.toLowerCase());
    },
    
    // Analytics-specific permissions
    canViewAnalytics: (level?: 'client' | 'program' | 'org', context?: any) => {
      if (!level) return ability.can('view', 'Analytics');
      const subject = level === 'client' ? 'ClientAnalytics' 
                    : level === 'program' ? 'ProgramAnalytics'
                    : 'OrgAnalytics';
      return ability.can('view', subject as any, context);
    },
    
    canViewReports: (type?: 'client' | 'program' | 'financial', context?: any) => {
      if (!type) return ability.can('view', 'Report');
      const subject = type === 'client' ? 'ClientReport'
                    : type === 'program' ? 'ProgramReport'
                    : 'FinancialReport';
      return ability.can('view', subject as any, context);
    },
    
    canAccessDashboard: (type?: 'client' | 'program' | 'admin') => {
      if (!type) return ability.can('access', 'Dashboard');
      const subject = type === 'client' ? 'ClientDashboard'
                    : type === 'program' ? 'ProgramDashboard'
                    : 'AdminDashboard';
      return ability.can('access', subject as any);
    },
  };
}

/**
 * Legacy role-based access control hook
 * @deprecated Use usePermissions().can() with CASL subjects instead
 * Only kept for backward compatibility with existing components
 */
export function useRoleBasedAccess(config: {
  allowedRoles?: string[];
  deniedRoles?: string[];
  requireAll?: boolean;
}) {
  const { data: session } = useAuthBypassSession();
  const { currentRoles, isRoleSwitching } = useRoleSwitcher();
  const roles = isRoleSwitching ? currentRoles : (session?.user?.roles || []);
  
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

/**
 * Simple role accessor for backward compatibility
 * Returns current effective roles (respects role switching)
 */
export function useRoles() {
  const { data: session } = useAuthBypassSession();
  const { currentRoles, isRoleSwitching } = useRoleSwitcher();
  return isRoleSwitching ? currentRoles : (session?.user?.roles || []);
}

/**
 * Legacy role-based functions - kept for compatibility but prefer CASL permissions
 * @deprecated Use usePermissions().can() instead
 */
export function useHasRole(role: string): boolean {
  const roles = useRoles();
  return roles.some(r => r.toLowerCase() === role.toLowerCase());
}

export function useHasAnyRole(requiredRoles: string[]): boolean {
  const roles = useRoles();
  return requiredRoles.some(required => 
    roles.some(r => r.toLowerCase() === required.toLowerCase())
  );
}

export function useHasAllRoles(requiredRoles: string[]): boolean {
  const roles = useRoles();
  return requiredRoles.every(required => 
    roles.some(r => r.toLowerCase() === required.toLowerCase())
  );
}