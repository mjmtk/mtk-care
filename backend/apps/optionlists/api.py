from typing import Optional, List
from ninja import Router, Query
from django.http import Http404
from .schemas import OptionListItemSchemaOut
from .models import OptionList # For existence check
from .services import OptionListService
# from apps.client_management.schemas import ClientBatchDropdownsOut

def create_optionlists_router():
    router = Router(tags=["Option Lists"])

    # @router.get("/client-batch-dropdowns/", response=ClientBatchDropdownsOut, summary="Retrieve Batch Dropdowns for Client Management")
    # def get_client_batch_dropdowns(request, organization_id: Optional[int] = Query(None, description="Optional Organization ID to filter dropdowns")):
    #     """
    #     Provides a batch of all dropdown options required for the client management UI.
    #     This includes statuses, pronouns, languages, ethnicities, identities, cultural groups, countries, etc.
        
    #     If an `organization_id` is provided, dropdowns may be filtered accordingly where applicable.
    #     """
    #     # TODO: Ensure organization_id is correctly typed and handled if it's UUID vs int based on core.Organisation PK
    #     # For now, passing it as is. The service layer's get_by_slug expects 'Any'.
    #     return OptionListService.get_options_for_client_batch_dropdowns(organization_id=organization_id)

    @router.get("/{list_slug}/", response=List[OptionListItemSchemaOut], summary="List all active items for a specific OptionList by its slug")
    def list_option_list_items_by_slug(request, list_slug: str):
        """
        Retrieves all active items for a given OptionList slug (e.g., 'external-organisation-types').
        Items are ordered by their predefined sort_order.
        """
        # First, check if the OptionList itself exists to provide a clear 404 for the list itself
        if not OptionList.objects.filter(slug=list_slug).exists():
            raise Http404(f"OptionList with slug '{list_slug}' not found.")

        items = OptionListService.get_active_items_for_list_slug(list_slug=list_slug)
        # If the list exists but has no items, an empty list is a valid response.
        return items
    
    return router

