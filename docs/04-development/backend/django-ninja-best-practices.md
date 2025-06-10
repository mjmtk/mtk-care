# Django Ninja API Architecture Best Practices

This document outlines the recommended patterns for organizing Django Ninja APIs in our MTK Care project, based on analysis of both our current implementation and the reference well-ahead project.

## Current State Analysis

### ❌ Current Issues in Our Setup

1. **NinjaAPI in main urls.py**: We're defining the main API instance in `config/urls.py` instead of a dedicated module
2. **Mixed endpoint definitions**: Some endpoints are defined directly in the main `config/urls.py` file
3. **Commented-out routers**: Router registrations are commented out instead of being active
4. **Inconsistent structure**: No clear separation between core API setup and app-specific routers
5. **Missing versioning**: No API versioning strategy implemented

### ✅ Reference Project Best Practices

The reference project demonstrates a cleaner architecture:

1. **Dedicated API module**: Single `api/ninja.py` file for global API instance
2. **App-specific routers**: Each app defines its own routers
3. **Clean URL routing**: Main `urls.py` only includes the API, doesn't define endpoints
4. **Consistent imports**: Clear imports from each app's API module
5. **Proper namespacing**: Logical URL prefixes for different functional areas

## Recommended Architecture

### 1. File Structure

```
backend/
├── config/
│   └── urls.py                 # Main URL routing (includes API only)
├── api/
│   ├── __init__.py
│   ├── ninja.py               # Global NinjaAPI instance + router registration
│   └── urls.py                # API-specific URL patterns
└── apps/
    ├── users/
    │   ├── api.py             # Users routers (users_router, roles_router)
    │   ├── schemas.py         # Pydantic schemas
    │   └── services.py        # Business logic
    ├── authentication/
    │   └── api.py             # Auth router
    └── [other apps]/
        └── api.py             # App-specific routers
```

### 2. Global API Setup (`api/ninja.py`)

```python
from ninja import NinjaAPI
from ninja.security import HttpBearer
from apps.authentication.jwt_auth import JWTAuth

# Import all app routers
from apps.users.api import users_router, roles_router
from apps.authentication.api import auth_router
from apps.optionlists.api import optionlists_router
# ... other app routers

# Create the main API instance
api = NinjaAPI(
    title="MTK-Care API",
    description="Healthcare Task Manager API with Azure AD Authentication", 
    version="v1",
    docs_url="/docs" if settings.DEBUG else None,
)

# Authentication instance
auth = JWTAuth()

# Core endpoints (minimal - only health checks, auth validation)
@api.get("/health")
def health_check(request):
    return {
        "status": "healthy",
        "message": "MTK-Care API is running", 
        "version": "v1"
    }

# Register app routers with proper namespacing
api.add_router("/auth", auth_router, tags=["Authentication"])
api.add_router("/users", users_router, tags=["Users"])
api.add_router("/roles", roles_router, tags=["Roles"]) 
api.add_router("/optionlists", optionlists_router, tags=["Option Lists"])
# ... other routers
```

### 3. API URLs (`api/urls.py`)

```python
from django.urls import path
from .ninja import api

urlpatterns = [
    path('', api.urls),
]
```

### 4. Main Project URLs (`config/urls.py`)

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Development-only patterns
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns
```

### 5. App-Specific API Structure (`apps/users/api.py`)

```python
from ninja import Router
from typing import List
from uuid import UUID

from .services import UserService, RoleService
from .schemas import UserOut, UserCreate, UserUpdate, RoleOut

# Create separate routers for logical groupings
users_router = Router(tags=["Users"])
roles_router = Router(tags=["Roles"])

# User endpoints
@users_router.get("/", response=List[UserOut])
def list_users(request, active: bool = None, search: str = None):
    """List all users with optional filtering."""
    return UserService.list_users(active=active, search=search)

@users_router.get("/me/", response=UserOut)  
def get_current_user(request):
    """Get current authenticated user."""
    # Implementation here

# Role endpoints  
@roles_router.get("/", response=List[RoleOut])
def list_roles(request):
    """List all available roles."""
    return RoleService.list_roles()
```

## Migration Strategy

### Phase 1: Restructure API Organization ✅ COMPLETED
1. ✅ Create `api/ninja.py` with global API instance
2. ✅ Move router registrations from `config/urls.py` to `api/ninja.py`
3. ✅ Create `api/urls.py` for API-specific routing
4. ✅ Clean up `config/urls.py` to only include API
5. ✅ Updated frontend API route to use versioned endpoints (`/v1/users/`)

### Phase 2: Enable Active Routers ⏳ NEXT SESSION
1. ⏳ Uncomment and activate existing routers (if any additional ones needed)
2. ⏳ Test each router integration
3. ⏳ Fix any import or configuration issues

**Current Status (End of Session):**
- Phase 1 completely finished ✅
- API restructuring successful with clean architecture
- All existing endpoints (users, roles, optionlists, auth) working perfectly
- Frontend updated to use versioned endpoints
- Ready to proceed with Phase 2 when resuming work

### Phase 3: Standardize App APIs
1. ✅ Ensure each app follows consistent API patterns
2. ✅ Implement proper schemas and services separation
3. ✅ Add comprehensive error handling

### Phase 4: API Versioning (Future)
1. ⏳ Implement `/v1/` prefixes for all endpoints
2. ⏳ Plan backward compatibility strategy
3. ⏳ Document versioning approach

## API Endpoint Standards (CRITICAL)

### ⚠️ URL Pattern Consistency Rules

**ALWAYS follow these patterns to prevent 404 errors:**

#### ✅ Collection Endpoints (GET/POST lists)
```python
# ✅ CORRECT - Use "/" for collection endpoints
@router.get("/", response=List[ModelOut])
def list_resources(request):
    pass

@router.post("/", response=ModelOut) 
def create_resource(request, data: ModelIn):
    pass
```

#### ✅ Individual Resource Endpoints  
```python
# ✅ CORRECT - No trailing slash for individual resources
@router.get("/{resource_id}", response=ModelOut)
def get_resource(request, resource_id: UUID):
    pass

@router.put("/{resource_id}", response=ModelOut)
def update_resource(request, resource_id: UUID, data: ModelIn):
    pass

@router.delete("/{resource_id}")
def delete_resource(request, resource_id: UUID):
    pass
```

#### ✅ Special Action Endpoints
```python
# ✅ CORRECT - Descriptive paths, no trailing slash
@router.get("/batch-dropdowns", response=DropdownsOut)
def get_batch_dropdowns(request):
    pass

@router.post("/{resource_id}/activate", response=ModelOut)
def activate_resource(request, resource_id: UUID):
    pass
```

#### ❌ NEVER DO - Empty String Routes
```python
# ❌ WRONG - This causes 404 errors with Django Ninja mounting
@router.get("", response=List[ModelOut])  # DON'T USE EMPTY STRINGS
@router.post("", response=ModelOut)       # DON'T USE EMPTY STRINGS
```

### 🔧 Frontend API Call Standards

#### ✅ Consistent URL Building
```typescript
// ✅ CORRECT - Always use trailing slash for collections
const users = await apiRequest({ url: 'v1/users/' });
const referrals = await apiRequest({ url: 'v1/referrals/' });

// ✅ CORRECT - No trailing slash for individual resources  
const user = await apiRequest({ url: `v1/users/${id}` });
const referral = await apiRequest({ url: `v1/referrals/${id}` });

// ✅ CORRECT - No trailing slash for special actions
const dropdowns = await apiRequest({ url: 'v1/referrals/batch-dropdowns' });
```

## Best Practices Checklist

### ✅ API Organization
- [x] Global API instance in dedicated `api/ninja.py`
- [x] App-specific routers in each `apps/*/api.py`
- [x] Clean separation of concerns
- [x] Consistent import patterns

### ✅ Endpoint Design  
- [x] RESTful URL patterns
- [x] Proper HTTP methods (GET, POST, PUT, DELETE)
- [x] **CRITICAL: Consistent URL patterns (/ for collections, no / for resources)**
- [x] Consistent response schemas
- [x] Appropriate status codes

### ✅ Authentication & Authorization
- [x] Consistent auth decorators
- [x] Role-based access control
- [x] Proper error responses (401, 403)

### ✅ Documentation
- [x] Comprehensive docstrings
- [x] Schema documentation
- [x] API docs accessible at `/api/docs/`

### ✅ Error Handling  
- [x] Consistent error response format
- [x] Appropriate HTTP status codes
- [x] Helpful error messages

### ✅ Testing
- [ ] Unit tests for each endpoint
- [ ] Integration tests for workflows
- [ ] Authentication testing

## Common Patterns

### Router Registration
```python
# In api/ninja.py
api.add_router("/resource", resource_router, tags=["Resource Name"])
```

### Authentication Required
```python
# In apps/*/api.py  
@router.get("/protected/", auth=auth)
def protected_endpoint(request):
    user = request.auth
    # Implementation
```

### Error Responses
```python
# Standard error format
if not found:
    return 404, {"detail": "Resource not found"}
```

### Schema Usage
```python
# Input/output schemas
@router.post("/", response=ResourceOut)
def create_resource(request, data: ResourceCreate):
    return ResourceService.create(**data.dict())
```

This architecture provides a scalable, maintainable foundation for our Django Ninja API as we migrate features from the reference project.