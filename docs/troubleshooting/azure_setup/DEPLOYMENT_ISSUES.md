# MTK Care - Azure Deployment Issues & Solutions

## Table of Contents
- [Authentication & Authorization Issues](#authentication--authorization-issues)
  - [403 Forbidden on API Calls](#403-forbidden-on-api-calls)
  - [Token Version Mismatch](#token-version-mismatch)
  - [Incorrect Azure AD App Registration Setup](#incorrect-azure-ad-app-registration-setup)
- [Configuration Issues](#configuration-issues)
  - [Incorrect API Endpoints in Frontend](#incorrect-api-endpoints-in-frontend)
  - [Environment Variable Management](#environment-variable-management)
- [Azure-Specific Issues](#azure-specific-issues)
  - [SCM vs Application Endpoints](#scm-vs-application-endpoints)
  - [App Service Restart Requirements](#app-service-restart-requirements)

---

## Authentication & Authorization Issues

### 403 Forbidden on API Calls
**Symptoms:**
- Frontend successfully authenticates with Azure AD
- Receives 403 Forbidden when calling backend API endpoints
- Error occurs specifically on authenticated routes

**Root Causes & Solutions:**
1. **Incorrect Audience in Token**
   - **Issue:** Access token's `aud` claim doesn't match backend's expected audience
   - **Fix:** Ensure `NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE` in frontend matches backend's App ID URI (e.g., `api://<backend-app-id>/<scope>`)
   - **Verification:** Decode JWT at [jwt.ms](https://jwt.ms) and verify `aud` claim

2. **Missing API Permissions**
   - **Issue:** Frontend app lacks permissions to access backend API
   - **Fix:** In Azure Portal → Frontend App Registration → API Permissions → Add permission → APIs my organization uses → Select backend API → Check required permissions → Grant admin consent

### Token Version Mismatch
**Symptoms:**
- Authentication succeeds but API calls fail with 403
- Backend logs show token validation errors

**Root Cause:**
- Django backend configured for v1.0 tokens but receiving v2.0 tokens

**Solution:**
1. In Azure Portal → Backend App Registration → Manifest
2. Set `"requestedAccessTokenVersion": 1`
3. Save manifest
4. Restart both frontend and backend services

### Incorrect Azure AD App Registration Setup
**Issue:** Confusion between frontend and backend App Registrations

**Correct Setup:**
1. **Frontend App Registration**
   - Client ID: Used in NextAuth.js configuration
   - Redirect URIs: `https://<your-frontend-url>/api/auth/callback/azure-ad`
   - API Permissions: Request access to backend API scope

2. **Backend App Registration**
   - Exposes API with scope: `api://<backend-app-id>/access_as_user`
   - Application ID URI: `api://<backend-app-id>`
   - Required Resource Access: None needed (acts as resource server)

---

## Configuration Issues

### Incorrect API Endpoints in Frontend
**Issue:** Frontend configured to use SCM endpoints instead of application endpoints

**Symptoms:**
- API calls fail with 403 or 404
- URLs contain `.scm.` subdomain

**Solution:**
- Update frontend environment variables:
  ```
  # Incorrect
  NEXT_PUBLIC_API_BASE_URL=https://<app-name>.scm.<region>.azurewebsites.net
  
  # Correct
  NEXT_PUBLIC_API_BASE_URL=https://<app-name>.<region>.azurewebsites.net
  ```

### Environment Variable Management
**Common Issues:**
1. **Missing Variables in Azure**
   - Local `.env` files not reflected in Azure App Service
   - **Fix:** Add all required variables to Azure Portal → App Service → Configuration → Application Settings

2. **Sensitive Data in Version Control**
   - **Risk:** Accidentally committing secrets
   - **Prevention:**
     - Add `.env` and `.env.local` to `.gitignore`
     - Use Azure Key Vault for production secrets
     - Create `.env.example` with placeholder values

---

## Deployment & Build Issues

### Missing .next Folder in Azure Web App Deployment

**Symptoms:**
- Next.js application fails to start with error: `Error: Cannot find module '../server/require-hook'`
- Application logs show missing `.next` directory
- Build succeeds but deployment fails on startup

**Root Causes & Solutions:**
1. **Incorrect Zip Command in GitHub Actions**
   - **Issue:** Using `zip -r ../release.zip ./*` which excludes hidden files/folders like `.next`
   - **Fix:** Update zip command to use `.` instead of `*` to include all files:
     ```yaml
     run: cd frontend && zip -r ../release.zip .
     ```

2. **GitHub Actions Artifact Upload**
   - **Issue:** `actions/upload-artifact@v4` by default excludes hidden files
   - **Fix:** Ensure the zip command includes all files (as above) rather than relying on upload-artifact settings
   - **Note:** The `include-hidden-files` parameter is not a valid input for `actions/upload-artifact@v4` despite some documentation

3. **Working Directory Mismatch**
   - **Issue:** Build and zip commands not running in the correct directory
   - **Fix:** Ensure all build steps use `working-directory` or `cd` to the frontend directory before running commands

### GitHub Actions Workflow Configuration

**Key Requirements for Next.js on Azure Web App:**
1. **Build Output:** Must include `.next` folder with all build artifacts
2. **Startup Command:** Must be set to run from the correct directory:
   ```
   cd frontend && npm run start
   ```
3. **Environment Variables:** All required variables must be set in Azure Web App Configuration

**Workflow Best Practices:**
- Use `if-no-files-found: error` in upload-artifact step to fail fast if build output is missing
- Verify zip file contents with `ls -lh` before upload
- Set proper Node.js version in workflow (e.g., Node 18+ for modern Next.js)
- Use `working-directory` for all build steps to ensure consistent paths

## Azure-Specific Issues

### SCM vs Application Endpoints
**Key Difference:**
- **Application Endpoint:** `https://<app-name>.<region>.azurewebsites.net`
  - Serves your actual application
  - Handles regular HTTP/HTTPS traffic

- **SCM Endpoint:** `https://<app-name>.scm.<region>.azurewebsites.net`
  - Kudu deployment service
  - Used for deployments, logs, and diagnostics
  - Not for application API calls

### App Service Restart Requirements
**When to Restart:**
1. After changing environment variables
2. After updating authentication settings
3. After manifest changes in App Registration

**How to Restart:**
1. Azure Portal → App Service
2. Overview → Restart
3. Wait for full restart (1-2 minutes)

---

## Troubleshooting Checklist

1. **Verify Token Contents**
   - Decode JWT at [jwt.ms](https://jwt.ms)
   - Check `aud` matches backend App ID URI
   - Verify token version (v1.0 vs v2.0)
   - Check token expiration

2. **Check Network Requests**
   - Browser DevTools → Network tab
   - Verify correct API endpoints
   - Check Authorization header is present

3. **Backend Logs**
   - Azure Portal → App Service → Log stream
   - Check for authentication/authorization errors

4. **Frontend Logs**
   - Browser console for errors
   - Network tab for failed requests

---

## Best Practices

1. **Separate App Registrations**
   - Keep frontend and backend registrations separate
   - Clearly name them (e.g., "mtk-care-frontend", "mtk-care-backend")

2. **Environment Management**
   - Use different App Registrations for dev/staging/prod
   - Maintain separate `.env` files for each environment

3. **Documentation**
   - Keep this file updated with new issues and solutions
   - Document all environment variables and their purposes

4. **Security**
   - Rotate client secrets regularly
   - Use Managed Identities where possible
   - Implement proper CORS policies

---

*Last Updated: June 5, 2025*
