# Azure Deployment Guide

This guide covers the deployment of the MTK Care application to Azure Web Apps, including both frontend and backend services.

## Architecture Overview

The application is deployed as two separate Azure Web Apps:
- **Frontend**: Next.js application deployed to `mtk-care` Web App
- **Backend**: Django application deployed to `mtkcare-backend` Web App

## Required Environment Variables

### Frontend (mtk-care)

The following environment variables MUST be configured in the Azure Web App configuration:

```bash
# API Configuration
NEXT_PUBLIC_PROD_API_BASE_URL=https://mtkcare-backend.azurewebsites.net

# Azure AD Configuration
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret
AZURE_AD_TENANT_ID=your-tenant-id
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_AD_TENANT_ID=your-tenant-id
NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE=api://your-api-scope/.default
NEXT_PUBLIC_AZURE_POST_LOGOUT_REDIRECT_URI=https://mtk-care-augcghgedhfzhqbz.newzealandnorth-01.azurewebsites.net

# NextAuth Configuration
NEXTAUTH_URL=https://mtk-care-augcghgedhfzhqbz.newzealandnorth-01.azurewebsites.net
NEXTAUTH_SECRET=your-nextauth-secret

# Node Environment
NODE_ENV=production

# SharePoint Configuration
NEXT_PUBLIC_SHAREPOINT_DOMAIN=https://yourdomain.sharepoint.com
```

### Backend (mtkcare-backend)

```bash
# Django Configuration
DJANGO_SECRET_KEY=your-django-secret-key
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=mtkcare-backend.azurewebsites.net

# Database Configuration
DB_CONNECTION_TYPE=azure
POSTGRES_DB=your-db-name
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-db-password
POSTGRES_HOST=your-db-host.postgres.database.azure.com
POSTGRES_PORT=5432

# CORS Configuration
CORS_ALLOWED_ORIGINS=https://mtk-care-augcghgedhfzhqbz.newzealandnorth-01.azurewebsites.net

# Azure AD Configuration
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_TENANT_ID=your-tenant-id
```

## Setting Environment Variables in Azure

1. Navigate to your Azure Web App in the Azure Portal
2. Go to **Configuration** under Settings
3. Click on **New application setting** for each environment variable
4. Add the variable name and value
5. Click **Save** and **Continue** to restart the app

## Common Issues and Solutions

### Issue: "PRODUCTION API URL NOT SET"

**Error**: `PRODUCTION API URL NOT SET: NEXT_PUBLIC_PROD_API_BASE_URL is not defined`

**Solution**: Ensure `NEXT_PUBLIC_PROD_API_BASE_URL` is set in the frontend Web App configuration pointing to your backend URL.

### Issue: 404 Errors on API Calls

**Error**: `GET https://frontend-url/api/v1/users/me 404 (Not Found)`

**Causes**:
1. Missing `NEXT_PUBLIC_PROD_API_BASE_URL` environment variable
2. Incorrect backend URL in the environment variable
3. Backend service is not running or accessible

**Solution**: Verify the backend is accessible at the configured URL and the environment variable is set correctly.

## Deployment Workflows

The application uses GitHub Actions for CI/CD:

- **Frontend**: `.github/workflows/main_mtk-care.yml`
  - Triggers on push to main branch
  - Builds Next.js application
  - Deploys to `mtk-care` Web App

- **Backend**: `.github/workflows/backend-ci-cd.yml`
  - Triggers on push to main branch when backend files change
  - Builds Django application
  - Deploys to `mtkcare-backend` Web App

## Verification Steps

After deployment, verify the application is working:

1. Check the health endpoint: `https://mtk-care-augcghgedhfzhqbz.newzealandnorth-01.azurewebsites.net/api/health`
2. Check the backend is accessible: `https://mtkcare-backend.azurewebsites.net/api/health` (if you have a health endpoint)
3. Check browser console for any errors
4. Verify all environment variables are set in both Web Apps

## Important Notes

- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- The frontend uses these variables at build time, so the app needs to be redeployed after changing them
- Keep sensitive values (like secrets) in non-public environment variables
- Always use HTTPS URLs in production environment variables