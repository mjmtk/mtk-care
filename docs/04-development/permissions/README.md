# Permission System Overview

MTK Care uses a sophisticated role-based access control (RBAC) system built on **dynamic roles** and **CASL (Code Access Security Layer)** for granular permissions.

## 🎯 Key Concepts

### **Dynamic Roles**
Roles are stored in the database and fetched via API, not hardcoded in the frontend. This allows for:
- Runtime role management
- Easy addition of new roles without code deployments
- Role customization per organization

### **CASL Permissions**
Fine-grained permission control using subjects and actions:
- **Subjects**: What you're accessing (`Client`, `Dashboard`, `ClientSummaryWidget`)
- **Actions**: What you're doing (`read`, `view`, `access`, `create`, `update`, `delete`)

### **Three-Layer Architecture**
```
┌─────────────────┐
│   UI Components │ ← PermissionGuard, useDashboardWidgets
├─────────────────┤
│ Permission Layer│ ← CASL abilities, usePermissions hook
├─────────────────┤
│   Role Layer    │ ← Dynamic roles from database
└─────────────────┘
```

## 🚀 Quick Start

### **1. Check Basic Permissions**
```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const permissions = usePermissions();
  
  // Check entity access
  if (permissions.canRead('Client')) {
    // Show client data
  }
  
  // Check UI access
  if (permissions.canAccess('AdminDashboard')) {
    // Show admin navigation
  }
  
  // Check analytics
  if (permissions.canViewAnalytics('org')) {
    // Show organization analytics
  }
}
```

### **2. Guard Components with Permissions**
```typescript
import { PermissionGuard, AdminGuard } from '@/components/auth/PermissionGuard';

// CASL-based permission (recommended)
<PermissionGuard action="read" subject="Client">
  <ClientList />
</PermissionGuard>

// Analytics permission
<PermissionGuard check={p => p.canViewAnalytics('program')}>
  <ProgramAnalytics />
</PermissionGuard>

// Admin shortcut
<AdminGuard>
  <AdminPanel />
</AdminGuard>
```

### **3. Role-Based Dashboard Widgets**
```typescript
import { useDashboardWidgets } from '@/hooks/useDashboardWidgets';

function Dashboard() {
  const { getAvailableWidgets } = useDashboardWidgets();
  
  // Automatically filters widgets based on user permissions
  const widgets = getAvailableWidgets();
  
  return (
    <div>
      {widgets.map(widget => (
        <WidgetRenderer key={widget.id} widget={widget} />
      ))}
    </div>
  );
}
```

## 🎭 Available Roles

| Role | Description | Typical Use Case |
|------|-------------|------------------|
| **Superuser** | Full system access + role switching | System administrators |
| **Administrator** | Full operational access | Organization admins |
| **Manager** | Strategic oversight + financial data | Executive leadership |
| **Supervisor** | Team and program management | Department heads |
| **Practitioner** | Client-facing operations | Caseworkers, therapists |
| **Staff** | Basic operational access | Support staff |
| **ReadOnlyUser** | View-only access | Auditors, observers |
| **RestrictedUser** | Minimal access | Limited access users |

## 🔑 Action Semantics

| Action | Use For | Example |
|--------|---------|---------|
| `read` | Database entities | `can('read', 'Client')` |
| `view` | Analytics, reports, widgets | `can('view', 'ClientSummaryWidget')` |
| `access` | Navigation, pages, features | `can('access', 'Dashboard')` |
| `create` | Adding new records | `can('create', 'Referral')` |
| `update` | Editing existing data | `can('update', 'Client')` |
| `delete` | Removing records | `can('delete', 'Programme')` |
| `manage` | Full CRUD access | `can('manage', 'Programme')` |
| `export` | Data export capabilities | `can('export', 'Report')` |

## 📚 Related Documentation

- **[Dynamic Roles](../authentication/dynamic-roles.md)** - Role management system
- **[CASL Integration](./casl-integration.md)** - CASL setup and patterns
- **[Widget System](../dashboard/widget-system.md)** - Dashboard widget permissions
- **[Permission Patterns](./permission-patterns.md)** - Common use cases
- **[Architecture](../../03-architecture/permissions-architecture.md)** - System design

## 🛠️ Development Tools

### **Role Switching**
Superusers and Administrators can switch roles for testing:
```typescript
// Access via role switcher in header
// Or programmatically (development only)
const { switchToRole } = useRoleSwitcher();
switchToRole('Practitioner');
```

### **Auth Bypass Mode**
For local development without Azure AD:
```bash
# Set in .env.local
NEXT_PUBLIC_AUTH_BYPASS=true
NEXT_PUBLIC_AUTH_BYPASS_USER=SuperUser
```

### **Permission Debugging**
```typescript
const permissions = usePermissions();
console.log('Current permissions:', {
  roles: permissions.hasRole,
  canReadClients: permissions.canRead('Client'),
  canAccessAdmin: permissions.canAccess('AdminDashboard'),
});
```

## 🚨 Common Issues

- **404 on permission check**: Ensure you're using the correct subject name
- **Permission denied unexpectedly**: Check role spellings (case-sensitive)
- **Widget not showing**: Verify widget permission in CASL ability definitions
- **Role switching not working**: Ensure user has `impersonate` permission

See **[Troubleshooting](../../06-troubleshooting/permission-issues.md)** for detailed solutions.