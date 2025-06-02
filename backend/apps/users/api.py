from ninja import Router
from typing import List
from .services import UserService, RoleService
from .schemas import UserOut, UserCreate, UserUpdate, RoleOut, RoleCreate, RoleUpdate

router = Router(tags=["users"])

# --- User Endpoints ---
@router.get("/users/", response=List[UserOut])
def list_users(request, active: bool = None, search: str = None):
    users = UserService.list_users(active=active, search=search)
    return [UserOut.from_orm(u) for u in users]

@router.post("/users/", response=UserOut)
def create_user(request, data: UserCreate):
    user = UserService.create_user(**data.dict())
    return UserOut.from_orm(user)

@router.get("/users/{user_id}/", response=UserOut)
def get_user(request, user_id: int):
    user = UserService.get_user(user_id)
    if not user:
        return 404, {"detail": "User not found"}
    return UserOut.from_orm(user)

@router.put("/users/{user_id}/", response=UserOut)
def update_user(request, user_id: int, data: UserUpdate):
    user = UserService.update_user(user_id, **data.dict(exclude_unset=True))
    if not user:
        return 404, {"detail": "User not found"}
    return UserOut.from_orm(user)

@router.post("/users/{user_id}/activate/", response=UserOut)
def activate_user(request, user_id: int):
    user = UserService.set_active(user_id, True)
    if not user:
        return 404, {"detail": "User not found"}
    return UserOut.from_orm(user)

@router.post("/users/{user_id}/deactivate/", response=UserOut)
def deactivate_user(request, user_id: int):
    user = UserService.set_active(user_id, False)
    if not user:
        return 404, {"detail": "User not found"}
    return UserOut.from_orm(user)

@router.post("/users/{user_id}/roles/", response=UserOut)
def assign_roles(request, user_id: int, role_ids: List[int]):
    user = UserService.assign_roles(user_id, role_ids)
    if not user:
        return 404, {"detail": "User not found"}
    return UserOut.from_orm(user)

# --- Role Endpoints ---
@router.get("/roles/", response=List[RoleOut])
def list_roles(request):
    return [RoleOut.from_orm(r) for r in RoleService.list_roles()]

@router.post("/roles/", response=RoleOut)
def create_role(request, data: RoleCreate):
    role = RoleService.create_role(**data.dict())
    return RoleOut.from_orm(role)

@router.get("/roles/{role_id}/", response=RoleOut)
def get_role(request, role_id: int):
    role = RoleService.get_role(role_id)
    if not role:
        return 404, {"detail": "Role not found"}
    return RoleOut.from_orm(role)

@router.put("/roles/{role_id}/", response=RoleOut)
def update_role(request, role_id: int, data: RoleUpdate):
    role = RoleService.update_role(role_id, **data.dict(exclude_unset=True))
    if not role:
        return 404, {"detail": "Role not found"}
    return RoleOut.from_orm(role)

@router.delete("/roles/{role_id}/")
def delete_role(request, role_id: int):
    success = RoleService.delete_role(role_id)
    if not success:
        return 404, {"detail": "Role not found"}
    return 204, None
