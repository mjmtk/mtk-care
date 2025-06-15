# 🚀 MTK Care Deployment Checklist

## Frontend (mtk-care)

### Required Environment Variables:
```bash
NEXT_PUBLIC_PROD_API_BASE_URL=https://mtkcare-backend.azurewebsites.net
NEXTAUTH_SECRET=<generate-secure-secret>
NEXTAUTH_URL=https://mtk-care.azurewebsites.net
NEXT_PUBLIC_AUTH_BYPASS_MODE=false
AZURE_AD_CLIENT_ID=<your-client-id>
AZURE_AD_CLIENT_SECRET=<your-client-secret>
AZURE_AD_TENANT_ID=<your-tenant-id>
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=<your-client-id>
NEXT_PUBLIC_AZURE_AD_TENANT_ID=<your-tenant-id>
```

### Build Command:
```bash
npm run build
```

### Start Command:
```bash
npm start
```

## Backend (mtkcare-backend)

### Required Environment Variables:
```bash
DJANGO_SECRET_KEY=<your-secret-key>
DJANGO_ALLOWED_HOSTS=mtkcare-backend.azurewebsites.net
DJANGO_CSRF_TRUSTED_ORIGINS=https://mtk-care.azurewebsites.net
DATABASE_URL=<postgres-connection-string>
CORS_ALLOWED_ORIGINS=https://mtk-care.azurewebsites.net
DJANGO_SETTINGS_MODULE=config.settings.production
AUTH_BYPASS_MODE=false
# Role Mappings Configuration
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<your-client-id>
AZURE_CLIENT_SECRET=<your-client-secret>
```

### Post-Deployment Commands:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
# Role mappings setup
python manage.py seed_roles
python manage.py setup_role_mappings --dry-run  # Preview first
python manage.py setup_role_mappings           # Apply mappings
python manage.py validate_role_mappings --check-azure
```

### Automated Deployment (Recommended):
```bash
# Use the automated deployment script
./scripts/deploy_with_role_mappings.sh deploy
```

## Critical Checks:

1. ✅ **Auth Bypass OFF**: Ensure `NEXT_PUBLIC_AUTH_BYPASS_MODE=false` and `AUTH_BYPASS_MODE=false`
2. ✅ **API URL Set**: Frontend must have `NEXT_PUBLIC_PROD_API_BASE_URL`
3. ✅ **Database Migrations**: Run migrations after deployment
4. ✅ **Role Mappings**: Setup and validate role mappings with Azure AD groups
5. ✅ **Admin Access**: Ensure at least one group maps to Administrator role
6. ✅ **CORS Origins**: Backend allows frontend URL
7. ✅ **HTTPS Only**: Both apps should force HTTPS
8. ✅ **Secrets Secure**: Generate new secrets for production
9. ✅ **Azure AD Permissions**: Ensure app has Group.Read.All permissions

## Post-Deployment Verification:

1. Test login flow with Azure AD
2. Verify role mappings health: `python manage.py validate_role_mappings --check-azure`
3. Test user role assignment with different Azure AD groups
4. Create a test client
5. Check API endpoints are accessible
6. Verify error boundaries work
7. Check browser console for errors
8. Test role-based access control functionality

## Common Issues:

- **404 on API calls**: Check `NEXT_PUBLIC_PROD_API_BASE_URL`
- **CORS errors**: Verify `CORS_ALLOWED_ORIGINS` matches frontend URL
- **Auth failures**: Check Azure AD configuration matches
- **Role mapping failures**: Run `python manage.py validate_role_mappings` for details
- **No administrator access**: Ensure MC_Administrators group exists and is mapped
- **Group not found errors**: Verify MC_ groups exist in Azure AD
- **500 errors**: Check Django logs, ensure migrations ran

## Automated Deployment:

For a fully automated deployment with role mappings:
```bash
# Set environment variables
export AZURE_TENANT_ID=your-tenant-id
export AZURE_CLIENT_ID=your-client-id  
export AZURE_CLIENT_SECRET=your-client-secret

# Run automated deployment
./scripts/deploy_with_role_mappings.sh deploy
```

## Documentation:

- [Role Mappings Management](docs/04-development/authentication/role-mappings-management.md)
- [Role Mappings Deployment](docs/05-deployment/role-mappings-deployment.md)
- [Azure Deployment Guide](docs/05-deployment/azure-deployment-guide.md)