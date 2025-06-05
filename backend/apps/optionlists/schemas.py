from ninja import Schema
from typing import Optional

class OptionListItemSchemaOut(Schema):
    id: int
    slug: str
    name: str
    label: Optional[str] = None
    sort_order: int
    is_active: bool

class OptionListSchemaOut(Schema):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    is_active: bool
    # If items should be nested:
    # items: List[OptionListItemSchemaOut] = [] 
    # For now, this matches the checkpoint snippet.
