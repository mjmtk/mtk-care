import uuid
from typing import List, Optional

from ninja import Router, Query, Body
from ninja.errors import HttpError
from django.http import Http404

from ..schemas import (
    EmailAddressSchemaIn,
    EmailAddressSchemaOut,
)
from .. import services

emails_router = Router(tags=["Email Addresses"])

# Collection operations (on /)
@emails_router.get("/", response=List[EmailAddressSchemaOut], summary="List email addresses")
def list_email_addresses(request, contact_id: Optional[uuid.UUID] = Query(None), organisation_id: Optional[uuid.UUID] = Query(None)):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    filters = {}
    if contact_id:
        filters['contact_id'] = contact_id
    if organisation_id:
        filters['organisation_id'] = organisation_id
    return services.email_address_list(filters=filters)

@emails_router.post("/", response={201: EmailAddressSchemaOut}, summary="Create a new email address")
def create_email_address(request, payload: EmailAddressSchemaIn = Body(...)):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        return services.email_address_create(payload, user=request.user)
    except ValueError as e:
        raise HttpError(400, str(e))
    except Http404 as e: # Catch Http404 from get_object_or_404 in services
        raise HttpError(404, str(e)) # Re-raise as Ninja's HttpError with original message
    except Exception as e:
        # Consider logging the exception e
        raise HttpError(500, "Could not create email address.")

# Item-specific operations (on /{email_address_id}/)
@emails_router.get("/{uuid:email_address_id}", response=EmailAddressSchemaOut, summary="Retrieve a specific email address")
def get_email_address(request, email_address_id: uuid.UUID):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        return services.email_address_get(email_address_id)
    except Http404 as e:
        raise HttpError(404, str(e))

@emails_router.put("/{uuid:email_address_id}", response=EmailAddressSchemaOut, summary="Update an email address")
def update_email_address(request, email_address_id: uuid.UUID, payload: EmailAddressSchemaIn = Body(...)):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        return services.email_address_update(email_address_id, payload, user=request.user)
    except ValueError as e:
        raise HttpError(400, str(e))
    except Http404 as e: # Catch Http404 from get_object_or_404 in services
        raise HttpError(404, str(e)) # Re-raise as Ninja's HttpError with original message
    except Exception as e:
        # Consider logging the exception e
        raise HttpError(500, "Could not update email address.")

@emails_router.delete("/{uuid:email_address_id}", response={204: None}, summary="Delete an email address")
def delete_email_address(request, email_address_id: uuid.UUID):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        services.email_address_delete(email_address_id, user=request.user)
        return 204, None
    except Http404 as e:
        raise HttpError(404, str(e)) # Consistent with other endpoints
