# Django Ninja API Standards

## Overview

This document establishes consistent standards for Django Ninja API development in the MTK Care project to ensure reliability, maintainability, and a great developer experience.

## 🎯 Core Standards

### 1. Django Settings for REST APIs

**✅ REQUIRED: Set APPEND_SLASH = False in Django settings**
```python
# In config/settings/base.py
APPEND_SLASH = False
```

**Why:** Django's `APPEND_SLASH=True` (default) conflicts with REST API standards:
- Automatically redirects `/api/v1/users` → `/api/v1/users/`
- Breaks POST/PUT requests (can't redirect while preserving request body)
- Conflicts with our "no trailing slash" standard

### 2. URL Pattern Standards

**✅ DO: Use URLs WITHOUT trailing slashes**
```python
# Correct
@router.get("/users")
@router.get("/users/{user_id}")
@router.post("/users")
@router.get("/batch-dropdowns")

# Incorrect  
@router.get("/users/")           # ❌ Trailing slash
@router.get("/users/{user_id}/") # ❌ Trailing slash
@router.post("/users/")          # ❌ Trailing slash
```

**Why:** 
- REST API standard convention
- Prevents 404 errors due to trailing slash inconsistencies
- Simpler URL patterns
- Works better with frontend routing libraries

**Exception:** Root endpoints can use empty string `""` instead of `"/"`
```python
@router.get("")  # For listing endpoints at router root
```

### 3. Router Registration Standards

**✅ DO: Register routers WITH trailing slashes in ninja.py**
```python
# In api/ninja.py
api.add_router("/referrals/", referrals_router, tags=["Referrals"])
api.add_router("/users/", users_router, tags=["Users"])
```

**Why:** This creates clean separation between router mounting and endpoint patterns.

### 4. Frontend API Client Standards

**✅ DO: Use the centralized apiRequest() function**
```typescript
// In services
static async getUsers(): Promise<User[]> {
  return apiRequest<User[]>({
    url: 'v1/users',  // No leading slash, no trailing slash
    method: 'GET',
  });
}
```

**✅ DO: Don't worry about trailing slashes in frontend**
The `apiRequest()` function has automatic trailing slash handling:
- Tries request as-is first
- If 404, retries with/without trailing slash
- Caches successful pattern for performance

### 5. Endpoint Naming Conventions

**Collection Endpoints:**
```python
@router.get("")              # GET /api/v1/users/ → List users
@router.post("")             # POST /api/v1/users/ → Create user
```

**Resource Endpoints:**
```python
@router.get("/{user_id}")    # GET /api/v1/users/123 → Get user
@router.put("/{user_id}")    # PUT /api/v1/users/123 → Update user
@router.delete("/{user_id}") # DELETE /api/v1/users/123 → Delete user
```

**Action Endpoints:**
```python
@router.post("/{user_id}/activate")     # POST /api/v1/users/123/activate
@router.get("/batch-dropdowns")         # GET /api/v1/users/batch-dropdowns
@router.patch("/{user_id}/roles")       # PATCH /api/v1/users/123/roles
```

### 6. Route Order (CRITICAL)

**✅ DO: Place specific routes BEFORE generic parameter routes**
```python
# Correct order
@router.get("/batch-dropdowns")    # Specific route first
@router.get("/{user_id}")          # Generic route second

# Incorrect order - will cause 422 errors
@router.get("/{user_id}")          # ❌ Generic route catches everything
@router.get("/batch-dropdowns")    # ❌ Never reached
```

**Why:** Django Ninja matches routes in order. Generic routes like `/{id}` will match any string, including "batch-dropdowns".

### 7. Response Schema Standards

**✅ DO: Always specify response schemas**
```python
@router.get("/{user_id}", response=UserOut)
@router.post("", response={201: UserOut, 400: ErrorOut})
```

**✅ DO: Use appropriate HTTP status codes**
```python
@router.post("", response={201: UserOut})      # Created
@router.put("/{id}", response={200: UserOut})  # Updated
@router.delete("/{id}", response={204: None})  # Deleted
```

### 8. Authentication Standards

**✅ DO: Use the auth_required decorator**
```python
from apps.authentication.decorators import auth_required

@router.get("/users", auth=auth_required)
def list_users(request: HttpRequest):
    pass
```

**✅ DO: Handle anonymous users in development**
```python
user = request.user
if not user or user.is_anonymous:
    # For development/testing - create default user
    user, created = User.objects.get_or_create(
        username='test.user@example.com',
        defaults={'email': 'test.user@example.com', 'is_active': True}
    )
```

## 🛠️ Implementation Checklist

### For New Endpoints

- [ ] Router patterns use NO trailing slashes
- [ ] Response schemas are specified
- [ ] Authentication is properly configured
- [ ] Endpoint follows RESTful naming conventions
- [ ] Error handling is implemented
- [ ] Documentation strings are added

### For Frontend Services

- [ ] Use `apiRequest()` utility function
- [ ] URLs are relative (no `/api` prefix)
- [ ] Don't worry about trailing slashes (handled automatically)
- [ ] Proper TypeScript types are used
- [ ] Error handling is implemented

## 🔧 Automatic Failsafe

Our `apiRequest()` utility provides automatic trailing slash handling:

```typescript
// In src/services/api-request.ts
// Automatically retries with/without trailing slash on 404
// Caches successful patterns for performance
// Logs when it finds the correct pattern
```

This means even if standards aren't followed perfectly, the API will still work.

## 📋 Migration Strategy

### Current State
- 50+ endpoints currently use trailing slashes
- Frontend has automatic retry logic as failsafe

### Migration Priority
1. **High Priority**: Endpoints causing current 404 errors
   - `/referrals/batch-dropdowns/` → `/referrals/batch-dropdowns` ✅ Done
   - `/users/me/` → `/users/me` ✅ Done
   
2. **Medium Priority**: Frequently used endpoints
   - User management endpoints
   - Referral CRUD endpoints
   
3. **Low Priority**: Less critical endpoints
   - Admin endpoints
   - Batch operations

### Migration Process
1. Update backend endpoint (remove trailing slash)
2. Test with frontend (should work due to retry logic)
3. Update any hardcoded URLs in tests
4. Update API documentation

## 🚨 Common Mistakes to Avoid

### ❌ DON'T: Mix patterns within the same router
```python
# Bad - inconsistent
@router.get("/users/")    # Has trailing slash
@router.get("/users/{id}") # No trailing slash
```

### ❌ DON'T: Hardcode full API URLs in frontend
```typescript
// Bad
fetch('http://localhost:8000/api/v1/users/')

// Good  
apiRequest({ url: 'v1/users' })
```

### ❌ DON'T: Forget error handling
```python
# Bad - no error handling
@router.get("/{user_id}")
def get_user(request, user_id: UUID):
    return User.objects.get(id=user_id)  # Can raise DoesNotExist

# Good
@router.get("/{user_id}")  
def get_user(request, user_id: UUID):
    return get_object_or_404(User, id=user_id)
```

## 🔍 Testing Standards

### Backend Tests
```python
def test_list_users():
    response = client.get('/api/v1/users')  # No trailing slash
    assert response.status_code == 200
```

### Frontend Tests  
```typescript
// Use the same apiRequest utility in tests
const users = await apiRequest({ url: 'v1/users' });
```

## 📖 References

- [Django Ninja Documentation](https://django-ninja.rest-framework.com/)
- [REST API Design Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)

## 🔄 Future Considerations

1. **API Versioning**: Current `/v1/` prefix works well
2. **Rate Limiting**: Consider adding for production
3. **OpenAPI Generation**: Ensure schemas generate correct docs
4. **Monitoring**: Add logging for API performance metrics

---

**Remember**: The automatic trailing slash handling in `apiRequest()` provides a safety net, but following these standards prevents unnecessary retries and ensures optimal performance.