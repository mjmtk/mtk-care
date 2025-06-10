import { AbilityBuilder, createMongoAbility, MongoAbility } from "@casl/ability";

// Define subject types for our application
type Subjects = 
  // Core entities (use 'read', 'create', 'update', 'delete')
  | 'Client' | 'Assessment' | 'Programme' | 'Referral' | 'Staff' | 'User'
  // Analytics and reports (use 'view', 'export')
  | 'Analytics' | 'ClientAnalytics' | 'ProgramAnalytics' | 'OrgAnalytics'
  | 'Report' | 'ClientReport' | 'ProgramReport' | 'FinancialReport'
  // Dashboard pages (use 'access')
  | 'Dashboard' | 'ClientDashboard' | 'ProgramDashboard' | 'AdminDashboard'
  // Dashboard widgets (use 'view')
  | 'ClientSummaryWidget' | 'ReferralStatsWidget' | 'ProgramMetricsWidget'
  | 'FinancialSummaryWidget' | 'RecentActivityWidget' | 'AlertsWidget'
  | 'AnalyticsWidget' | 'TeamPerformanceWidget'
  // System administration (use 'access', 'manage')
  | 'SystemConfig' | 'UserManagement' | 'RoleManagement' | 'AuditLog'
  // Documents and external (use 'read', 'create', 'update', 'delete')
  | 'Document' | 'ExternalOrg'
  // Special
  | 'all';

// Define actions that can be performed
type Actions = 
  | 'manage'    // Full access (create, read, update, delete)
  | 'create'    // Create new records
  | 'read'      // View/list records
  | 'update'    // Edit existing records
  | 'delete'    // Remove records
  | 'access'    // Access feature (for UI navigation)
  | 'view'      // View analytics/reports (read-only)
  | 'export'    // Export data
  | 'impersonate'; // Switch roles (development)

// Define our application ability type
export type AppAbility = MongoAbility<[Actions, Subjects]>;

// Export the ability function
export function createAbilityForUser(user: UserContext): AppAbility {
  return defineRulesForUser(user);
}

// Define user context interface
interface UserContext {
  roles: string[];
  id?: string;
  programIds?: string[];
  practiceId?: string;
}

// Define rules for user based on their roles
export function defineRulesForUser(user: UserContext) {
  const { can, cannot, build } = new AbilityBuilder<MongoAbility<[Actions, Subjects]>>(createMongoAbility);

  // Default: no permissions
  cannot('manage', 'all');

  // Map role names to permission levels (using case-insensitive matching)
  const hasRole = (roleName: string) => 
    user.roles.some(role => role.toLowerCase() === roleName.toLowerCase());

  // Superuser and Administrator - full system access
  if (hasRole('Superuser') || hasRole('Administrator')) {
    can('manage', 'all');
    can('impersonate', 'User'); // Role switching for testing
  }

  // Manager - strategic oversight and organization-wide access
  if (hasRole('Manager')) {
    // Core entity access
    can('read', ['Client', 'Assessment', 'Programme', 'Referral', 'Staff', 'ExternalOrg', 'Document']);
    can(['create', 'update', 'delete'], ['Programme', 'ExternalOrg']);
    can(['create', 'update'], ['Staff', 'User']);
    
    // Analytics and reporting
    can(['view', 'export'], ['Analytics', 'OrgAnalytics', 'ProgramAnalytics']);
    can(['view', 'export'], ['Report', 'FinancialReport', 'ProgramReport']);
    can('access', ['Dashboard', 'ProgramDashboard', 'AdminDashboard']);
    
    // Dashboard widgets
    can('view', ['ClientSummaryWidget', 'ReferralStatsWidget', 'ProgramMetricsWidget', 
                 'FinancialSummaryWidget', 'AnalyticsWidget', 'TeamPerformanceWidget']);
  }

  // Supervisor - team and program management
  if (hasRole('Supervisor')) {
    // Core entity access
    can('read', ['Client', 'Assessment', 'Programme', 'Referral', 'Staff', 'ExternalOrg', 'Document']);
    can(['create', 'update'], ['Client', 'Assessment', 'Referral', 'Document']);
    can('manage', 'Programme');
    
    // Analytics and reporting
    can(['view', 'export'], ['Analytics', 'ProgramAnalytics', 'ClientAnalytics']);
    can(['view', 'export'], ['Report', 'ProgramReport', 'ClientReport']);
    can('access', ['Dashboard', 'ClientDashboard', 'ProgramDashboard']);
    
    // Dashboard widgets
    can('view', ['ClientSummaryWidget', 'ReferralStatsWidget', 'ProgramMetricsWidget',
                 'RecentActivityWidget', 'TeamPerformanceWidget']);
    
    // Context-specific permissions
    if (user.programIds && user.programIds.length > 0) {
      can(['update', 'delete'], 'Programme', { id: { $in: user.programIds } } as any);
      can('view', 'ProgramAnalytics', { programId: { $in: user.programIds } } as any);
    }
    
    if (user.practiceId) {
      can(['update'], 'Staff', { practiceId: user.practiceId } as any);
    }
  }

  // Practitioner - client-facing operations
  if (hasRole('Practitioner')) {
    // Core entity access
    can('read', ['Client', 'Assessment', 'Programme', 'Referral', 'ExternalOrg', 'Document']);
    can(['create', 'update'], ['Client', 'Assessment', 'Referral', 'Document']);
    
    // Limited analytics
    can('view', ['ClientAnalytics', 'ClientReport']);
    can('access', ['Dashboard', 'ClientDashboard']);
    
    // Dashboard widgets
    can('view', ['ClientSummaryWidget', 'ReferralStatsWidget', 'RecentActivityWidget']);
  }

  // Staff - basic operational access
  if (hasRole('Staff')) {
    // Core entity access
    can('read', ['Client', 'Assessment', 'Programme', 'Referral', 'Document']);
    can(['create', 'update'], ['Client', 'Assessment', 'Referral', 'Document']);
    
    // Basic dashboard access
    can('access', 'Dashboard');
    
    // Dashboard widgets
    can('view', ['ClientSummaryWidget', 'RecentActivityWidget']);
  }

  // ReadOnlyUser - comprehensive read access
  if (hasRole('ReadOnlyUser')) {
    can('read', ['Client', 'Assessment', 'Programme', 'Referral', 'Staff', 'ExternalOrg', 'Document']);
    can('view', ['Analytics', 'ClientAnalytics', 'ProgramAnalytics']);
    can('view', ['Report', 'ClientReport', 'ProgramReport']);
    can('access', ['Dashboard', 'ClientDashboard', 'ProgramDashboard']);
  }

  // RestrictedUser - minimal access
  if (hasRole('RestrictedUser')) {
    can('read', 'Client');
    can('access', 'Dashboard');
  }

  return build();
}