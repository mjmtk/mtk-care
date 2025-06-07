# Azure AD Role Integration

This document outlines the implementation details of Azure AD role-based access control (RBAC) in the MTK Care application.

## Overview

The application uses Azure AD for authentication and authorization, mapping Azure AD security groups to application roles. This allows for centralized user and permission management through Azure AD.

## Role Structure

### Application Roles

The system defines the following roles with their respective permission levels (lower number = higher privilege):

| Role Name | Level | Description |
|-----------|-------|-------------|
| Admin | 1 | Full system access |
| Manager | 2 | Department-level management |
| Provider | 3 | Healthcare providers with patient access |
| Staff | 4 | General staff with limited access |

### Role Mapping

Azure AD security groups are mapped to application roles in the `GroupRoleMapping` model. The mapping is configured in the database and can be managed through the Django admin interface.

## Authentication Flow

1. **Token Acquisition**:
   - Frontend acquires an ID token and access token from Azure AD
   - Tokens are sent to the backend with each API request in the `Authorization` header

2. **Token Validation**:
   - Backend validates the JWT signature using Azure AD's public keys
   - Token claims are verified (issuer, audience, expiration)

3. **User Provisioning**:
   - If the user doesn't exist, a new user is created
   - User attributes (name, email) are synchronized from Azure AD

4. **Role Assignment**:
   - Azure AD groups from the token are extracted
   - Groups are mapped to application roles
   - The highest-privilege role is assigned to the user

## API Response

The user profile endpoint (`/api/profile`) returns role information in the following format:

```json
{
  "id": 3,
  "username": "user@example.com",
  "email": "user@example.com",
  "first_name": "First",
  "last_name": "Last",
  "roles": ["Provider"],
  "role_details": [
    {
      "id": "role-uuid",
      "name": "Provider",
      "description": "Role description",
      "level": 3,
      "permissions": []
    }
  ],
  "highest_role": {
    "id": "role-uuid",
    "name": "Provider",
    "level": 3
  },
  "permissions": [],
  "is_staff": false,
  "is_superuser": false,
  "date_joined": "2025-06-03T07:19:55.525Z",
  "last_login": null
}
```

## Azure AD Configuration

### Required App Registrations

1. **Frontend Application**:
   - Platform: Single-page application (SPA)
   - Redirect URIs: Your application's callback URLs
   - Implicit grant: ID tokens and access tokens
   - API permissions: `User.Read`, `email`, `profile`

2. **Backend Application**:
   - Expose an API with a custom scope (e.g., `access_as_user`)
   - Application ID URI: `api://<backend-client-id>`
   - Token configuration: Add optional claims for `groups` and `roles`

### Required Settings

#### Frontend (`.env.local`)
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-strong-secret>
AZURE_AD_CLIENT_ID=<frontend-client-id>
AZURE_AD_CLIENT_SECRET=<frontend-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>
NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE=api://<backend-client-id>/access_as_user
```

#### Backend (`.env`)
```
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<backend-client-id>
AZURE_CLIENT_SECRET=<backend-client-secret>

# JWT Configuration
JWT_AUTH_ALGORITHM=RS256
JWT_AUTH_AUDIENCE=api://<backend-client-id>
JWT_AUTH_ISSUER=https://login.microsoftonline.com/<tenant-id>/v2.0
JWT_AUTH_JWKS_URI=https://login.microsoftonline.com/<tenant-id>/discovery/v2.0/keys
```

## Troubleshooting

### Common Issues

1. **No Azure AD Groups in Token**
   - Verify the token contains the `groups` claim
   - Check Azure AD app registration settings
   - Ensure the user is assigned to security groups

2. **Role Not Assigned**
   - Verify the group ID in Azure AD matches the `azure_ad_group_id` in `GroupRoleMapping`
   - Check application logs for role mapping errors

3. **Token Validation Failures**
   - Verify the token audience and issuer match your configuration
   - Check token expiration and clock skew settings

## Security Considerations

- Always use HTTPS in production
- Keep client secrets and sensitive configuration in environment variables
- Regularly rotate application secrets
- Monitor and audit role assignments
- Implement proper session management and token expiration

## Related Components

- `apps/authentication/middleware.py`: JWT authentication and role assignment
- `apps/authentication/jwt_auth.py`: JWT validation and user provisioning
- `apps/users/models.py`: Role and GroupRoleMapping models
- `config/urls.py`: API endpoints for user profile and authentication
