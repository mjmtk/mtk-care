# Role Mappings Management

This document covers the comprehensive role mappings management system for MTK Care, including Entra ID integration, deployment automation, and health validation.

## Overview

The role mappings system ensures that Azure AD (Entra ID) groups are properly mapped to application roles, preventing production lockouts and maintaining security. The system includes automated fetching of current groups, validation, and deployment integration.

## System Components

### 1. Entra ID Group Fetcher
**Location:** `scripts/fetch_entra_groups.py`

Automatically fetches all groups starting with "MC_" from Entra ID and maps them to application roles.

#### Features:
- Connects to Microsoft Graph API
- Filters groups by "MC_" prefix
- Intelligent role mapping based on group names
- JSON output for automation
- Dry-run support

#### Usage:
```bash
# Fetch groups and save to file
python scripts/fetch_entra_groups.py --output role_mappings.json

# Dry run to see what would be fetched
python scripts/fetch_entra_groups.py --dry-run

# Custom credentials
python scripts/fetch_entra_groups.py \
  --tenant-id YOUR_TENANT_ID \
  --client-id YOUR_CLIENT_ID \
  --client-secret YOUR_SECRET \
  --output mappings.json
```

#### Group Naming Conventions:
- `MC_Administrators` → `Administrator` role
- `MC_Managers` → `Manager` role
- `MC_Program_Managers` → `Program Manager` role
- `MC_Supervisors` → `Supervisor` role
- `MC_Team_Leads` → `Team Lead` role
- `MC_Practitioners` → `Practitioner` role
- `MC_Volunteers` → `Volunteer` role

Groups not matching patterns default to `Practitioner` role.

### 2. Enhanced Role Mappings Setup
**Location:** `backend/apps/users/management/commands/setup_role_mappings.py`

Django management command for setting up role mappings with support for both dynamic and static configurations.

#### Usage:
```bash
# Use fetched groups from Entra ID
python manage.py setup_role_mappings --mappings-file role_mappings.json

# Preview changes without applying
python manage.py setup_role_mappings --mappings-file role_mappings.json --dry-run

# Force overwrite existing mappings
python manage.py setup_role_mappings --mappings-file role_mappings.json --force

# Use hardcoded default mappings
python manage.py setup_role_mappings --use-defaults
```

### 3. Health Check Validator
**Location:** `backend/apps/users/management/commands/validate_role_mappings.py`

Comprehensive validation system to ensure role mappings are healthy and deployment-ready.

#### Validation Checks:
- **Required Roles Exist**: Verifies all application roles are created
- **Role Mappings Exist**: Ensures at least one mapping is configured
- **No Orphaned Mappings**: Checks for mappings to deleted roles
- **No Duplicate Mappings**: Warns about groups mapped to multiple roles
- **Admin Access Available**: Ensures administrator access is configured
- **Azure Groups Validation**: Verifies mapped groups still exist in Entra ID

#### Usage:
```bash
# Basic validation
python manage.py validate_role_mappings

# Include Azure AD verification
python manage.py validate_role_mappings --check-azure

# JSON output for CI/CD
python manage.py validate_role_mappings --output-format json

# Fail on warnings (strict mode)
python manage.py validate_role_mappings --fail-on-warnings
```

#### Sample Output:
```
================================================================================
ROLE MAPPINGS HEALTH CHECK - PASS
================================================================================
✓ Required Roles Exist: All 8 required roles exist
✓ Role Mappings Exist: 4 role mappings configured
✓ No Orphaned Mappings: All mappings have valid roles
✓ No Duplicate Mappings: No duplicate group mappings found
✓ Admin Access Available: 2 groups have administrator access
✓ Azure Groups Validation: All 4 mapped groups exist in Azure AD

--------------------------------------------------------------------------------
SUMMARY:
  Total checks: 6
  Passed: 6
  Failed: 0
  Warnings: 0
  Errors: 0
```

### 4. Deployment Script
**Location:** `scripts/deploy_with_role_mappings.sh`

Comprehensive deployment script that handles role mappings as part of the deployment process.

#### Features:
- Automatic Entra ID group fetching
- Pre-deployment validation
- Health checks and rollback
- Multiple execution modes
- Comprehensive logging

#### Usage:
```bash
# Full deployment
./scripts/deploy_with_role_mappings.sh deploy

# Only fetch role mappings
./scripts/deploy_with_role_mappings.sh fetch-only

# Only validate current state
./scripts/deploy_with_role_mappings.sh validate-only

# Help
./scripts/deploy_with_role_mappings.sh help
```

## Environment Setup

### Required Environment Variables:
```bash
# Azure AD Authentication
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret

# Django Configuration
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url

# Optional
DEPLOYMENT_ENV=production  # or 'development' to skip static collection
```

### Azure AD App Registration Requirements:
The Azure AD application needs the following Microsoft Graph permissions:
- `Group.Read.All` (Application permission)
- `Directory.Read.All` (Application permission)

## CI/CD Integration

### GitHub Actions Workflow
**Location:** `.github/workflows/deploy-with-role-mappings.yml`

Automated deployment pipeline with role mappings integration.

#### Workflow Steps:
1. **Fetch Role Mappings**: Get current MC_ groups from Entra ID
2. **Validate Mappings**: Run health checks and validation
3. **Deploy Staging**: Deploy to staging environment
4. **Deploy Production**: Deploy to production (manual trigger)
5. **Post-deployment Validation**: Final health checks

#### Triggering Deployments:
```bash
# Automatic deployment to staging (on main branch push)
git push origin main

# Manual deployment to production
# Use GitHub Actions UI to trigger workflow with 'production' environment
```

### Pre-commit Hooks
**Location:** `scripts/pre-commit-role-check.sh`

Optional pre-commit hook to validate role mappings before committing changes.

#### Installation:
```bash
# Install the hook
ln -s ../../scripts/pre-commit-role-check.sh .git/hooks/pre-commit

# Test the hook
FORCE_ROLE_CHECK=true git commit -m "test commit"
```

## Security Considerations

### Production Lockout Prevention:
- Always validates that at least one group maps to Administrator role
- Ensures required roles exist before creating mappings
- Provides rollback capabilities on failure
- Validates against live Entra ID groups

### Access Control:
- Uses service principal for automated access (no user credentials)
- Minimal required permissions (read-only for groups)
- Supports different credentials per environment
- Audit logging of all changes

## Troubleshooting

### Common Issues:

#### 1. "No role mappings found"
```bash
# Check if roles exist
python manage.py seed_roles

# Check current mappings
python manage.py list_role_mappings

# Setup default mappings
python manage.py setup_role_mappings --use-defaults
```

#### 2. "Groups not found in Azure AD"
```bash
# Verify group names and IDs
python scripts/fetch_entra_groups.py --dry-run

# Check Azure AD permissions
az ad app permission list --id YOUR_CLIENT_ID
```

#### 3. "Authentication failed"
```bash
# Verify environment variables
env | grep AZURE_

# Test authentication
python scripts/fetch_entra_groups.py --dry-run
```

#### 4. "Role does not exist"
```bash
# Seed all required roles
python manage.py seed_roles

# Check existing roles
python manage.py shell -c "from apps.users.models import Role; print(list(Role.objects.values_list('name', flat=True)))"
```

### Validation Commands:
```bash
# Full health check
python manage.py validate_role_mappings --check-azure

# Check Azure connectivity
python scripts/fetch_entra_groups.py --dry-run

# Verify deployment readiness
./scripts/deploy_with_role_mappings.sh validate-only
```

## Migration Guide

### From Hardcoded Mappings:
1. Export current mappings: `python manage.py list_role_mappings`
2. Fetch live groups: `python scripts/fetch_entra_groups.py --output current.json`
3. Validate new mappings: `python manage.py setup_role_mappings --mappings-file current.json --dry-run`
4. Apply new mappings: `python manage.py setup_role_mappings --mappings-file current.json --force`

### Environment Migration:
1. Set up new environment variables
2. Run validation: `python manage.py validate_role_mappings`
3. Update CI/CD secrets
4. Test deployment: `./scripts/deploy_with_role_mappings.sh deploy`

## Best Practices

1. **Always run dry-run first** before applying role mappings
2. **Use validation commands** before deployments
3. **Keep group naming consistent** with MC_ prefix
4. **Monitor health checks** in production
5. **Document custom role mappings** for your organization
6. **Test authentication** after role mapping changes
7. **Use CI/CD pipeline** for consistent deployments
8. **Backup current mappings** before major changes

## Related Documentation

- [Authentication Overview](./overview.md)
- [Dynamic Roles](./dynamic-roles.md)
- [Azure AD Role Integration](./azure-ad-role-integration.md)
- [Backend Implementation](./backend-implementation.md)
- [Deployment Guide](../../05-deployment/azure-deployment-guide.md)