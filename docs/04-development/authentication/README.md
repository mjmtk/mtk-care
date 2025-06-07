# Authentication Documentation

This directory contains detailed documentation about authentication and authorization in the MTK-Care application.

## Overview

The MTK-Care application uses Azure Active Directory (Azure AD) for authentication with role-based access control (RBAC). The system supports both production authentication via Azure AD and a development-friendly bypass mode.

## Documentation Files

### [Overview](./overview.md)
High-level authentication and authorization concepts and system architecture.

### [Backend Implementation](./backend-implementation.md)
Django-specific authentication implementation details and JWT handling.

### [Auth Bypass Mode](./auth-bypass-mode.md)
Development authentication bypass configuration for local development.

### [Azure AD Role Integration](./azure-ad-role-integration.md)
Azure AD integration guide with role-based permissions setup.

### [Frontend Session Management](./frontend-session-management.md)
Professional session handling with AuthGuard and SessionManager components.

**Key topics across all files:**
- System authentication architecture
- Backend JWT token validation
- Frontend NextAuth.js integration
- Professional session timeout handling
- Route protection with AuthGuard
- Proactive session warnings
- Azure AD setup and configuration
- Development bypass mode
- Role mapping and permissions

## Related Documentation

- [Azure Deployment Guide](../../05-deployment/azure-deployment-guide.md) - Production auth setup
- [API Design](../../03-architecture/api-design/) - API authentication patterns
- [Frontend Documentation](../frontend/) - Frontend auth integration

## Quick Reference

### Environment Variables
- `AZURE_AD_CLIENT_ID` - Azure AD application client ID
- `AZURE_AD_TENANT_ID` - Azure AD tenant ID
- `AUTH_BYPASS_MODE` - Enable/disable auth bypass (development only)

### Key Concepts
- **JWT Tokens**: Used for stateless authentication
- **Role-Based Access**: Permissions tied to Azure AD groups
- **Session Management**: Professional UI with AuthGuard and SessionManager
- **Route Protection**: Layout-level authentication guards
- **Session Timeouts**: Proactive warnings and graceful handling