# API Versioning Standard

This document defines the API versioning strategy for the MTK Care application to ensure consistency between frontend and backend.

## Decision Record

**Date**: January 6, 2025  
**Decision**: Use URL-based versioning with `/api/v1/` prefix for all API endpoints  
**Rationale**: Clear, explicit versioning that's visible in URLs and easy to manage

## Implementation

### Backend Configuration

All API endpoints are served under `/api/v1/` prefix:

```python
# backend/config/urls.py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', api.urls),  # All API endpoints use /api/v1/ prefix
]
```

This means:
- User endpoints: `/api/v1/users/`
- Role endpoints: `/api/v1/roles/`
- Document endpoints: `/api/v1/documents/`
- Option list endpoints: `/api/v1/optionlists/`
- Authentication endpoints: `/api/v1/auth/`

### Frontend Configuration

All API calls must include the `v1/` prefix in their URL:

```typescript
// CORRECT - includes v1 prefix
apiRequest({ url: 'v1/users/me/' })  // Results in: /api/v1/users/me/

// INCORRECT - missing v1 prefix
apiRequest({ url: 'users/me/' })     // Would result in: /api/users/me/ (404 error)
```

### API Path Construction

The frontend uses `apiConfig.ts` to construct full API paths:

1. `API_BASE_URL`: Set to the backend URL (e.g., `https://mtkcare-backend.azurewebsites.net`)
2. `getApiPath()`: Prepends `/api/` to the provided path
3. Service calls should include `v1/` in their paths

Example flow:
```typescript
// In service file
url: 'v1/users/me/'

// getApiPath() converts to
'/api/v1/users/me/'

// Combined with API_BASE_URL becomes
'https://mtkcare-backend.azurewebsites.net/api/v1/users/me/'
```

## Checklist for New Endpoints

When adding new API endpoints:

1. **Backend**: Register router in `backend/api/ninja.py`
2. **Frontend**: Use `v1/` prefix in all API calls
3. **Documentation**: Update OpenAPI spec if needed
4. **Tests**: Ensure tests use correct `/api/v1/` paths

## Common Mistakes to Avoid

1. **Missing v1 prefix**: Always include `v1/` in frontend API calls
2. **Inconsistent trailing slashes**: Django Ninja requires trailing slashes
3. **Hardcoding full URLs**: Use `apiConfig.ts` for URL construction
4. **Mixing versioned and non-versioned calls**: All API calls should use v1

## Future Versioning

When introducing API v2:

1. Add new URL pattern: `path('api/v2/', api_v2.urls)`
2. Maintain v1 endpoints for backward compatibility
3. Update frontend to use appropriate version based on feature flags
4. Document migration path and deprecation timeline