from ninja import Schema
from typing import List, Optional

from uuid import UUID

# NOTE: All IDs in schemas (except optionlists/items) should be UUIDs for consistency.
class RoleOut(Schema):
    id: UUID
    name: str
    description: Optional[str] = None
    level: int
    is_system_role: bool = False
    is_active: bool = True
    custom_permissions: dict = {}
    permissions: List[str] = []  # List of permission codenames

from uuid import UUID

class UserProfileOut(Schema):
    id: UUID
    phone_number: Optional[str] = None
    employee_id: Optional[str] = None
    title: Optional[str] = None
    avatar: Optional[str] = None
    preferences: dict = {}
    azure_ad_groups: list = []

class UserOut(Schema):
    id: UUID
    username: str
    email: str
    is_active: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile: Optional[UserProfileOut] = None
    roles: List[RoleOut] = []

class UserCreate(Schema):
    username: str
    email: str
    is_active: Optional[bool] = True

class UserUpdate(Schema):
    email: Optional[str]
    is_active: Optional[bool]
    first_name: Optional[str]
    last_name: Optional[str]

class RoleCreate(Schema):
    name: str
    description: Optional[str]
    level: int

class RoleUpdate(Schema):
    name: Optional[str]
    description: Optional[str]
    level: Optional[int]
