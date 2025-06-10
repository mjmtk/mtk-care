# Permissions Architecture

MTK Care implements a sophisticated **Role-Based Access Control (RBAC)** system with **attribute-based permissions** using CASL (Code Access Security Layer) for fine-grained access control.

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MTK Care RBAC System                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐ │
│  │  Frontend   │    │   Backend    │    │      Database       │ │
│  │             │    │              │    │                     │ │
│  │ ┌─────────┐ │    │ ┌──────────┐ │    │ ┌─────────────────┐ │ │
│  │ │  CASL   │ │    │ │ Django   │ │    │ │ users_role      │ │ │
│  │ │Abilities│ │◄───┤ │ Perms    │ │◄───┤ │                 │ │ │
│  │ └─────────┘ │    │ └──────────┘ │    │ │ - name          │ │ │
│  │             │    │              │    │ │ - level         │ │ │
│  │ ┌─────────┐ │    │ ┌──────────┐ │    │ │ - permissions   │ │ │
│  │ │ Widget  │ │    │ │   Role   │ │    │ └─────────────────┘ │ │
│  │ │ Perms   │ │    │ │  Model   │ │    │                     │ │
│  │ └─────────┘ │    │ └──────────┘ │    │ ┌─────────────────┐ │ │
│  │             │    │              │    │ │ auth_permission │ │ │
│  │ ┌─────────┐ │    │ ┌──────────┐ │    │ │                 │ │ │
│  │ │  Role   │ │    │ │ API      │ │    │ │ - content_type  │ │ │
│  │ │Provider │ │◄───┤ │ v1/roles │ │    │ │ - codename      │ │ │
│  │ └─────────┘ │    │ └──────────┘ │    │ └─────────────────┘ │ │
│  └─────────────┘    └──────────────┘    └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Design Principles

### **1. Separation of Concerns**
- **Roles**: Who the user is (`Administrator`, `Practitioner`)  
- **Permissions**: What they can do (`read Client`, `view Analytics`)
- **Context**: Where/when they can do it (`own clients`, `assigned programs`)

### **2. Principle of Least Privilege**
- Users get minimum permissions needed for their role
- Explicit allow rather than implicit access
- Easy to audit and review permissions

### **3. Scalability & Maintainability**
- Database-driven roles (no hardcoded permissions)
- CASL provides readable permission logic
- Widget system scales automatically with permissions

### **4. Development Friendly**
- Role switching for testing
- Clear debugging tools
- Comprehensive documentation

## 🏛️ Three-Layer Architecture

### **Layer 1: Role Management**
```
Database Roles → API → Frontend Role Provider → Components
```

**Responsibilities:**
- Store and manage roles in database
- Fetch roles dynamically via API
- Provide role context to components
- Handle role switching for development

**Key Components:**
- `backend/apps/users/models.py` - Role model
- `src/contexts/DynamicRoleProvider.tsx` - Role fetching
- `src/hooks/useRoles.ts` - Role access

### **Layer 2: Permission Engine (CASL)**
```
User Roles → CASL Abilities → Permission Checks → UI Components
```

**Responsibilities:**
- Transform roles into granular permissions
- Provide declarative permission checking
- Support context-aware permissions
- Enable complex permission logic

**Key Components:**
- `src/auth/ability.ts` - Permission definitions
- `src/hooks/usePermissions.ts` - Permission access
- `src/components/auth/PermissionGuard.tsx` - UI guards

### **Layer 3: Application Logic**
```
Permissions → Feature Guards → Widget System → Dashboard
```

**Responsibilities:**
- Apply permissions to specific features
- Control UI visibility and behavior
- Manage role-based dashboard widgets
- Provide user experience consistency

**Key Components:**
- `src/hooks/useDashboardWidgets.ts` - Widget filtering
- `src/components/dashboard/DashboardLayout.tsx` - Layout engine
- Feature-specific permission guards

## 🔑 Permission Model

### **Subjects (What)**
Subjects represent the "things" users can interact with:

```typescript
type Subjects = 
  // Core Data Entities
  | 'Client' | 'Assessment' | 'Programme' | 'Referral' | 'Staff' | 'User'
  
  // Analytics & Reports  
  | 'Analytics' | 'ClientAnalytics' | 'ProgramAnalytics' | 'OrgAnalytics'
  | 'Report' | 'ClientReport' | 'ProgramReport' | 'FinancialReport'
  
  // UI Navigation
  | 'Dashboard' | 'ClientDashboard' | 'ProgramDashboard' | 'AdminDashboard'
  
  // Dashboard Widgets
  | 'ClientSummaryWidget' | 'ReferralStatsWidget' | 'ProgramMetricsWidget'
  
  // System Administration
  | 'SystemConfig' | 'UserManagement' | 'RoleManagement' | 'AuditLog';
```

### **Actions (How)**
Actions represent what users can do with subjects:

```typescript
type Actions = 
  | 'manage'    // Full CRUD access
  | 'create'    // Add new records
  | 'read'      // View/list records  
  | 'update'    // Edit existing records
  | 'delete'    // Remove records
  | 'access'    // Navigate to/use feature
  | 'view'      // View analytics/reports/widgets
  | 'export'    // Export data
  | 'impersonate'; // Role switching
```

### **Context (When/Where)**
Context provides conditional permissions:

```typescript
// Program-specific permissions
can('update', 'Programme', { id: { $in: user.programIds } });

// Practice-specific permissions  
can('update', 'Staff', { practiceId: user.practiceId });

// Time-based permissions (future)
can('view', 'Report', { createdAfter: user.startDate });
```

## 👥 Role Hierarchy

```
Level 0: Superuser      ████████████████ (Full System Access)
Level 1: Administrator  ███████████████  (Full Operational)  
Level 2: Manager        ██████████       (Strategic Oversight)
Level 3: Supervisor     ████████         (Team Management)
Level 4: Practitioner   ██████           (Client Operations)
Level 5: Staff          ████             (Basic Operations)
Level 6: ReadOnlyUser   ██               (View Only)
Level 7: RestrictedUser █                (Minimal Access)
```

### **Permission Inheritance**
- Higher-level roles inherit lower-level permissions
- Level-based privilege escalation prevention
- System roles cannot be deleted

### **Role Assignment Rules**
- Users can have multiple roles
- Effective permissions = union of all role permissions
- Role switching available to Superuser/Administrator

## 🎛️ Permission Patterns

### **Entity-Based Permissions**
```typescript
// Reading data entities
can('read', 'Client')     // Can view client records
can('read', 'Referral')   // Can view referral data
can('create', 'Assessment') // Can add assessments

// Managing entities
can('manage', 'Programme') // Full CRUD on programs
```

### **Analytics Permissions**
```typescript
// Viewing processed data  
can('view', 'ClientAnalytics')    // Client-level analytics
can('view', 'ProgramAnalytics')   // Program-level analytics
can('view', 'OrgAnalytics')       // Organization-wide analytics

// Exporting reports
can('export', 'FinancialReport')  // Export financial data
```

### **UI Navigation Permissions**
```typescript
// Page access
can('access', 'Dashboard')        // Can visit dashboard
can('access', 'AdminDashboard')   // Can visit admin section
can('access', 'UserManagement')   // Can access user admin

// Feature access
can('impersonate', 'User')        // Can switch roles
can('access', 'SystemConfig')     // Can access settings
```

### **Widget Display Permissions**
```typescript
// Dashboard widgets
can('view', 'ClientSummaryWidget')     // Client metrics widget
can('view', 'FinancialSummaryWidget')  // Financial widget
can('view', 'TeamPerformanceWidget')   // Team metrics widget
```

## 🔒 Security Model

### **Frontend Security**
- **Advisory Only**: Frontend permissions are for UX, not security
- **Fail Safe**: Components hide by default if permission unclear
- **Re-validation**: Critical actions re-checked on backend

### **Backend Security**
- **Authoritative**: All permissions enforced on backend
- **API Protection**: Every endpoint validates permissions
- **Data Filtering**: Queries automatically filtered by permissions

### **Multi-Layered Validation**
```
User Request
     ↓
Frontend Permission Check (UX)
     ↓  
API Request with Token
     ↓
Backend Permission Validation (Security)
     ↓
Database Query with Filters
     ↓
Response (Filtered Data)
```

## 📊 Performance Considerations

### **Permission Caching**
- Roles cached in browser session
- CASL abilities computed once per role change
- Widget permissions pre-calculated

### **Lazy Loading**
- Widgets load only when visible
- Permission checks deferred until needed
- Dashboard components render progressively

### **Optimized Queries**
- Database roles fetched with single query
- Permission checks use indexed fields
- Bulk permission validation where possible

## 🔄 Evolution Strategy

### **Phase 1: Foundation** ✅ Complete
- Basic RBAC with dynamic roles
- CASL integration
- Core permission patterns

### **Phase 2: Advanced Features** ✅ Complete  
- Widget permission system
- Dashboard customization
- Role switching tools

### **Phase 3: Management Interface** 🚧 Next
- Web-based role management
- Permission assignment UI
- Audit and compliance tools

### **Phase 4: Advanced RBAC** 🔮 Future
- Attribute-based access control (ABAC)
- Time-based permissions
- Organizational hierarchies
- Fine-grained data filtering

## 🎯 Benefits Achieved

### **For Developers**
- **Clear Permission Logic**: Easy to understand and maintain
- **Type Safety**: TypeScript ensures correct permission usage
- **Debugging Tools**: Role switching and permission debugging
- **Scalable Architecture**: Easy to add new permissions/widgets

### **For Organizations**
- **Flexible Role Management**: Customize roles per organization
- **Compliance Ready**: Audit trails and permission tracking
- **Secure by Default**: Principle of least privilege enforced
- **User Experience**: Role-appropriate interfaces

### **For Users**
- **Relevant Dashboards**: See only what matters to their role
- **Intuitive Navigation**: Clear access patterns
- **Consistent Experience**: Predictable permission behavior
- **No Feature Confusion**: Hidden features they can't use

## 📚 Related Documentation

- **[Permission System Overview](../04-development/permissions/README.md)**
- **[Dynamic Roles](../04-development/authentication/dynamic-roles.md)**
- **[CASL Integration](../04-development/permissions/casl-integration.md)**
- **[Widget System](../04-development/dashboard/widget-system.md)**
- **[Role Management](../04-development/backend/role-management.md)**