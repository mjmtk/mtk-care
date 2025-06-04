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
    """
    Get current user profile with detailed role information.
    
    Returns:
        dict: User profile with detailed role information including:
            - id: User ID
            - username: Username
            - email: User email
            - first_name: User's first name
            - last_name: User's last name
            - roles: List of role names (for backward compatibility)
            - role_details: List of dictionaries with detailed role information
            - highest_role: The highest-level role assigned to the user (based on level)
            - permissions: List of all permissions
            - is_staff: Boolean indicating staff status
            - is_superuser: Boolean indicating superuser status
            - date_joined: When the user account was created
            - last_login: When the user last logged in
    """
    user = request.auth
    
    # Get all roles from Azure AD groups
    azure_groups = getattr(user, 'azure_ad_groups', []) or []
    
    # Get all role mappings for user's Azure AD groups
    from apps.users.models import GroupRoleMapping
    role_mappings = GroupRoleMapping.objects.filter(
        azure_ad_group_id__in=azure_groups
    ).select_related('role').order_by('role__level')
    
    # Extract unique roles (in case of multiple mappings to same role)
    roles = []
    seen_role_ids = set()
    
    for mapping in role_mappings:
        if mapping.role_id not in seen_role_ids:
            seen_role_ids.add(mapping.role_id)
            roles.append(mapping.role)
    
    # Get highest role (lowest level number)
    highest_role = roles[0] if roles else None
    
    # Prepare role details
    role_details = [
        {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "level": role.level,
            "permissions": list(role.permissions.values_list('codename', flat=True))
        }
        for role in roles
    ]
    
    # For backward compatibility, include role names in the root
    role_names = [role['name'] for role in role_details]
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "roles": role_names,  # For backward compatibility
        "role_details": role_details,
        "highest_role": {
            "id": highest_role.id,
            "name": highest_role.name,
            "level": highest_role.level
        } if highest_role else None,
        "permissions": list(user.get_all_permissions()),
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "date_joined": user.date_joined,
        "last_login": user.last_login,
    }

# Include API routers
from apps.authentication.api import router as auth_router
from apps.users.api import router as users_router

# Include API routers
api.add_router("/auth/", auth_router)

# Other routers
# api.add_router("/tasks/", "apps.tasks.api.router")
# api.add_router("/departments/", "apps.departments.api.router")
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
