# Role Mappings Deployment Guide

This guide covers deploying MTK Care with automated role mappings management, ensuring secure and reliable deployments without production lockouts.

## Deployment Overview

The role mappings deployment system automatically:
1. Fetches current Entra ID groups (MC_ prefix)
2. Maps groups to application roles
3. Validates deployment readiness
4. Applies role mappings safely
5. Performs post-deployment health checks

## Quick Start

### Prerequisites
Ensure these environment variables are set:
```bash
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id  
AZURE_CLIENT_SECRET=your-client-secret
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=your-database-url
```

### One-Command Deployment
```bash
./scripts/deploy_with_role_mappings.sh deploy
```

This single command handles the entire deployment process including role mappings.

## Deployment Methods

### 1. Automated CI/CD Deployment (Recommended)

#### GitHub Actions Setup:
The workflow file `.github/workflows/deploy-with-role-mappings.yml` is already configured.

**Required Secrets in GitHub:**
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `DJANGO_SECRET_KEY`
- `DATABASE_URL`

**Triggering Deployments:**
```bash
# Automatic staging deployment
git push origin main

# Manual production deployment
# Use GitHub Actions UI → "Deploy with Role Mappings" → Select "production"
```

**Workflow Steps:**
1. Fetch current MC_ groups from Entra ID
2. Validate role mappings configuration
3. Deploy to staging environment
4. Run health checks
5. Deploy to production (manual approval)
6. Final validation and notification

### 2. Manual Deployment

#### Step-by-Step Process:

**Step 1: Fetch Current Role Mappings**
```bash
# Fetch live groups from Entra ID
python scripts/fetch_entra_groups.py --output role_mappings.json

# Review what was fetched
cat role_mappings.json | python -m json.tool
```

**Step 2: Validate Configuration**
```bash
cd backend

# Ensure database is ready
python manage.py migrate
python manage.py seed_roles

# Validate role mappings
python manage.py setup_role_mappings --mappings-file ../role_mappings.json --dry-run
python manage.py validate_role_mappings --check-azure
```

**Step 3: Deploy Application**
```bash
# Apply role mappings
python manage.py setup_role_mappings --mappings-file ../role_mappings.json --force

# Collect static files (production)
python manage.py collectstatic --noinput --clear

# Final health check
python manage.py validate_role_mappings --fail-on-warnings
```

### 3. Environment-Specific Deployments

#### Development Environment:
```bash
export DEPLOYMENT_ENV=development
./scripts/deploy_with_role_mappings.sh deploy
```

#### Staging Environment:
```bash
export DEPLOYMENT_ENV=staging
./scripts/deploy_with_role_mappings.sh deploy
```

#### Production Environment:
```bash
export DEPLOYMENT_ENV=production
./scripts/deploy_with_role_mappings.sh deploy
```

## Azure App Service Deployment

### Application Settings Configuration:

In your Azure App Service, configure these application settings:

```
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
DJANGO_SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@host:port/db
DEPLOYMENT_ENV=production
AUTH_BYPASS_MODE=false
NEXT_PUBLIC_AUTH_BYPASS_MODE=false
```

### Deployment Script Integration:

**Option 1: Deployment Slots**
```bash
# Deploy to staging slot
az webapp deployment source config-zip \
  --resource-group mtk-care-rg \
  --name mtk-care-backend \
  --slot staging \
  --src deployment.zip

# Run role mappings setup in staging
az webapp ssh --resource-group mtk-care-rg --name mtk-care-backend --slot staging
./scripts/deploy_with_role_mappings.sh deploy

# Swap to production after validation
az webapp deployment slot swap \
  --resource-group mtk-care-rg \
  --name mtk-care-backend \
  --slot staging \
  --target-slot production
```

**Option 2: Direct Deployment**
```bash
# Upload and deploy
az webapp deployment source config-zip \
  --resource-group mtk-care-rg \
  --name mtk-care-backend \
  --src deployment.zip

# SSH into the app service
az webapp ssh --resource-group mtk-care-rg --name mtk-care-backend

# Run deployment script
./scripts/deploy_with_role_mappings.sh deploy
```

## Validation and Health Checks

### Pre-deployment Validation:
```bash
# Check Azure connectivity
python scripts/fetch_entra_groups.py --dry-run

# Validate current state
python manage.py validate_role_mappings --check-azure

# Test database connection
python manage.py check --deploy
```

### Post-deployment Validation:
```bash
# Comprehensive health check
python manage.py validate_role_mappings --check-azure --fail-on-warnings

# List current mappings for audit
python manage.py list_role_mappings

# Test authentication flow
curl -X GET "https://your-app.azurewebsites.net/api/v1/health" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Health Check API Endpoint:
Add this to your Django URLs for external monitoring:
```python
# backend/api/urls.py
path('health/role-mappings/', role_mappings_health_check, name='role_mappings_health'),
```

## Troubleshooting Deployments

### Common Deployment Issues:

#### 1. Azure Authentication Failures:
```bash
# Verify credentials
env | grep AZURE_

# Test Graph API access
curl -X POST "https://login.microsoftonline.com/$AZURE_TENANT_ID/oauth2/v2.0/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=$AZURE_CLIENT_ID" \
  -d "client_secret=$AZURE_CLIENT_SECRET" \
  -d "scope=https://graph.microsoft.com/.default"
```

#### 2. Role Mappings Validation Failures:
```bash
# Check role existence
python manage.py seed_roles

# Validate without Azure check first
python manage.py validate_role_mappings

# Then add Azure validation
python manage.py validate_role_mappings --check-azure
```

#### 3. Group Fetching Failures:
```bash
# Check group permissions
az ad app permission list --id $AZURE_CLIENT_ID

# Verify group names
az ad group list --filter "startswith(displayName,'MC_')" --query "[].{id:id,name:displayName}"
```

#### 4. Database Connection Issues:
```bash
# Test database connectivity
python manage.py check --database default

# Check migration status
python manage.py showmigrations
```

### Recovery Procedures:

#### Emergency Fallback:
```bash
# Use default mappings if Entra ID is unavailable
python manage.py setup_role_mappings --use-defaults --force

# Validate minimal functionality
python manage.py validate_role_mappings
```

#### Rollback Deployment:
```bash
# Restore previous role mappings from backup
python manage.py loaddata role_mappings_backup.json

# Validate restored state
python manage.py validate_role_mappings
```

## Monitoring and Alerting

### Health Check Monitoring:
```bash
# Daily health check (add to cron)
0 8 * * * cd /path/to/project && python backend/manage.py validate_role_mappings --output-format json > /var/log/role-health.log
```

### Azure Monitor Integration:
Create custom metrics and alerts based on:
- Role mappings health check results
- Authentication failure rates
- Group membership changes

### Log Monitoring:
Monitor these log patterns:
- `Role mappings validation failed`
- `No administrator access configured`
- `Groups not found in Azure AD`
- `Authentication failed`

## Security Best Practices

### Deployment Security:
1. **Use service principals** (not user accounts) for automation
2. **Rotate secrets regularly** (Azure client secrets)
3. **Validate SSL certificates** in production
4. **Use deployment slots** for zero-downtime deployments
5. **Monitor access patterns** after deployment

### Role Mapping Security:
1. **Always validate admin access** before deployment
2. **Use least privilege** for Azure AD permissions
3. **Audit role changes** regularly
4. **Backup role mappings** before changes
5. **Test emergency procedures** regularly

## Performance Considerations

### Deployment Performance:
- **Cache role mappings** during deployment
- **Use parallel validation** where possible
- **Minimize Azure API calls** with batching
- **Optimize database queries** in validation

### Production Performance:
- **Cache user roles** in application
- **Use database indexes** on role mapping fields
- **Monitor authentication latency**
- **Scale based on user load**

## Disaster Recovery

### Backup Strategy:
```bash
# Backup current role mappings
python manage.py dumpdata users.GroupRoleMapping --output role_mappings_backup.json

# Backup with timestamp
python manage.py dumpdata users.GroupRoleMapping --output "role_mappings_$(date +%Y%m%d_%H%M%S).json"
```

### Recovery Procedures:
```bash
# Restore from backup
python manage.py loaddata role_mappings_backup.json

# Validate restoration
python manage.py validate_role_mappings

# Test authentication
./scripts/test_authentication.sh
```

## Related Documentation

- [Role Mappings Management](../04-development/authentication/role-mappings-management.md)
- [Azure Deployment Guide](./azure-deployment-guide.md)
- [Authentication Overview](../04-development/authentication/overview.md)
- [Post-deployment Tasks](./post-deployment-tasks.md)