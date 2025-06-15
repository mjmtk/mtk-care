# Azure AD Permissions for SharePoint Integration

## Overview

The backend SharePoint integration requires specific Microsoft Graph API permissions to upload, manage, and access files in SharePoint. This document outlines the required permissions and setup steps.

## Required Azure AD Application Permissions

Your Azure AD application (currently `6022f3c6-b3cf-49e8-abaf-55c0c502f70c`) needs the following **Application permissions** (not delegated permissions):

### Microsoft Graph Permissions

1. **Sites.ReadWrite.All**
   - Allows the app to read and write items in all site collections
   - Required for: Creating folders, uploading files, reading file metadata

2. **Files.ReadWrite.All**
   - Allows the app to read and write all files
   - Required for: File upload, download, and management operations

### Optional but Recommended

3. **Sites.Manage.All**
   - Allows the app to create, edit, and delete items and lists in all site collections
   - Required for: Advanced folder management and site structure operations

## How to Add Permissions

### Step 1: Navigate to Azure Portal
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Find your app: `MTK Care Application` (ID: `6022f3c6-b3cf-49e8-abaf-55c0c502f70c`)

### Step 2: Add API Permissions
1. Click on **API permissions** in the left sidebar
2. Click **Add a permission**
3. Choose **Microsoft Graph**
4. Choose **Application permissions** (not Delegated permissions)
5. Search for and add:
   - `Sites.ReadWrite.All`
   - `Files.ReadWrite.All`
   - `Sites.Manage.All` (optional)

### Step 3: Grant Admin Consent
1. After adding permissions, click **Grant admin consent for [your tenant]**
2. Confirm the consent
3. Verify all permissions show "Granted for [your tenant]" with a green checkmark

## Current Error Analysis

The 403 Forbidden error you're seeing indicates:
```
403 Client Error: Forbidden for url: https://graph.microsoft.com/v1.0/sites/.../drive/root/children
```

This means:
- ✅ Authentication is working (you get a valid token)
- ❌ The application lacks permission to create folders in SharePoint
- ❌ Missing `Sites.ReadWrite.All` or `Files.ReadWrite.All` permissions

## Verification Steps

After adding permissions, you can verify they work:

1. **Check Token Permissions**: The access token should include the new scopes
2. **Test Folder Creation**: The backend should be able to create test folders
3. **Test File Upload**: Document upload should work end-to-end

## Alternative: Delegated Permissions (Not Recommended)

If you cannot grant application permissions, you could use delegated permissions, but this requires:
- User sign-in for each operation
- `Sites.ReadWrite.All` (delegated)
- `Files.ReadWrite.All` (delegated)

However, **application permissions are strongly recommended** for server-side operations.

## Security Considerations

### Why Application Permissions are Secure

1. **No User Context**: Operates with service account, not user permissions
2. **Controlled Access**: Only your backend can use these permissions
3. **Audit Trail**: All operations are logged with application identity
4. **Consistent Access**: Works regardless of which user uploaded the document

### Permission Scope

The permissions are scoped to your SharePoint tenant. Your application can only access:
- SharePoint sites within your `manaakitech.sharepoint.com` tenant
- No access to other tenants or external SharePoint sites

## Testing After Permission Grant

After granting permissions, test with:

```bash
cd backend
python manage.py shell
```

```python
from apps.common.sharepoint_service import SharePointGraphService
service = SharePointGraphService()

# Test authentication
token = service._get_access_token()
print(f"Token obtained: {token[:20]}...")

# Test site access
site_id = service.get_site_id()
print(f"Site ID: {site_id}")

# Test folder creation
result = service.create_folder_if_not_exists("test-folder")
print(f"Folder creation: {result}")
```

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Missing or incorrect permissions
2. **401 Unauthorized**: Invalid client secret or client ID
3. **404 Not Found**: Incorrect SharePoint site URL

### Debug Steps

1. Verify environment variables in `.env`
2. Check Azure AD app configuration
3. Confirm admin consent was granted
4. Test with Microsoft Graph Explorer

## Documentation Links

- [Microsoft Graph Permissions Reference](https://docs.microsoft.com/en-us/graph/permissions-reference)
- [SharePoint API in Microsoft Graph](https://docs.microsoft.com/en-us/graph/api/resources/sharepoint)
- [Application vs Delegated Permissions](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent)