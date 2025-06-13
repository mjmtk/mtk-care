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
    model_config = {"from_attributes": True}
    
    id: UUID
    file_name: str
    original_filename: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    sharepoint_id: Optional[str] = None
    sharepoint_url: Optional[str] = None
    client_id: Optional[UUID] = None
    referral_id: Optional[UUID] = None
    folder_category: str = 'general'
    status: str = 'pending'
    is_confidential: bool = False
    access_level: str = 'internal'
    version: str = '1.0'
    is_latest_version: bool = True
    description: Optional[str] = None
    tags: list = []
    metadata: dict = {}
    upload_error: Optional[str] = None
    uploaded_at: Optional[datetime.datetime] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime
    # type field should be handled by Django serialization since it's a ForeignKey

class DocumentCreateSchema(Schema):
    file_name: str
    original_filename: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    client_id: Optional[UUID] = None
    referral_id: Optional[UUID] = None
    folder_category: Optional[str] = 'general'
    type_id: Optional[int] = None  # Changed from UUID to int - OptionListItem uses integer PK
    is_confidential: Optional[bool] = False
    access_level: Optional[str] = 'internal'
    description: Optional[str] = None
    tags: Optional[list] = []
    metadata: Optional[dict] = {}

class DocumentUpdateSchema(Schema):
    file_name: Optional[str] = None
    original_filename: Optional[str] = None
    folder_category: Optional[str] = None
    type_id: Optional[int] = None  # Changed from UUID to int - OptionListItem uses integer PK
    status: Optional[str] = None
    is_confidential: Optional[bool] = None
    access_level: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[list] = None
    metadata: Optional[dict] = None
    sharepoint_id: Optional[str] = None
    sharepoint_url: Optional[str] = None
    upload_error: Optional[str] = None
