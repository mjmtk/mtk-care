from uuid import UUID
from ninja import Router
from typing import List
from .services import UserService, RoleService
from .schemas import UserOut, UserCreate, UserUpdate, RoleOut, RoleCreate, RoleUpdate, UserProfileOut

# Initialize routers
users_router = Router(tags=["users"])
roles_router = Router(tags=["roles"])

# --- User Endpoints ---

@users_router.get("/me", response=UserOut)
def get_current_user(request):
    print("HIT /me endpoint (CASCADE DEBUG)")
    # In auth bypass mode, user comes from request.user
    # In normal mode, user comes from request.auth
    user = request.user if hasattr(request, 'user') and request.user.is_authenticated else request.auth
    if not user or not user.is_authenticated:
        return 401, {"detail": "Not authenticated"}
    profile = user.profile if hasattr(user, 'profile') else None
    if not profile:
        return 404, {"detail": "User profile not found for current user."}
    profile_schema = UserProfileOut(
        id=profile.id,
        phone_number=getattr(profile, 'phone_number', None),
        employee_id=getattr(profile, 'employee_id', None),
        title=getattr(profile, 'title', None),
        avatar=getattr(profile, 'avatar', None),
        preferences=getattr(profile, 'preferences', {}),
        azure_ad_groups=getattr(profile, 'azure_ad_groups', []),
    )
    roles = []
    if profile and profile.role:
        roles = [RoleOut.from_orm(profile.role)]
    return UserOut(
        id=user.id,
        username=user.username,
        email=user.email,
        is_active=user.is_active,
        first_name=getattr(user, 'first_name', None),
        last_name=getattr(user, 'last_name', None),
        profile=profile_schema,
        roles=roles,
    )

@users_router.get("/", response=List[UserOut])
def list_users(request, active: bool = None, search: str = None):
    users = UserService.list_users(active=active, search=search)
    result = []
    for user in users:
        profile = user.profile if hasattr(user, 'profile') else None
        profile_data = None
        if profile:
            profile_data = {
                'id': profile.id,
                'phone_number': getattr(profile, 'phone_number', None),
                'employee_id': getattr(profile, 'employee_id', None),
                'title': getattr(profile, 'title', None),
                'avatar': getattr(profile, 'avatar', None),
                'preferences': getattr(profile, 'preferences', {}),
                'azure_ad_groups': getattr(profile, 'azure_ad_groups', []),
            }
        roles = [RoleOut.from_orm(role) for role in getattr(user, 'roles', []).all()] if hasattr(user, 'roles') else []
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_active': user.is_active,
            'first_name': getattr(user, 'first_name', None),
            'last_name': getattr(user, 'last_name', None),
            'profile': profile_data,
            'roles': roles,
        }
        result.append(user_data)
    return result

@users_router.post("/", response=UserOut)
def create_user(request, data: UserCreate):
    user = UserService.create_user(**data.dict())
    profile = user.profile if hasattr(user, 'profile') else None
    profile_data = None
    if profile:
        profile_data = {
            'id': profile.id,
            'phone_number': getattr(profile, 'phone_number', None),
            'employee_id': getattr(profile, 'employee_id', None),
            'title': getattr(profile, 'title', None),
            'avatar': getattr(profile, 'avatar', None),
            'preferences': getattr(profile, 'preferences', {}),
            'azure_ad_groups': getattr(profile, 'azure_ad_groups', []),
        }
    roles = [RoleOut.from_orm(role) for role in getattr(user, 'roles', []).all()] if hasattr(user, 'roles') else []
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_active': user.is_active,
        'first_name': getattr(user, 'first_name', None),
        'last_name': getattr(user, 'last_name', None),
        'profile': profile_data,
        'roles': roles,
    }

@users_router.get("/{user_id}/", response=UserOut)
def get_user(request, user_id: UUID):
    print("HIT /users/{user_id} endpoint (CASCADE DEBUG)")
    user = UserService.get_user(user_id)
    if not user:
        return 404, {"detail": "User not found"}
    profile = user.profile if hasattr(user, 'profile') else None
    profile_data = None
    if profile:
        profile_data = {
            'id': profile.id,
            'phone_number': getattr(profile, 'phone_number', None),
            'employee_id': getattr(profile, 'employee_id', None),
            'title': getattr(profile, 'title', None),
            'avatar': getattr(profile, 'avatar', None),
            'preferences': getattr(profile, 'preferences', {}),
            'azure_ad_groups': getattr(profile, 'azure_ad_groups', []),
        }
    roles = [RoleOut.from_orm(role) for role in getattr(user, 'roles', []).all()] if hasattr(user, 'roles') else []
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_active': user.is_active,
        'first_name': getattr(user, 'first_name', None),
        'last_name': getattr(user, 'last_name', None),
        'profile': profile_data,
        'roles': roles,
    }

@users_router.put("/{user_id}/", response=UserOut)
def update_user(request, user_id: UUID, data: UserUpdate):
    user = UserService.update_user(user_id, **data.dict(exclude_unset=True))
    if not user:
        return 404, {"detail": "User not found"}
    profile = user.profile if hasattr(user, 'profile') else None
    profile_data = None
    if profile:
        profile_data = {
            'id': profile.id,
            'phone_number': getattr(profile, 'phone_number', None),
            'employee_id': getattr(profile, 'employee_id', None),
            'title': getattr(profile, 'title', None),
            'avatar': getattr(profile, 'avatar', None),
            'preferences': getattr(profile, 'preferences', {}),
            'azure_ad_groups': getattr(profile, 'azure_ad_groups', []),
        }
    roles = [RoleOut.from_orm(role) for role in getattr(user, 'roles', []).all()] if hasattr(user, 'roles') else []
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_active': user.is_active,
        'first_name': getattr(user, 'first_name', None),
        'last_name': getattr(user, 'last_name', None),
        'profile': profile_data,
        'roles': roles,
    }

@users_router.post("/{user_id}/activate/", response=UserOut)
def activate_user(request, user_id: UUID):
    user = UserService.set_active(user_id, True)
    if not user:
        return 404, {"detail": "User not found"}
    profile = user.profile if hasattr(user, 'profile') else None
    profile_data = None
    if profile:
        profile_data = {
            'id': profile.id,
            'phone_number': getattr(profile, 'phone_number', None),
            'employee_id': getattr(profile, 'employee_id', None),
            'title': getattr(profile, 'title', None),
            'avatar': getattr(profile, 'avatar', None),
            'preferences': getattr(profile, 'preferences', {}),
            'azure_ad_groups': getattr(profile, 'azure_ad_groups', []),
        }
    roles = [RoleOut.from_orm(role) for role in getattr(user, 'roles', []).all()] if hasattr(user, 'roles') else []
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_active': user.is_active,
        'first_name': getattr(user, 'first_name', None),
        'last_name': getattr(user, 'last_name', None),
        'profile': profile_data,
        'roles': roles,
    }

@users_router.post("/{user_id}/deactivate/", response=UserOut)
def deactivate_user(request, user_id: UUID):
    user = UserService.set_active(user_id, False)
    if not user:
        return 404, {"detail": "User not found"}
    profile = user.profile if hasattr(user, 'profile') else None
    profile_data = None
    if profile:
        profile_data = {
            'id': profile.id,
            'phone_number': getattr(profile, 'phone_number', None),
            'employee_id': getattr(profile, 'employee_id', None),
            'title': getattr(profile, 'title', None),
            'avatar': getattr(profile, 'avatar', None),
            'preferences': getattr(profile, 'preferences', {}),
            'azure_ad_groups': getattr(profile, 'azure_ad_groups', []),
        }
    roles = [RoleOut.from_orm(role) for role in getattr(user, 'roles', []).all()] if hasattr(user, 'roles') else []
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_active': user.is_active,
        'first_name': getattr(user, 'first_name', None),
        'last_name': getattr(user, 'last_name', None),
        'profile': profile_data,
        'roles': roles,
    }

@users_router.post("/{user_id}/roles/", response=UserOut)
def assign_roles(request, user_id: UUID, role_ids: List[UUID]):
    user = UserService.assign_roles(user_id, role_ids)
    if not user:
        return 404, {"detail": "User not found"}
    profile = user.profile if hasattr(user, 'profile') else None
    profile_data = None
    if profile:
        profile_data = {
            'id': profile.id,
            'phone_number': getattr(profile, 'phone_number', None),
            'employee_id': getattr(profile, 'employee_id', None),
            'title': getattr(profile, 'title', None),
            'avatar': getattr(profile, 'avatar', None),
            'preferences': getattr(profile, 'preferences', {}),
            'azure_ad_groups': getattr(profile, 'azure_ad_groups', []),
        }
    roles = [RoleOut.from_orm(role) for role in getattr(user, 'roles', []).all()] if hasattr(user, 'roles') else []
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_active': user.is_active,
        'first_name': getattr(user, 'first_name', None),
        'last_name': getattr(user, 'last_name', None),
        'profile': profile_data,
        'roles': roles,
    }

# --- Role Endpoints ---
# --- Role Endpoints ---
@roles_router.get("/", response=List[RoleOut])
def list_roles(request):
    roles = RoleService.list_roles()
    result = []
    for role in roles:
        result.append({
            'id': role.id,
            'name': role.name,
            'description': role.description,
            'level': role.level,
            'is_system_role': role.is_system_role,
            'is_active': role.is_active,
            'custom_permissions': role.custom_permissions,
            'permissions': list(role.permissions.values_list('codename', flat=True))
        })
    return result

@roles_router.post("/", response=RoleOut)
def create_role(request, data: RoleCreate):
    role = RoleService.create_role(**data.dict())
    return RoleOut.from_orm(role)

@roles_router.get("/{role_id}/", response=RoleOut)
def get_role(request, role_id: int):
    role = RoleService.get_role(role_id)
    if not role:
        return 404, {"detail": "Role not found"}
    return RoleOut.from_orm(role)

@roles_router.put("/{role_id}/", response=RoleOut)
def update_role(request, role_id: int, data: RoleUpdate):
    role = RoleService.update_role(role_id, **data.dict(exclude_unset=True))
    if not role:
        return 404, {"detail": "Role not found"}
    return RoleOut.from_orm(role)

@roles_router.delete("/{role_id}/")
def delete_role(request, role_id: int):
    success = RoleService.delete_role(role_id)
    if not success:
        return 404, {"detail": "Role not found"}
    return 204, None
