/**
 * Authentication and authorization types
 */

/**
 * Standard role names used in the system (now fetched from database)
 */
export const ROLE_NAMES = {
    SUPERUSER: "Superuser",
    ADMINISTRATOR: "Administrator",
    SUPERVISOR: "Supervisor",
    MANAGER: "Manager",
    PRACTITIONER: "Practitioner",
    STAFF: "Staff",
    READ_ONLY_USER: "ReadOnlyUser",
    RESTRICTED_USER: "RestrictedUser"
} as const;

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES];

export type RoleMapping = {
  [key: string]: string;
};

/**
 * User profile type for authentication
 */
export interface UserProfile {
  roles: string[];
  displayName: string;
  email: string;
  isFallback?: boolean;
}