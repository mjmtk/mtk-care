import { AbilityBuilder, createMongoAbility } from "@casl/ability";
import { AppRoles } from "@/types/auth";

// Define subject types for our application
type Subjects = 'Client' | 'Assessment' | 'Programme' | 'Referral' | 'Staff' | 'Report' | 'all';

// Define actions that can be performed
type Actions = 'manage' | 'create' | 'read' | 'update' | 'delete' | 'access';

// Define our application ability type
export type AppAbility = ReturnType<typeof defineRulesForUser>;

// Define user context interface
interface UserContext {
  roles: AppRoles[];
  id?: string;
  programIds?: string[];
  practiceId?: string;
}

// Define rules for user based on their roles
export function defineRulesForUser(user: UserContext) {
  const { can, cannot, build } = new AbilityBuilder(createMongoAbility<[Actions, Subjects]>);

  // Default: no permissions
  cannot('manage', 'all');

  // Administrator can do everything
  if (user.roles.includes(AppRoles.Administrator)) {
    can('manage', 'all');
  }

  // OrganisationExecutive permissions
  if (user.roles.includes(AppRoles.OrganisationExecutive)) {
    can('read', 'all');
    can('access', 'Report');
    can(['create', 'update', 'delete'], 'Programme');
    can(['create', 'update'], 'Staff');
  }

  // ProgramManager permissions
  if (user.roles.includes(AppRoles.ProgramManager)) {
    can('read', ['Client', 'Assessment', 'Programme', 'Referral', 'Staff']);
    can(['create', 'update'], ['Client', 'Assessment', 'Referral']);
    can('access', 'Report');
    can('manage', 'Programme'); // Add full management permission for programmes
    
    // Program-specific permissions
    if (user.programIds && user.programIds.length > 0) {
      can(['update'], 'Programme', { id: { $in: user.programIds } });
    }
  }

  // PracticeLead permissions
  if (user.roles.includes(AppRoles.PracticeLead)) {
    can('read', ['Client', 'Assessment', 'Programme', 'Referral', 'Staff']);
    can(['create', 'update'], ['Client', 'Assessment', 'Referral']);
    can('access', 'Report');
    
    // Practice-specific permissions
    if (user.practiceId) {
      can(['update'], 'Staff', { practiceId: user.practiceId });
    }
  }

  // Caseworker permissions
  if (user.roles.includes(AppRoles.Caseworker)) {
    can('read', ['Client', 'Assessment', 'Programme', 'Referral']);
    can(['create', 'update'], ['Client', 'Assessment', 'Referral']);
  }

  return build();
}