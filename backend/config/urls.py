from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from ninja import NinjaAPI
from ninja.security import HttpBearer
from django.contrib.auth.models import User
from apps.authentication.jwt_auth import JWTAuth

# Create the main API instance
api = NinjaAPI(
    title="MTK-Care API",
    description="Healthcare Task Manager API with Azure AD Authentication",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
)

# Authentication instance
auth = JWTAuth()

# Health check endpoint (no auth required)
@api.get("/health")
def health_check(request):
    return {
        "status": "healthy", 
        "message": "MTK-Care API is running",
        "version": "1.0.0"
    }

# Auth endpoint for token validation
@api.post("/auth/validate")
def validate_token(request):
    """Validate Azure AD token and return user data."""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return {"error": "Invalid authorization header"}, 401
    
    token = auth_header.split(' ')[1]
    user = auth.authenticate(request, token)
    
    if user:
        return {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "roles": list(user.groups.values_list('name', flat=True)),
            "permissions": list(user.get_all_permissions()),
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }
    
    return {"error": "Invalid token"}, 401

# User profile endpoint
@api.get("/profile", auth=auth)
def get_user_profile(request):
    """Get current user profile with roles."""
    user = request.auth
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "roles": list(user.groups.values_list('name', flat=True)),
        "permissions": list(user.get_all_permissions()),
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "date_joined": user.date_joined,
        "last_login": user.last_login,
    }

# Include API routers when they're created
# api.add_router("/tasks/", "apps.tasks.api.router")
# api.add_router("/departments/", "apps.departments.api.router") 
from apps.users.api import router as users_router
api.add_router("/users/", users_router)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api.urls),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug Toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [path('__debug__/', include(debug_toolbar.urls))] + urlpatterns
