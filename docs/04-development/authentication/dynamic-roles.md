# Dynamic Role Management System

MTK Care uses a **database-driven role system** that replaces hardcoded enums with dynamic roles fetched from the API. This enables runtime role management and easier customization.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │    Database     │
│                 │    │                  │    │                 │
│ DynamicRole     │◄───┤ /api/v1/roles/   │◄───┤ users_role      │
│ Provider        │    │                  │    │ table           │
│                 │    │ Django Role      │    │                 │
│ usePermissions  │    │ model            │    │ - name          │
│ hook            │    │                  │    │ - description   │
│                 │    │                  │    │ - level         │
│ CASL abilities  │    │                  │    │ - permissions   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🗃️ Database Schema

### **Role Model** (`backend/apps/users/models.py`)

```python
class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    level = models.IntegerField(unique=True)  # 0=highest, 7=lowest
    is_system_role = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    custom_permissions = models.JSONField(default=dict)
    permissions = models.ManyToManyField('auth.Permission', blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### **Default Roles** (via migration `0006_populate_default_roles.py`)

| Level | Role | Description |
|-------|------|-------------|
| 0 | Superuser | System superuser with full access |
| 1 | Administrator | Full operational access |
| 2 | Manager | Strategic oversight and organization-wide access |
| 3 | Supervisor | Team and program management |
| 4 | Practitioner | Client-facing operations |
| 5 | Staff | Basic operational access |
| 6 | ReadOnlyUser | View-only access to most resources |
| 7 | RestrictedUser | Minimal access to essential features |

## 🔌 Frontend Integration

### **DynamicRoleProvider** (`src/contexts/DynamicRoleProvider.tsx`)

```typescript
// Fetches roles from API and provides to components
const { roles, loading, error, getAvailableRoleNames } = useDynamicRoles();

// Example usage
const roleNames = getAvailableRoleNames(); 
// Returns: ['Superuser', 'Administrator', 'Manager', ...]
```

### **API Integration**

```typescript
// Automatic role fetching
const fetchRoles = async () => {
    const rolesData = await apiRequest<DynamicRole[]>({
        url: 'v1/roles/',
        method: 'GET',
    });
    
    // Filters to active roles only
    const activeRoles = rolesData.filter(role => role.is_active);
    setRoles(activeRoles);
};
```

### **Fallback Strategy**

```typescript
// If API fails, falls back to hardcoded ROLE_NAMES
const fallbackRoles: DynamicRole[] = Object.values(ROLE_NAMES).map((name, index) => ({
    id: `fallback-${index}`,
    name,
    description: `Fallback role: ${name}`,
    level: index,
    is_system_role: true,
    is_active: true,
}));
```

## 🔄 Migration from Hardcoded Enums

### **Phase 1: Dual System** ✅ Complete
- Keep existing `AppRoles` enum as fallback
- Add `DynamicRoleProvider` fetching from API
- Components use dynamic roles when available

### **Phase 2: Database Migration** ✅ Complete
- Create Django `Role` model
- Populate default roles via migration
- Backend APIs serve dynamic roles

### **Phase 3: Remove Hardcoded Enums** ✅ Complete
- Replace `AppRoles` enum with `ROLE_NAMES` constants
- Update all type signatures from `AppRoles[]` to `string[]`
- Remove enum dependencies throughout codebase

### **Phase 4: Admin Interface** 🚧 Pending
- Web UI for role management
- Role creation, editing, deletion
- Permission assignment interface

## 🎮 Role Assignment

### **Backend Assignment**
```python
# Django management command or admin interface
user = User.objects.get(email='user@example.com')
role = Role.objects.get(name='Practitioner')
user.roles.add(role)
```

### **Development Assignment**
```typescript
// auth-service.ts - Development role assignment
if (displayName === "Aftab Jalal") {
    roles.push(ROLE_NAMES.ADMINISTRATOR);
} else if (displayName === "Tashi") {
    roles.push(ROLE_NAMES.MANAGER);
} else if (displayName === "Caleb") {
    roles.push(ROLE_NAMES.PRACTITIONER);
}
```

## 🔧 Development Tools

### **Role Switching**
Superusers can switch roles for testing:

```typescript
const { 
    switchToRole, 
    switchToMultipleRoles, 
    resetToOriginalRoles,
    isRoleSwitching 
} = useRoleSwitcher();

// Switch to single role
switchToRole('Practitioner');

// Switch to multiple roles
switchToMultipleRoles(['Supervisor', 'Practitioner']);

// Reset to original
resetToOriginalRoles();
```

### **Role Demo Page**
Visit `/dashboard/role-demo` to:
- View current roles
- Test role-based UI components
- Switch between different role views
- See permissions matrix

## 🛡️ Security Considerations

### **Role Level Hierarchy**
- Lower numbers = higher privileges (0 = Superuser)
- Used for role comparison and privilege escalation prevention
- Ensures users can't assign roles higher than their own level

### **System Roles**
- `is_system_role: true` - Cannot be deleted via UI
- Protected against accidental removal
- Ensures core system roles always exist

### **Permission Validation**
- Backend validates all role assignments
- Frontend permissions are advisory only
- All sensitive operations re-checked on backend

## 🔍 API Endpoints

### **List Roles**
```http
GET /api/v1/roles/
```
Returns active roles for current user's organization.

### **Role Details**
```http
GET /api/v1/roles/{id}/
```
Returns detailed role information including permissions.

### **User Roles**
```http
GET /api/v1/users/me/roles/
```
Returns current user's assigned roles.

## 🚨 Troubleshooting

### **Roles Not Loading**
```typescript
// Check DynamicRoleProvider state
const { roles, loading, error } = useDynamicRoles();
console.log('Roles state:', { roles, loading, error });
```

### **Permission Denied**
- Verify user has correct roles assigned in database
- Check role names match exactly (case-sensitive)
- Ensure roles are active (`is_active: true`)

### **Role Switching Issues**
- Only Superuser/Administrator can switch roles
- Check `can('impersonate', 'User')` permission
- Verify role switcher is enabled in provider

### **Migration Issues**
```bash
# Re-run role migration if needed
python manage.py migrate users 0006_populate_default_roles --fake
python manage.py migrate users 0006_populate_default_roles
```

## 📚 Related Documentation

- **[Permission System Overview](../permissions/README.md)**
- **[CASL Integration](../permissions/casl-integration.md)**
- **[Role Switching Guide](./role-switching.md)**
- **[Backend Role Management](../backend/role-management.md)**