'use client';

import { ReactNode } from 'react';
import { usePermissions, useRoleBasedAccess } from '@/hooks/usePermissions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  
  // CASL-based permissions (recommended)
  action?: string;
  subject?: string;
  context?: any;
  
  // Alternative: direct permission check
  check?: (permissions: ReturnType<typeof usePermissions>) => boolean;
  
  // Legacy role-based permissions (for migration compatibility)
  allowedRoles?: string[];
  deniedRoles?: string[];
  requireAll?: boolean;
  
  // Display options
  fallback?: ReactNode;
  showError?: boolean;
  errorMessage?: string;
}

/**
 * Component wrapper for CASL-based permission control
 * 
 * @example
 * // CASL-based permission (recommended)
 * <PermissionGuard action="access" subject="AdminDashboard">
 *   <AdminPanel />
 * </PermissionGuard>
 * 
 * @example
 * // Custom permission check
 * <PermissionGuard check={p => p.canViewAnalytics('org')}>
 *   <OrgAnalytics />
 * </PermissionGuard>
 * 
 * @example
 * // Context-aware permission
 * <PermissionGuard action="update" subject="Programme" context={{ id: programId }}>
 *   <EditProgramButton />
 * </PermissionGuard>
 * 
 * @example
 * // Legacy role-based (deprecated, use for migration only)
 * <PermissionGuard allowedRoles={['Administrator']}>
 *   <AdminPanel />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  action,
  subject,
  context,
  check,
  allowedRoles,
  deniedRoles,
  requireAll = false,
  fallback,
  showError = false,
  errorMessage,
}: PermissionGuardProps) {
  const permissions = usePermissions();
  
  // Always call the legacy role hook, but only use result when needed
  const roleCheck = useRoleBasedAccess({
    allowedRoles,
    deniedRoles,
    requireAll
  });
  
  let hasAccess = true;
  let accessMethod = '';

  // CASL-based permission check (primary method)
  if (action && subject) {
    hasAccess = permissions.can(action as any, subject as any, context);
    accessMethod = `${action} ${subject}`;
  }
  // Custom permission check
  else if (check) {
    hasAccess = check(permissions);
    accessMethod = 'custom permission check';
  }
  // Legacy role-based check (for migration compatibility)
  else if (allowedRoles || deniedRoles) {
    hasAccess = roleCheck.hasAccess;
    accessMethod = `roles: ${allowedRoles?.join(', ') || 'any'} (excluding ${deniedRoles?.join(', ') || 'none'})`;
  }
  else {
    console.warn('PermissionGuard: No permission check specified. Defaulting to allow access.');
  }

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
            {errorMessage || "You don't have permission to view this content."}
            <div className="mt-2 text-sm">
              Required: {accessMethod}
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
}

/**
 * Specialized guards for common permission patterns
 */
export function AdminGuard({ children, fallback, showError }: { 
  children: ReactNode; 
  fallback?: ReactNode; 
  showError?: boolean; 
}) {
  return (
    <PermissionGuard 
      allowedRoles={['Administrator', 'Superuser']} 
      fallback={fallback}
      showError={showError}
    >
      {children}
    </PermissionGuard>
  );
}

export function AnalyticsGuard({ 
  level, 
  context, 
  children, 
  fallback, 
  showError 
}: { 
  level?: 'client' | 'program' | 'org';
  context?: any;
  children: ReactNode; 
  fallback?: ReactNode; 
  showError?: boolean; 
}) {
  return (
    <PermissionGuard 
      check={p => p.canViewAnalytics(level, context)}
      fallback={fallback}
      showError={showError}
    >
      {children}
    </PermissionGuard>
  );
}

export function DashboardGuard({ 
  type, 
  children, 
  fallback, 
  showError 
}: { 
  type?: 'client' | 'program' | 'admin';
  children: ReactNode; 
  fallback?: ReactNode; 
  showError?: boolean; 
}) {
  return (
    <PermissionGuard 
      check={p => p.canAccessDashboard(type)}
      fallback={fallback}
      showError={showError}
    >
      {children}
    </PermissionGuard>
  );
}

/**
 * Legacy RoleGuard component for backward compatibility
 * @deprecated Use PermissionGuard instead
 */
export function RoleGuard(props: Omit<PermissionGuardProps, 'action' | 'subject' | 'check'>) {
  return <PermissionGuard {...props} />;
}