from ninja import Schema
from typing import List, Optional

class RoleOut(Schema):
    id: int
    name: str
    description: Optional[str] = None
    level: int

class UserProfileOut(Schema):
    id: int
    phone_number: Optional[str] = None
    employee_id: Optional[str] = None
    title: Optional[str] = None
    avatar: Optional[str] = None
    preferences: dict
    azure_ad_groups: list

class UserOut(Schema):
    id: int
    username: str
    email: str
    is_active: bool
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile: UserProfileOut
    roles: List[RoleOut]

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
