# Role-Based Access Control (RBAC) & Role Switching

## Overview

MTK Care implements a comprehensive role-based access control system with the ability for superusers to switch between different role views for testing and development purposes.

## Available Roles

The system supports six primary roles defined in `src/auth/auth-config.ts`:

```typescript
export enum AppRoles {
    Administrator = "Administrator",
    OrganisationExecutive = "Organisation Executive", 
    ProgramManager = "Program Manager",
    Supervisor = "Supervisor",
    Caseworker = "Caseworker",
    PracticeLead = "Practice Lead"
}
```

## Role Switching Feature

### Purpose
- **Development Testing**: Test UI components and features from different role perspectives
- **User Training**: Demonstrate how the application appears to different user types
- **QA/UAT**: Validate role-based access controls without multiple user accounts

### Access Requirements
- User must have `Administrator` or `Superuser` role
- Available in both auth bypass mode and normal authentication mode

### Usage
1. **Visual Indicator**: Role switcher appears in the dashboard header
2. **Current Roles**: Displays current role badges
3. **Switch Options**: 
   - Single role testing
   - Common role combinations
   - Reset to original roles

## Implementation Components

### 1. RoleSwitcherProvider
```typescript
// Wraps application to provide role switching context
<RoleSwitcherProvider>
  {children}
</RoleSwitcherProvider>
```

**Features:**
- Overrides user roles for UI testing
- Persists selection across page reloads
- Triggers re-render of role-dependent components

### 2. RoleSwitcher Component
```typescript
import { RoleSwitcher } from '@/components/auth/RoleSwitcher';

// Added to dashboard header
<RoleSwitcher />
```

**Features:**
- Dropdown with all available roles
- Visual indicators for active overrides
- Pre-defined role combinations
- Reset functionality

### 3. Role Hooks
```typescript
import { useRoles, useHasRole, useHasAnyRole } from '@/hooks/useRoles';

// Get current roles (respects role switcher)
const roles = useRoles();

// Check for specific role
const isAdmin = useHasRole('Administrator');

// Check for any of multiple roles
const isManager = useHasAnyRole(['Program Manager', 'Organisation Executive']);
```

### 4. RoleGuard Component
```typescript
import { RoleGuard } from '@/components/auth/RoleGuard';

// Show only to specific roles
<RoleGuard allowedRoles={['Administrator', 'Supervisor']}>
  <AdminPanel />
</RoleGuard>

// Hide from specific roles
<RoleGuard deniedRoles={['Caseworker']}>
  <ManagementTools />
</RoleGuard>

// Show error message if access denied
<RoleGuard allowedRoles={['Administrator']} showError>
  <SystemSettings />
</RoleGuard>
```

## Development Guidelines

### Using Role-Based Components

#### ✅ DO: Use role hooks for logic
```typescript
function MyComponent() {
  const roles = useRoles();
  const canEdit = useHasAnyRole(['Administrator', 'Supervisor']);
  
  return (
    <div>
      {canEdit && <EditButton />}
    </div>
  );
}
```

#### ✅ DO: Use RoleGuard for UI sections
```typescript
<RoleGuard allowedRoles={['Administrator']}>
  <AdminSection />
</RoleGuard>
```

#### ✅ DO: Provide fallback content
```typescript
<RoleGuard 
  allowedRoles={['Manager']}
  fallback={<div>Contact your manager to access this feature</div>}
>
  <ManagementDashboard />
</RoleGuard>
```

#### ❌ DON'T: Check session roles directly
```typescript
// Bad - doesn't respect role switcher
const { data: session } = useSession();
const isAdmin = session?.user?.roles?.includes('Administrator');

// Good - respects role switcher
const isAdmin = useHasRole('Administrator');
```

### Navigation Items
```typescript
// In sidebar-nav.tsx
const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Administration", 
    icon: Shield,
    requiredRoles: ["Administrator"] // Only show to admins
  }
];
```

### Testing Role-Based Features

1. **Enable Role Switching**: Ensure you have Administrator/Superuser role
2. **Access Role Demo**: Navigate to `/dashboard/role-demo`
3. **Switch Roles**: Use the header role switcher
4. **Verify Behavior**: Check that UI updates appropriately
5. **Test Combinations**: Try multiple role combinations
6. **Reset**: Return to original roles when done

## Role Permissions Matrix

| Feature | Admin | Org Exec | Program Mgr | Supervisor | Caseworker | Practice Lead |
|---------|-------|----------|-------------|------------|------------|---------------|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| System Config | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| All Client Access | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Edit Clients | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Financial Reports | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Team Management | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Case Assignment | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Practice Guidelines | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

## Backend Integration

The role switching is purely frontend-focused for UI testing. Backend API calls still use the original user authentication and roles.

### For Backend Role Checks:
```python
# Django view with role requirements
@auth_required
def admin_view(request):
    user = request.user
    if not user.has_role('Administrator'):
        return HttpResponseForbidden()
    # ... admin logic
```

## Security Considerations

1. **Frontend Only**: Role switching only affects UI display, not backend permissions
2. **Testing Purpose**: Intended for development and testing, not production impersonation
3. **Restricted Access**: Only available to users with administrative privileges
4. **Session Persistence**: Overrides are stored in sessionStorage, not permanently

## Troubleshooting

### Role Switcher Not Visible
- Check that user has `Administrator` or `Superuser` role
- Verify `RoleSwitcherProvider` is in the component tree
- Check browser console for React errors

### Components Not Updating
- Ensure components use `useRoles()` hook instead of direct session access
- Check that `RoleGuard` components have correct role names
- Verify role names match exactly (case-sensitive)

### Navigation Items Not Showing
- Update `navItems` with correct `requiredRoles` array
- Ensure role names in navigation match `AppRoles` enum values

## Future Enhancements

1. **Role Templates**: Pre-defined role combinations for common scenarios
2. **Audit Trail**: Log role switching actions for compliance
3. **Time-based Switching**: Automatic reset after specified time
4. **Advanced Permissions**: Fine-grained permission levels within roles
5. **Export/Import**: Save and share role test scenarios

## Demo Page

Visit `/dashboard/role-demo` to see:
- Current role display
- Role-specific feature demonstrations
- Interactive component examples
- Permissions matrix
- Usage examples

This comprehensive RBAC system with role switching provides powerful testing capabilities while maintaining security and usability.