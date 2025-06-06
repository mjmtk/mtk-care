from ninja import Schema
from typing import Optional, Any
from uuid import UUID

class DocumentSchema(Schema):
    id: UUID
    client_id: UUID
    file_name: str
    sharepoint_id: str
    type_id: int
    status_id: Optional[int] = None
    metadata: Optional[Any] = None
    created_at: Optional[str] = None
    created_by: Optional[str] = None
    updated_at: Optional[str] = None
    updated_by: Optional[str] = None

class DocumentCreateSchema(Schema):
    client_id: UUID
    file_name: str
    sharepoint_id: str
    type_id: int
    status_id: Optional[int] = None
    metadata: Optional[Any] = None

class DocumentUpdateSchema(Schema):
    file_name: Optional[str] = None
    sharepoint_id: Optional[str] = None
    type_id: Optional[int] = None
    status_id: Optional[int] = None
    metadata: Optional[Any] = None
