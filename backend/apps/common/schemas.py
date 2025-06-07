from ninja import Schema
from typing import Optional, Any
from uuid import UUID
import datetime


class UUIDPKBaseModelSchema(Schema):
    """Base schema for models with UUID primary keys and audit fields."""
    model_config = {"from_attributes": True}
    
    id: UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime


class MessageSchema(Schema):
    """Simple message response schema."""
    message: str

class UserAuditSchema(Schema):
    model_config = {"from_attributes": True}
    id: UUID  # This project uses UUID primary keys for User model
    username: str

class DocumentSchema(Schema):
    id: UUID
    file_name: str
    sharepoint_id: str
    type_id: Optional[int] = None
    status_id: Optional[int] = None
    metadata: Optional[Any] = None
    created_at: Optional[datetime.datetime] = None
    created_by: Optional[str] = None
    updated_at: Optional[datetime.datetime] = None
    updated_by: Optional[str] = None

class DocumentCreateSchema(Schema):
    file_name: str
    sharepoint_id: str
    type_id: Optional[int] = None
    status_id: Optional[int] = None
    metadata: Optional[Any] = None

class DocumentUpdateSchema(Schema):
    file_name: Optional[str] = None
    sharepoint_id: Optional[str] = None
    type_id: Optional[int] = None
    status_id: Optional[int] = None
    metadata: Optional[Any] = None
