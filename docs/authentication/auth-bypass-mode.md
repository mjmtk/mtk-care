# Authentication Bypass Mode

This document describes how to enable and use the authentication bypass mode for development and testing scenarios in the MTK Care application.

## Overview

The authentication bypass mode allows developers to skip Azure AD authentication during development and testing. This is particularly useful for:

- Local development without Azure AD setup
- Automated testing scenarios
- Demonstrations and prototyping
- CI/CD pipeline testing

## How It Works

### Backend (Django Ninja)

When `AUTH_BYPASS_MODE=true` is set:

1. **AuthBypassMiddleware** creates a mock authenticated user
2. **JWTAuthenticationMiddleware** skips JWT token validation
3. A test user `test.user@example.com` is automatically created with admin privileges
4. API requests proceed as if authenticated via Azure AD

### Frontend (Next.js)

When `NEXT_PUBLIC_AUTH_BYPASS_MODE=true` is set:

1. **AuthBypassProvider** provides mock session data
2. **Middleware** bypasses NextAuth authentication checks
3. API calls use mock tokens instead of real Azure AD tokens
4. Protected routes become accessible without login

## Configuration

### Environment Variables

Add these variables to your environment files:

**Backend (.env):**
```bash
# Enable auth bypass mode
AUTH_BYPASS_MODE=true
```

**Frontend (.env.local):**
```bash
# Enable auth bypass mode
NEXT_PUBLIC_AUTH_BYPASS_MODE=true
```

### Complete .env.example

```bash
# Authentication Bypass Mode (Development/Testing)
# Set to true to bypass Azure AD authentication
# Backend
AUTH_BYPASS_MODE=false

# Frontend  
NEXT_PUBLIC_AUTH_BYPASS_MODE=false

# Azure AD Configuration (Production)
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret  
AZURE_AD_TENANT_ID=your-tenant-id
NEXT_PUBLIC_AZURE_AD_BACKEND_API_SCOPE=api://your-api-scope/.default

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Database Configuration
DB_CONNECTION_TYPE=local
POSTGRES_DB=mtk_care
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Django Configuration
DJANGO_SECRET_KEY=your-django-secret-key
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## Usage

### 1. Enable Bypass Mode

Set the environment variables in your development environment:

```bash
# Backend
echo "AUTH_BYPASS_MODE=true" >> backend/.env

# Frontend
echo "NEXT_PUBLIC_AUTH_BYPASS_MODE=true" >> frontend/.env.local
```

### 2. Start Development Servers

```bash
# Backend
cd backend
python manage.py runserver

# Frontend
cd frontend
npm run dev
```

### 3. Access Protected Routes

With bypass mode enabled, you can:

- Navigate directly to `/dashboard` without login
- Make API calls without Azure AD tokens
- Test features requiring authentication
- Access admin functionality

### 4. Using Custom Hooks

The frontend provides custom hooks for bypass-aware authentication:

```typescript
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass';

function MyComponent() {
  const { data: session, status, isAuthBypass } = useAuthBypassSession();
  const accessToken = useAccessToken();
  
  if (isAuthBypass) {
    console.log('Running in auth bypass mode');
  }
  
  // Use session and accessToken as normal
}
```

## Test User Details

When bypass mode is enabled, a test user is automatically created:

- **Username:** `test.user@example.com`
- **Email:** `test.user@example.com`
- **Name:** Test User
- **Role:** Admin (first available role or creates "Test Admin")
- **Azure OID:** `bypass-test-oid-12345`
- **Groups:** `['test-group-id']`

## Security Considerations

### ⚠️ Important Security Notes

1. **Never enable in production** - This bypasses all authentication
2. **Environment-specific** - Only enable in development/testing environments
3. **Clear indicators** - The bypass mode logs activity for awareness
4. **Admin access preserved** - Django admin remains accessible with normal login

### Production Safety

The implementation includes safety measures:

- Defaults to `false` if environment variables are not set
- No code changes needed between development and production
- Clear logging when bypass mode is active
- Separate middleware that can be easily disabled

## Implementation Details

### Backend Components

1. **`AuthBypassMiddleware`** (`apps/authentication/middleware_bypass.py`)
   - Creates and manages the test user
   - Injects mock authentication into requests
   - Handles role assignment

2. **`JWTAuthenticationMiddleware`** (`apps/authentication/middleware.py`)
   - Modified to skip JWT validation in bypass mode
   - Maintains existing functionality when disabled

3. **Settings** (`config/settings/base.py`)
   - Added `AUTH_BYPASS_MODE` configuration
   - Middleware ordering updated

### Frontend Components

1. **`AuthBypassProvider`** (`components/providers/auth-bypass-provider.tsx`)
   - Provides context for bypass mode
   - Creates mock session data

2. **`SessionProvider`** (`components/providers/session-provider.tsx`)
   - Conditionally uses bypass or NextAuth sessions
   - Wraps application with appropriate provider

3. **`Middleware`** (`middleware.ts`)
   - Bypasses NextAuth checks when enabled
   - Maintains route protection logic

4. **`API Service`** (`services/apiService.ts`)
   - Uses mock tokens in bypass mode
   - Maintains API compatibility

5. **Custom Hooks** (`hooks/useAuthBypass.ts`)
   - `useAuthBypassSession()` - Session with bypass support
   - `useAccessToken()` - Token with bypass support

## Troubleshooting

### Common Issues

1. **Routes still require login**
   - Check frontend environment variable: `NEXT_PUBLIC_AUTH_BYPASS_MODE=true`
   - Restart the frontend development server

2. **API returns 401 errors**
   - Check backend environment variable: `AUTH_BYPASS_MODE=true`
   - Restart the Django development server

3. **Test user has no permissions**
   - Check if roles exist in the database
   - Run migrations: `python manage.py migrate`

4. **Bypass mode not working**
   - Check console logs for bypass activity
   - Verify environment variables are set correctly
   - Clear browser cache and restart servers

### Debugging

Enable debug logging to see bypass activity:

```bash
# Backend logs will show:
# "Auth bypass applied - user: test.user@example.com"

# Frontend console will show:
# "[Auth Bypass] Allowing request to /dashboard"
```

## Disabling Bypass Mode

To return to normal Azure AD authentication:

1. Remove or set to `false` in environment files:
   ```bash
   AUTH_BYPASS_MODE=false
   NEXT_PUBLIC_AUTH_BYPASS_MODE=false
   ```

2. Restart both backend and frontend servers

3. Configure proper Azure AD credentials for production use

The application will seamlessly return to normal authentication flow without any code changes.