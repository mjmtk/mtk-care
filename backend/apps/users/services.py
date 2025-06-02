from typing import List, Optional
from django.contrib.auth.models import User
from .models import Role, UserProfile
from django.db import transaction

class UserService:
    """Service layer for user management."""
    @staticmethod
    def list_users(active: Optional[bool] = None, search: Optional[str] = None) -> List[User]:
        qs = User.objects.select_related('profile').all()
        if active is not None:
            qs = qs.filter(is_active=active)
        if search:
            qs = qs.filter(username__icontains=search)
        return list(qs)

    @staticmethod
    def get_user(user_id: int) -> Optional[User]:
        try:
            return User.objects.select_related('profile').get(id=user_id)
        except User.DoesNotExist:
            return None

    @staticmethod
    @transaction.atomic
    def create_user(username: str, email: str, is_active: bool = True) -> User:
        if User.objects.filter(username=username).exists():
            raise ValueError("User with this username already exists.")
        user = User.objects.create(username=username, email=email, is_active=is_active)
        UserProfile.objects.create(user=user)
        return user

    @staticmethod
    @transaction.atomic
    def update_user(user_id: int, **kwargs) -> Optional[User]:
        user = UserService.get_user(user_id)
        if not user:
            return None
        for k, v in kwargs.items():
            setattr(user, k, v)
        user.save()
        return user

    @staticmethod
    @transaction.atomic
    def set_active(user_id: int, active: bool) -> Optional[User]:
        user = UserService.get_user(user_id)
        if not user:
            return None
        user.is_active = active
        user.save()
        return user

    @staticmethod
    @transaction.atomic
    def assign_roles(user_id: int, role_ids: List[int]) -> Optional[User]:
        user = UserService.get_user(user_id)
        if not user:
            return None
        user.profile.roles.set(Role.objects.filter(id__in=role_ids))
        return user

class RoleService:
    """Service layer for role management."""
    @staticmethod
    def list_roles() -> List[Role]:
        return list(Role.objects.all())

    @staticmethod
    def get_role(role_id: int) -> Optional[Role]:
        try:
            return Role.objects.get(id=role_id)
        except Role.DoesNotExist:
            return None

    @staticmethod
    def create_role(name: str, description: str = "", level: int = 0) -> Role:
        if Role.objects.filter(name=name).exists():
            raise ValueError("Role with this name already exists.")
        return Role.objects.create(name=name, description=description, level=level)

    @staticmethod
    def update_role(role_id: int, **kwargs) -> Optional[Role]:
        role = RoleService.get_role(role_id)
        if not role:
            return None
        for k, v in kwargs.items():
            setattr(role, k, v)
        role.save()
        return role

    @staticmethod
    def delete_role(role_id: int) -> bool:
        role = RoleService.get_role(role_id)
        if not role:
            return False
        role.delete()
        return True
