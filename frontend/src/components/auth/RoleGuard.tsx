'use client';

import { ReactNode } from 'react';
import { useRoleBasedAccess } from '@/hooks/useRoles';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  deniedRoles?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * Component wrapper for role-based access control
 * 
 * @example
 * // Only show to Administrators
 * <RoleGuard allowedRoles={['Administrator']}>
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * @example
 * // Show to Supervisors OR Program Managers
 * <RoleGuard allowedRoles={['Supervisor', 'Program Manager']}>
 *   <ManagementTools />
 * </RoleGuard>
 * 
 * @example
 * // Hide from Caseworkers
 * <RoleGuard deniedRoles={['Caseworker']}>
 *   <AdvancedSettings />
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  allowedRoles,
  deniedRoles,
  requireAll = false,
  fallback,
  showError = false,
}: RoleGuardProps) {
  const { hasAccess, roles } = useRoleBasedAccess({
    allowedRoles,
    deniedRoles,
    requireAll,
  });

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to view this content.
            {allowedRoles && allowedRoles.length > 0 && (
              <div className="mt-2 text-sm">
                Required role{allowedRoles.length > 1 ? 's' : ''}: {allowedRoles.join(', ')}
              </div>
            )}
            <div className="mt-1 text-sm text-muted-foreground">
              Current role{roles.length > 1 ? 's' : ''}: {roles.join(', ') || 'None'}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}