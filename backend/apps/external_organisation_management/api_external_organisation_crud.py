from typing import List, Optional
from ninja import Router, Schema, Query
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.conf import settings
import uuid # Ensure uuid is imported if not already present globally for org_id type hint
from ninja.errors import HttpError

from .models import ExternalOrganisation
from .schemas import (
    ExternalOrganisationBatchDropdownsOut,
    ExternalOrganisationSchemaIn, 
    ExternalOrganisationSchemaOut
)
from .services import (
    external_organisation_create,
    external_organisation_list,
    external_organisation_get,
    external_organisation_update,
    external_organisation_delete,
    get_external_organisation_batch_dropdowns
)

# Define a filter schema for listing external organisations
class ExternalOrganisationFilterSchema(Schema):
    type__slug: Optional[str] = None # To filter by type slug, e.g., 'service-provider'
    name__icontains: Optional[str] = None # Example: filter by name containing a string
    is_active: Optional[bool] = None # Example: filter by active status

external_org_router = Router(tags=["External Organisations"])


@external_org_router.get("/batch-dropdowns/", response=ExternalOrganisationBatchDropdownsOut, summary="Get Batch Dropdowns for External Organisations")
def batch_dropdowns_external_org(request):
    """
    Provides a batch of all dropdown options required for the External Organisation management UI.
    Currently includes: external_organisation_types.
    """
    return get_external_organisation_batch_dropdowns()

@external_org_router.post("/", response={201: ExternalOrganisationSchemaOut}, summary="Create External Organisation")
def create_external_organisation(request, payload: ExternalOrganisationSchemaIn):
    """
    Create a new external organisation.
    """
    try:
        organisation = external_organisation_create(payload=payload, user=request.user)
        return organisation
    except ValueError as e:
        raise HttpError(400, str(e))
    except Exception as e:
        # Log the exception e
        # logger.error(f"Unexpected error in create_external_organisation: {e}", exc_info=True)
        # print(f"CREATE EXCEPTION IN API: {type(e).__name__} - {str(e)}") # Temporary for debugging
        raise HttpError(500, "An unexpected error occurred while creating the organisation." if not settings.DEBUG else str(e) )

@external_org_router.get("/", response=List[ExternalOrganisationSchemaOut], summary="List External Organisations")
def list_external_organisations(request, filters: ExternalOrganisationFilterSchema = Query(default=ExternalOrganisationFilterSchema())):
    """
    Retrieve a list of all external organisations.
    Supports filtering by query parameters (e.g., ?type__slug=service-provider&name__icontains=test).
    """
    # Convert Pydantic model to dict, excluding unset values so we don't pass None for unprovided filters
    # Using .dict(exclude_none=True) is also an option if you want to explicitly filter out None values
    # if they were somehow set in the schema despite being Optional.
    filter_params = filters.dict(exclude_unset=True)
    organisations = external_organisation_list(filters=filter_params)
    return organisations

# Item-specific operations for External Organisations
@external_org_router.get("/{uuid:org_id}/", response=ExternalOrganisationSchemaOut, summary="Retrieve an External Organisation by ID", tags=["External Organisations"])
def get_external_organisation_by_id(request, org_id: uuid.UUID):
    try:
        organisation = external_organisation_get(organisation_id=org_id)
        return organisation
    except Http404:
        raise HttpError(404, "External Organisation not found")
    except Exception as e:
        # Log the exception e
        # print(f"Unexpected error in get_external_organisation_by_id: {e}") # Basic logging
        raise HttpError(500, str(e) if settings.DEBUG else "Internal server error")

@external_org_router.put("/{uuid:org_id}/", response=ExternalOrganisationSchemaOut, summary="Update an External Organisation by ID", tags=["External Organisations"])
def update_external_organisation(request, org_id: uuid.UUID, payload: ExternalOrganisationSchemaIn):
    try:
        organisation = external_organisation_update(organisation_id=org_id, payload=payload, user=request.user)
        return organisation
    except Http404:
        raise HttpError(404, "External Organisation not found")
    except ValueError as e: # Catch validation errors from the service (e.g., bad type_id)
        raise HttpError(400, str(e))
    except Exception as e:
        # Log the exception e
        # print(f"Unexpected error in update_external_organisation: {e}") # Basic logging
        raise HttpError(500, str(e) if settings.DEBUG else "Internal server error")

@external_org_router.delete("/{uuid:org_id}/", response={204: None}, summary="Delete an External Organisation by ID", tags=["External Organisations"]) # No content on success
def delete_external_organisation(request, org_id: uuid.UUID):
    try:
        external_organisation_delete(organisation_id=org_id, user=request.user)
        return 204, None
    except Http404:  # If service's get_object_or_404 fails
        raise HttpError(404, "External Organisation not found")
    except Exception as e:
        # Log the exception e
        # print(f"Unexpected error in delete_external_organisation: {e}") # Basic logging
        raise HttpError(500, str(e) if settings.DEBUG else "Internal server error")
