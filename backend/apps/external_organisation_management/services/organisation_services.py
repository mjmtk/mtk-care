import uuid
from typing import List, Optional, Dict, Any
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db import transaction # Added transaction as it was in the original file's org services part
from django.conf import settings

from ..models import (
    ExternalOrganisation,
)
from ..schemas import (
    ExternalOrganisationBatchDropdownsOut,
    ExtOrgDropdownItemOut,
    ExternalOrganisationSchemaIn,
)
from apps.optionlists.models import OptionList, OptionListItem # For external_organisation_list_service_providers
from apps.optionlists.services import OptionListService # For batch dropdowns

# --- External Organisation Services ---

def get_external_organisation_batch_dropdowns() -> ExternalOrganisationBatchDropdownsOut:
    """
    Fetches all dropdown options required for the external organisation management UI.
    """
    org_types_items = OptionListService.get_active_items_for_list_slug('external-organisation-types')

    # Map OptionListItem to ExtOrgDropdownItemOut
    # OptionListItem has: id, slug, name, label, sort_order, is_active
    # ExtOrgDropdownItemOut wants: id, slug, name, label
    mapped_org_types = [
        ExtOrgDropdownItemOut(
            id=item.id,
            slug=item.slug,
            name=item.name, # item.name is the primary field from OptionListItem
            label=item.label if item.label else item.name # Use name as fallback if label is empty
        )
        for item in org_types_items
    ]

    return ExternalOrganisationBatchDropdownsOut(
        external_organisation_types=mapped_org_types
        # Future: Add other dropdowns here by fetching and mapping them similarly
    )

def external_organisation_create(payload: ExternalOrganisationSchemaIn, user: settings.AUTH_USER_MODEL) -> ExternalOrganisation:
    org_data = payload.dict(exclude_unset=True)
    type_id = org_data.pop('type_id', None)

    if type_id is None:
        raise ValueError("type_id is required to create an organisation.")

    try:
        organisation_type = OptionListItem.objects.get(
            pk=type_id,
            option_list__slug='external-organisation-types'
        )
    except OptionListItem.DoesNotExist:
        raise ValueError(f"Invalid type_id: {type_id}. Organisation type not found.")

    organisation = ExternalOrganisation(type=organisation_type, **org_data)
    organisation.save(user=user)
    
    return ExternalOrganisation.objects.select_related('type', 'created_by', 'updated_by').get(pk=organisation.id)

def external_organisation_get(organisation_id: uuid.UUID) -> ExternalOrganisation:
    return get_object_or_404(ExternalOrganisation.objects.select_related('type', 'created_by', 'updated_by'), pk=organisation_id)

def external_organisation_list(filters: Optional[Dict[str, Any]] = None) -> List[ExternalOrganisation]:
    filters = filters or {}
    return ExternalOrganisation.objects.filter(**filters).select_related('type', 'created_by', 'updated_by')

def external_organisation_update(organisation_id: uuid.UUID, payload: ExternalOrganisationSchemaIn, user: settings.AUTH_USER_MODEL) -> ExternalOrganisation:
    organisation = get_object_or_404(ExternalOrganisation.objects.select_related('type'), pk=organisation_id)
    update_data = payload.dict(exclude_unset=True)

    if 'type_id' in update_data:
        new_type_id = update_data.pop('type_id')
        # Only fetch and update if type_id is actually different or if organisation.type is None (though type is not nullable)
        if organisation.type_id != new_type_id:
            try:
                new_organisation_type = OptionListItem.objects.get(
                    pk=new_type_id,
                    option_list__slug='external-organisation-types'
                )
                organisation.type = new_organisation_type
            except OptionListItem.DoesNotExist:
                raise ValueError(f"Invalid new type_id: {new_type_id}. Organisation type not found.")

    for key, value in update_data.items():
        setattr(organisation, key, value)
    
    organisation.save(user=user)
    return ExternalOrganisation.objects.select_related('type', 'created_by', 'updated_by').get(pk=organisation.id)

def external_organisation_delete(organisation_id: uuid.UUID, user: settings.AUTH_USER_MODEL) -> None:
    organisation = get_object_or_404(ExternalOrganisation, pk=organisation_id)
    organisation.delete(user=user)

def get_service_provider_organisations() -> List[ExternalOrganisation]:
    # Assuming 'Service Provider' is the name of the OptionListItem for service provider type
    # And 'external-organisation-types' is the slug of the OptionList for organisation types
    try:
        service_provider_item = OptionListItem.objects.get(option_list__slug='external-organisation-types', slug='service-provider')
        return ExternalOrganisation.objects.filter(type=service_provider_item, is_active=True).select_related('type', 'created_by', 'updated_by')
    except OptionListItem.DoesNotExist:
        # If the 'service-provider' OptionListItem itself is not found under the correct OptionList.
        return ExternalOrganisation.objects.none() # Return an empty queryset consistently
