from ninja import Router, Schema
from typing import List, Optional
from apps.optionlists.models import OptionList, OptionListItem
from django.shortcuts import get_object_or_404
from api.schemas.optionlists import OptionListItemSchema, OptionListSchema

optionlists_router = Router()

# --- Pydantic Schemas ---

# class OptionListItemSchema(Schema):
#     id: int
#     option_list: int
#     name: str
#     label: Optional[str] = None
#     slug: str
#     description: Optional[str] = None
#     is_active: bool
#     sort_order: int
#     metadata: Optional[dict] = None
#     region: Optional[str] = None
#     parent: Optional[int] = None
#     global_option: Optional[bool] = None

# class OptionListSchema(Schema):
#     id: int
#     name: str
#     slug: str
#     description: Optional[str] = None
#     organization: Optional[int] = None
#     is_active: bool
#     is_template: bool
#     global_option_list: bool
#     metadata: Optional[dict] = None

# --- Endpoints ---

@optionlists_router.get("/", response=List[OptionListSchema])
def list_optionlists(request):
    qs = OptionList.objects.all()
    return [
        OptionListSchema(
            id=obj.id,
            name=obj.name,
            slug=obj.slug,
            description=obj.description,
            organization=obj.organization.id if obj.organization else None,
            is_active=obj.is_active,
            is_template=obj.is_template,
            global_option_list=obj.global_option_list,
            metadata=obj.metadata,
        ) for obj in qs
    ]

@optionlists_router.get("/{optionlist_id}", response=OptionListSchema)
def get_optionlist(request, optionlist_id: int):
    obj = get_object_or_404(OptionList, id=optionlist_id)
    return OptionListSchema(
        id=obj.id,
        name=obj.name,
        slug=obj.slug,
        description=obj.description,
        organization=obj.organization.id if obj.organization else None,
        is_active=obj.is_active,
        is_template=obj.is_template,
        global_option_list=obj.global_option_list,
        metadata=obj.metadata,
    )

@optionlists_router.get("/{optionlist_id}/items", response=List[OptionListItemSchema])
def list_optionlist_items(request, optionlist_id: int):
    optionlist = get_object_or_404(OptionList, id=optionlist_id)
    items = OptionListItem.objects.filter(option_list=optionlist)
    return [
        OptionListItemSchema(
            id=item.id,
            option_list=item.option_list.id,
            name=item.name,
            label=item.label,
            slug=item.slug,
            description=item.description,
            is_active=item.is_active,
            sort_order=item.sort_order,
            metadata=item.metadata,
            region=item.region,
            parent=item.parent.id if item.parent else None,
            global_option=item.global_option,
        ) for item in items
    ]

@optionlists_router.get("/items/{item_id}", response=OptionListItemSchema)
def get_optionlist_item(request, item_id: int):
    item = get_object_or_404(OptionListItem, id=item_id)
    return OptionListItemSchema(
        id=item.id,
        option_list=item.option_list.id,
        name=item.name,
        label=item.label,
        slug=item.slug,
        description=item.description,
        is_active=item.is_active,
        sort_order=item.sort_order,
        metadata=item.metadata,
        region=item.region,
        parent=item.parent.id if item.parent else None,
        global_option=item.global_option,
    )
