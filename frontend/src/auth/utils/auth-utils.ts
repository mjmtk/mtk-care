import { ROLE_NAMES } from '@/types/auth';

/**
 * Returns the effective roles for a user, considering impersonation.
 */
export function getEffectiveRoles(userRoles: string[], impersonatedRole: string | null): string[] {
  if (impersonatedRole) {
    // When impersonating, only return the impersonated role to properly emulate that role's experience
    return [impersonatedRole];
  }
  return userRoles;
}

/**
 * Checks if a user has a specific role, considering impersonation and admin override.
 */
export function hasRole(role: string, userRoles: string[], impersonatedRole: string | null): boolean {
  // If checking for Administrator role and user is actually an admin,
  // return true regardless of impersonation to ensure admin features remain accessible
  if (role === ROLE_NAMES.ADMINISTRATOR && userRoles.includes(ROLE_NAMES.ADMINISTRATOR)) {
    return true;
  }
  return getEffectiveRoles(userRoles, impersonatedRole).includes(role);
}
