import { AppRoles } from '../auth-config';

/**
 * Returns the effective roles for a user, considering impersonation.
 */
export function getEffectiveRoles(userRoles: AppRoles[], impersonatedRole: AppRoles | null): AppRoles[] {
  if (impersonatedRole) {
    // When impersonating, only return the impersonated role to properly emulate that role's experience
    return [impersonatedRole];
  }
  return userRoles;
}

/**
 * Checks if a user has a specific role, considering impersonation and admin override.
 */
export function hasRole(role: AppRoles, userRoles: AppRoles[], impersonatedRole: AppRoles | null): boolean {
  // If checking for Administrator role and user is actually an admin,
  // return true regardless of impersonation to ensure admin features remain accessible
  if (role === AppRoles.Administrator && userRoles.includes(AppRoles.Administrator)) {
    return true;
  }
  return getEffectiveRoles(userRoles, impersonatedRole).includes(role);
}
