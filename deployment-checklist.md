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
```

### Post-Deployment Commands:
```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

## Critical Checks:

1. ✅ **Auth Bypass OFF**: Ensure `NEXT_PUBLIC_AUTH_BYPASS_MODE=false`
2. ✅ **API URL Set**: Frontend must have `NEXT_PUBLIC_PROD_API_BASE_URL`
3. ✅ **Database Migrations**: Run migrations after deployment
4. ✅ **CORS Origins**: Backend allows frontend URL
5. ✅ **HTTPS Only**: Both apps should force HTTPS
6. ✅ **Secrets Secure**: Generate new secrets for production

## Post-Deployment Verification:

1. Test login flow with Azure AD
2. Create a test client
3. Check API endpoints are accessible
4. Verify error boundaries work
5. Check browser console for errors

## Common Issues:

- **404 on API calls**: Check `NEXT_PUBLIC_PROD_API_BASE_URL`
- **CORS errors**: Verify `CORS_ALLOWED_ORIGINS` matches frontend URL
- **Auth failures**: Check Azure AD configuration matches
- **500 errors**: Check Django logs, ensure migrations ran