
from typing import Optional
from ninja import Schema

class OptionListItemSchema(Schema):
    id: int
    option_list: int
    name: str
    label: Optional[str] = None
    slug: str
    description: Optional[str] = None
    is_active: bool
    sort_order: int
    metadata: Optional[dict] = None
    region: Optional[str] = None
    parent: Optional[int] = None
    global_option: Optional[bool] = None

class OptionListSchema(Schema):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    organization: Optional[int] = None
    is_active: bool
    is_template: bool
    global_option_list: bool
    metadata: Optional[dict] = None