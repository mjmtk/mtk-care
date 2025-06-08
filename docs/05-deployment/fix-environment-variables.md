# Fix Environment Variables for Azure Deployment

## Problem
Next.js `NEXT_PUBLIC_*` environment variables must be available at **build time**, not just runtime. Azure App Service environment variables are only available at runtime.

## Solution
Add environment variables to the GitHub Actions workflow that builds your application.

## Steps to Fix

### 1. Add GitHub Secrets
Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

- `NEXT_PUBLIC_AZURE_AD_CLIENT_ID` - Your Azure AD application client ID
- `NEXT_PUBLIC_AZURE_AD_TENANT_ID` - Your Azure AD tenant ID

### 2. Update Workflow (Already Done)
The workflow now includes these environment variables during the build step:

```yaml
env:
  NEXT_PUBLIC_PROD_API_BASE_URL: https://mtkcare-backend-abbffge3c9gqcqhr.newzealandnorth-01.azurewebsites.net
  NEXT_PUBLIC_AZURE_AD_CLIENT_ID: ${{ secrets.NEXT_PUBLIC_AZURE_AD_CLIENT_ID }}
  NEXT_PUBLIC_AZURE_AD_TENANT_ID: ${{ secrets.NEXT_PUBLIC_AZURE_AD_TENANT_ID }}
  NEXT_PUBLIC_AZURE_AD_REDIRECT_URI: https://mtk-care.azurewebsites.net
```

### 3. Verify Build Output
After deployment, the build logs should show that the API URL is properly set.

## Alternative Solutions

### Option 1: Use Runtime Configuration
Instead of `NEXT_PUBLIC_*` variables, use server-side environment variables and pass them through `getServerSideProps` or API routes.

### Option 2: Use Azure Static Web Apps
Azure Static Web Apps has better support for build-time environment variables.

### Option 3: Use a `.env.production` File
Create a production env file in your repository (be careful with secrets!):

```bash
# frontend/.env.production
NEXT_PUBLIC_PROD_API_BASE_URL=https://mtkcare-backend-abbffge3c9gqcqhr.newzealandnorth-01.azurewebsites.net
NEXT_PUBLIC_AZURE_AD_REDIRECT_URI=https://mtk-care.azurewebsites.net
# Don't commit secrets here!
```

## Session Duration Fix

While we're fixing deployments, also update the session duration mismatch:

### Backend (Django)
In `backend/config/settings/base.py`, change:
```python
SESSION_COOKIE_AGE = 14400  # 4 hours
```
To:
```python
SESSION_COOKIE_AGE = 28800  # 8 hours (matching frontend)
```

This will prevent the "Signature has expired" errors after 4 hours.