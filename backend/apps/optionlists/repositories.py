from typing import Optional, List, Any
from .models import OptionList, OptionListItem
from django.db.models import Q, QuerySet

class OptionListRepository:
    """
    Repository for OptionList data access.
    """
    @staticmethod
    def get_by_slug(slug: str, organization_id: Optional[Any] = None) -> Optional[OptionList]:
        """Fetches an option list by its slug, optionally filtered by organization."""
        filters = Q(slug=slug)
        if organization_id:
            filters &= Q(organization_id=organization_id)
        else:
            # If no organization_id is provided, typically we'd fetch global or template lists.
            # Adjust this logic based on how global/template lists are identified (e.g., organization is None or is_template=True)
            filters &= Q(organization__isnull=True) # Assuming global lists have no organization
        return OptionList.objects.filter(filters).first()
    @staticmethod
    def get_by_id(option_list_id) -> Optional[OptionList]:
        return OptionList.objects.filter(id=option_list_id).first()

    @staticmethod
    def get_all() -> List[OptionList]:
        return list(OptionList.objects.all())

    @staticmethod
    def get_by_name(name: str) -> Optional[OptionList]:
        return OptionList.objects.filter(name=name).first()

class OptionListItemRepository:
    """
    Repository for OptionListItem data access, with scoping logic.
    """
    @staticmethod
    def get_items(option_list: OptionList, region: Optional[str] = None, client_id: Optional[str] = None, active_only: bool = True) -> QuerySet:
        qs = OptionListItem.objects.filter(option_list=option_list)
        if active_only:
            qs = qs.filter(is_active=True)
        if region:
            region_items = qs.filter(region=region)
            if region_items.exists():
                return region_items.order_by("sort_order")
        # System-wide fallback (no region specified or no region items)
        return qs.filter(region__isnull=True).order_by("sort_order")
