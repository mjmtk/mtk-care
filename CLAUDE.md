# CLAUDE.md - AI Assistant Context

This file provides important context for AI assistants (like Claude) working on this codebase.

## Project Overview

MTK Care is a case management system for community services organizations with:
- **Frontend**: Next.js application deployed to Azure Web App (`mtk-care`)
- **Backend**: Django application deployed to Azure Web App (`mtkcare-backend`)
- **Authentication**: Azure AD with database-driven RBAC and CASL permissions

The system supports community services including counselling for alcohol and other drugs (AOD), mental health, youth services, and family violence support. Currently being developed for the first client in New Zealand, run by local Māori people.

## Critical Information

### API Versioning Standard (IMPORTANT)

**All API endpoints use `/api/v1/` prefix**. This was decided on June 6, 2025, to resolve inconsistencies.

- Backend serves all endpoints under `/api/v1/`
- Frontend must include `v1/` in all API calls
- Example: `apiRequest({ url: 'v1/users/me' })` → `/api/v1/users/me`

### API URL Pattern Standards (CRITICAL)

**ALWAYS follow these patterns to prevent 404 errors:**

#### Backend (Django Ninja):
```python
# ✅ CORRECT - Collections use "/"
@router.get("/", response=List[ModelOut])
@router.post("/", response=ModelOut)

# ✅ CORRECT - Individual resources use "/{id}"
@router.get("/{resource_id}", response=ModelOut)
@router.put("/{resource_id}", response=ModelOut)

# ✅ CORRECT - Special actions use descriptive paths
@router.get("/batch-dropdowns", response=DropdownsOut)

# ❌ NEVER USE - Empty string routes cause 404s
@router.get("", response=ModelOut)  # DON'T DO THIS
```

#### Frontend (API Calls):
```typescript
// ✅ CORRECT - Collections with trailing slash
const users = await apiRequest({ url: 'v1/users/' });
const referrals = await apiRequest({ url: 'v1/referrals/' });

// ✅ CORRECT - Individual resources without trailing slash
const user = await apiRequest({ url: `v1/users/${id}` });

// ✅ CORRECT - Special actions without trailing slash
const dropdowns = await apiRequest({ url: 'v1/referrals/batch-dropdowns' });
```

### Validation Tools

Run before committing API changes:
```bash
# Backend route validation
source backend/.venv/bin/activate
python scripts/validate_api_routes.py

# Pre-commit hooks (validates automatically)
pre-commit install
pre-commit run --all-files
```

### Environment Variables

Production requires these critical environment variables:

**Frontend (mtk-care)**:
- `NEXT_PUBLIC_PROD_API_BASE_URL`: Backend URL (e.g., `https://mtkcare-backend.azurewebsites.net`)
- `NEXT_PUBLIC_AZURE_AD_CLIENT_ID`: Azure AD app client ID
- `NEXTAUTH_SECRET`: NextAuth.js secret
- `NEXT_PUBLIC_AUTH_BYPASS_MODE`: Set to `false` in production (default: true in dev)

**Backend (mtkcare-backend)**:
- `DJANGO_SECRET_KEY`: Django secret key
- `DJANGO_ALLOWED_HOSTS`: Allowed hosts for Django
- `AUTH_BYPASS_MODE`: Set to `false` in production (default: false)
- Database connection settings

### Common Issues and Solutions

1. **404 errors on API calls**: Check URL patterns follow standards above
2. **CORS errors**: 
   - Development: CORS middleware is automatically included via `development.py`
   - Production: Azure Web App handles CORS (don't add middleware)
   - If you see "Method Not Allowed" for OPTIONS, restart Django server
3. **Authentication failures**: Verify Azure AD configuration matches between frontend and backend

### Development Commands

**Frontend**:
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

**Backend**:
```bash
cd backend
source .venv/bin/activate
python manage.py runserver  # Runs on http://localhost:8000
```

### Auth Bypass Mode Features

**IMPORTANT**: Both frontend (`NEXT_PUBLIC_AUTH_BYPASS_MODE`) and backend (`AUTH_BYPASS_MODE`) must be set to `false` in production!

When `AUTH_BYPASS_MODE=true` (backend) and `NEXT_PUBLIC_AUTH_BYPASS_MODE=true` (frontend):
- **Automatic superuser**: Creates `test.user@example.com` with superuser privileges
- **Role switching enabled**: User gets "Superuser" role with access to role switcher
- **All roles created**: Automatically creates all standard roles for testing:
  - Superuser (level 0) - for development/testing with role switching
  - Administrator (level 1) - full system admin
  - Manager (level 2) - senior management
  - Program Manager (level 3) - manages programs
  - Supervisor (level 4) - supervises staff
  - Team Lead (level 5) - leads teams
  - Practitioner (level 6) - direct service provider
  - Volunteer (level 7) - volunteer access
- **No Azure AD required**: Perfect for development and testing without HTTPS setup
- **Mock authentication**: Frontend uses mock session, backend creates bypass user

### Testing Commands

Run these before committing:
- Frontend: `npm run lint` and `npm run build`
- Backend: `python manage.py test`
- API Routes: `python scripts/validate_api_routes.py`
- Frontend URLs: `python scripts/validate_frontend_urls.py`

**Critical**: Always run `npm run build` before pushing to catch TypeScript errors!

## Architecture Decisions

1. **Separate Web Apps**: Frontend and backend deployed as separate Azure Web Apps
2. **API Versioning**: URL-based versioning (`/api/v1/`)
3. **Authentication**: Azure AD with JWT tokens + auth bypass for development
4. **Permissions**: CASL-based attribute access control with database-driven roles
5. **Database**: PostgreSQL on Azure with UUID primary keys
6. **API Standards**: Consistent URL patterns enforced by validation tools
7. **Error Handling**: Comprehensive error boundaries prevent unstyled crashes

## File Structure

- `/frontend`: Next.js application
- `/backend`: Django application
- `/docs`: Technical documentation
- `/.github/workflows`: CI/CD pipelines
- `/scripts`: Development and validation scripts

## Recent Changes

- June 6, 2025: Standardized API versioning to use `/api/v1/` prefix consistently
- June 8, 2025: Implemented strict API URL pattern standards with validation tools
- June 10, 2025: Major RBAC system implementation:
  - Replaced hardcoded role enums with database-driven roles
  - Migrated entire permission system to CASL for granular access control
  - Added comprehensive error boundaries to prevent application crashes
  - Fixed client creation workflow to display actual client data
  - Implemented role switching and dynamic role management
  - Added production deployment checklist and security controls
