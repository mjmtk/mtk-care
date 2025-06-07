# Troubleshooting Guides

This section contains guides and solutions for common or complex issues encountered during the development and deployment of the MTK-Care project.

## Common Issues

### API and Backend Issues
- [Django Ninja Router Registration Issues](./api-issues/router-setup.md) - Resolve `ConfigError: Router ... has already been attached` errors
- [API Redirect Loops (Ninja/Next.js)](./api-issues/redirect-loops.md) - Fix infinite redirects between frontend and API

### Deployment Issues
- [Azure Deployment Issues](./deployment-issues/azure-issues.md) - Common Azure deployment problems and solutions

## Categories

### Development Environment
Issues related to local development setup, environment configuration, and development tools.

### Authentication & Authorization
Problems with Azure AD integration, authentication flows, and permission management.

### API Integration
Issues with Django Ninja API setup, endpoint configuration, and frontend-backend communication.

### Deployment & Infrastructure
Azure deployment problems, environment variables, and production configuration issues.

## Adding New Troubleshooting Guides

When creating new troubleshooting documentation:

1. **Use descriptive titles**: Clearly indicate the problem being solved
2. **Include error messages**: Copy exact error text when possible
3. **Provide step-by-step solutions**: Break down fixes into clear steps
4. **Add context**: Explain when/why the issue occurs
5. **Include prevention**: How to avoid the issue in the future
6. **Update this index**: Add your new guide to the appropriate section above

### Template Structure
```markdown
# Problem: Brief Description

## Symptoms
- What users see/experience

## Root Cause
- Technical explanation

## Solution
1. Step-by-step fix

## Prevention
- How to avoid in future
```
