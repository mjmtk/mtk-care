/**
 * Authentication and authorization types
 */

/**
 * App roles defined in Azure AD
 */
export enum AppRoles {
    Administrator = "Administrator",
    OrganisationExecutive = "Organisation Executive",
    ProgramManager = "Program Manager",
    Supervisor = "Supervisor",
    Caseworker = "Caseworker",
    PracticeLead = "Practice Lead"
}

export type RoleMapping = {
  [key: string]: AppRoles;
};

/**
 * User profile type for authentication
 */
export interface UserProfile {
  roles: AppRoles[];
  displayName: string;
  email: string;
  isFallback?: boolean;
}