# Authentication and Authorization Customization

## Custom Role-Based Access Control (RBAC)

### Overview
This document outlines the custom authentication and authorization setup for the MTK Care application, which uses Azure AD for authentication and a custom RBAC system for authorization.

### Key Components

1. **Custom Role Model**
   - Located in `backend/apps/users/models.py`
   - Extends Django's built-in permissions system
   - Includes hierarchical levels (1-4) for role-based access control
   - Integrated with Azure AD groups through `GroupRoleMapping`

2. **Default Roles**
   - **Admin (Level 1)**: Full system access
   - **Manager (Level 2)**: Department management
   - **Provider (Level 3)**: Patient care and records
   - **Staff (Level 4)**: Basic access

3. **Azure AD Integration**
   - Uses NextAuth.js for frontend authentication
   - Maps Azure AD groups to application roles
   - JWT validation with custom claims

### Customizations

#### 1. Disabled Django's Built-in Groups
- **File**: `backend/apps/users/admin.py`
- **Reason**: We're using a custom `Role` model instead of Django's built-in `Group` model for more flexibility and Azure AD integration.
- **Implementation**: The built-in Group model is unregistered from the admin interface.

#### 2. JWT Authentication
- **File**: `backend/apps/authentication/jwt_auth.py`
- **Customizations**:
  - Custom token validation
  - Azure AD integration
  - Debug logging (disabled in production)

### Best Practices

1. **Adding New Roles**
   - Always assign a level (1-4) when creating new roles
   - Update this documentation when adding new roles
   - Consider the permission hierarchy when assigning levels

2. **Azure AD Group Mapping**
   - Map Azure AD groups to roles in the admin interface
   - Keep group names consistent with role names where possible

3. **Testing**
   - Test role-based access after making changes
   - Verify Azure AD group mappings regularly

### Troubleshooting

#### Missing Roles in Admin
- Ensure the `Role` model is properly registered in `admin.py`
- Check for any migration issues

#### Permission Issues
- Verify the user's role and level
- Check Azure AD group memberships
- Review the `GroupRoleMapping` in the admin interface
