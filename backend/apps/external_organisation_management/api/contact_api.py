import uuid
from typing import List, Optional

from ninja import Router, Query, Body
from ninja.errors import HttpError
from django.http import Http404

from ..schemas import (
    ExternalOrganisationContactSchemaIn,
    ExternalOrganisationContactSchemaOut,
)
from .. import services

contacts_router = Router(tags=["External Organisation Contacts"])

# Collection operations (on /)
@contacts_router.get("/", response=List[ExternalOrganisationContactSchemaOut], summary="List contacts")
def list_external_organisation_contacts(request, organisation_id: Optional[uuid.UUID] = Query(None)):
    filters = {}
    if organisation_id:
        filters['organisation_id'] = organisation_id
    return services.external_organisation_contact_list(filters=filters)

@contacts_router.post("/", response={201: ExternalOrganisationContactSchemaOut}, summary="Create a new contact for an external organisation")
def create_external_organisation_contact(request, payload: ExternalOrganisationContactSchemaIn = Body(...)):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        return services.external_organisation_contact_create(payload, user=request.user)
    except Http404 as e:
        raise HttpError(404, str(e))
    except Exception as e:
        # Consider logging the exception e
        raise HttpError(500, "Could not create contact.")

# Item-specific operations (on /{contact_id}/)
@contacts_router.get("/{uuid:contact_id}", response=ExternalOrganisationContactSchemaOut, summary="Retrieve a specific contact")
def get_external_organisation_contact(request, contact_id: uuid.UUID):
    try:
        return services.external_organisation_contact_get(contact_id)
    except Http404 as e:
        raise HttpError(404, str(e))

@contacts_router.put("/{uuid:contact_id}", response=ExternalOrganisationContactSchemaOut, summary="Update a contact")
def update_external_organisation_contact(request, contact_id: uuid.UUID, payload: ExternalOrganisationContactSchemaIn = Body(...)):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        contact_instance = services.external_organisation_contact_update(contact_id, payload, user=request.user)
        return contact_instance
    except Http404 as e:
        raise HttpError(404, str(e))
    except Exception as e:
        # Consider logging the exception e
        raise HttpError(500, "Could not update contact.")

@contacts_router.delete("/{uuid:contact_id}", response={204: None}, summary="Delete a contact")
def delete_external_organisation_contact(request, contact_id: uuid.UUID):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        services.external_organisation_contact_delete(contact_id, user=request.user)
        return 204, None
    except Http404 as e:
        raise HttpError(404, str(e))
