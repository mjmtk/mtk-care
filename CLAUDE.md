# CLAUDE.md - AI Assistant Context

This file provides important context for AI assistants (like Claude) working on this codebase.

## Project Overview

MTK Care is a healthcare task management system with:
- **Frontend**: Next.js application deployed to Azure Web App (`mtk-care`)
- **Backend**: Django application deployed to Azure Web App (`mtkcare-backend`)
- **Authentication**: Azure AD with role-based access control

## Critical Information

### API Versioning Standard (IMPORTANT)

**All API endpoints use `/api/v1/` prefix**. This was decided on January 6, 2025, to resolve inconsistencies.

- Backend serves all endpoints under `/api/v1/`
- Frontend must include `v1/` in all API calls
- Example: `apiRequest({ url: 'v1/users/me/' })` → `/api/v1/users/me/`

See `docs/API_VERSIONING_STANDARD.md` for full details.

### Environment Variables

Production requires these critical environment variables:

**Frontend (mtk-care)**:
- `NEXT_PUBLIC_PROD_API_BASE_URL`: Backend URL (e.g., `https://mtkcare-backend.azurewebsites.net`)
- `NEXT_PUBLIC_AZURE_AD_CLIENT_ID`: Azure AD app client ID
- `NEXTAUTH_SECRET`: NextAuth.js secret

**Backend (mtkcare-backend)**:
- `DJANGO_SECRET_KEY`: Django secret key
- `DJANGO_ALLOWED_HOSTS`: Allowed hosts for Django
- Database connection settings

### Common Issues and Solutions

1. **404 errors on API calls**: Check that frontend is using `v1/` prefix
2. **CORS errors**: Ensure `CORS_ALLOWED_ORIGINS` includes frontend URL
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
python manage.py runserver  # Runs on http://localhost:8000
```

### Testing Commands

Run these before committing:
- Frontend: `npm run lint` and `npm run typecheck`
- Backend: `python manage.py test`

## Architecture Decisions

1. **Separate Web Apps**: Frontend and backend deployed as separate Azure Web Apps
2. **API Versioning**: URL-based versioning (`/api/v1/`)
3. **Authentication**: Azure AD with JWT tokens
4. **Database**: PostgreSQL on Azure

## File Structure

- `/frontend`: Next.js application
- `/backend`: Django application  
- `/docs`: Technical documentation
- `/.github/workflows`: CI/CD pipelines

## Recent Changes

- January 6, 2025: Standardized API versioning to use `/api/v1/` prefix consistently