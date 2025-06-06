from ninja import Schema
from typing import Optional, Any
from uuid import UUID
import datetime

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
