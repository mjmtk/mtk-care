import uuid
from typing import List, Optional

from ninja import Router, Query, Body
from ninja.errors import HttpError
from django.http import Http404

from ..models import (
    ExternalOrganisation as ExternalOrganisationModel,
    ExternalOrganisationContact as ExternalOrganisationContactModel,
    PhoneNumber as PhoneNumberModel,
)
from apps.optionlists.models import OptionListItem # Added for DoesNotExist handling

from ..schemas import (
    PhoneNumberSchemaIn,
    PhoneNumberSchemaOut,
)
from .. import services

phones_router = Router(tags=["Phone Numbers"])

# Collection operations (on /)
@phones_router.get("/", response=List[PhoneNumberSchemaOut], summary="List phone numbers")
def list_phone_numbers(request, contact_id: Optional[uuid.UUID] = Query(None), organisation_id: Optional[uuid.UUID] = Query(None)):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    filters = {}
    if contact_id:
        filters['contact_id'] = contact_id
    if organisation_id:
        filters['organisation_id'] = organisation_id
    return services.phone_number_list(filters=filters)

@phones_router.post("/", response={201: PhoneNumberSchemaOut}, summary="Create a new phone number")
def create_phone_number(request, payload: PhoneNumberSchemaIn = Body(...)):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        return services.phone_number_create(payload, user=request.user)
    except ValueError as e:
        raise HttpError(400, str(e))
    except Http404 as e: # Catch Http404 from get_object_or_404 in services
        raise HttpError(404, str(e)) # Re-raise as Ninja's HttpError with original message
    except Exception as e:
        # Consider logging the exception e
        raise HttpError(500, "Could not create phone number.")

# Item-specific operations (on /{phone_number_id}/)
@phones_router.get("/{uuid:phone_number_id}", response=PhoneNumberSchemaOut, summary="Retrieve a specific phone number")
def get_phone_number(request, phone_number_id: uuid.UUID):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        return services.phone_number_get(phone_number_id)
    except Http404 as e:
        raise HttpError(404, str(e))

@phones_router.put("/{uuid:phone_number_id}", response=PhoneNumberSchemaOut, summary="Update a phone number")
def update_phone_number(request, phone_number_id: uuid.UUID, payload: PhoneNumberSchemaIn = Body(...)):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        return services.phone_number_update(phone_number_id, payload, user=request.user)
    except ValueError as e:
        raise HttpError(400, str(e))
    except Http404 as e: # Catch Http404 from get_object_or_404 in services
        raise HttpError(404, str(e)) # Re-raise as Ninja's HttpError with original message
    except Exception as e:
        # Consider logging the exception e
        raise HttpError(500, "Could not update phone number.")

@phones_router.delete("/{uuid:phone_number_id}", response={204: None}, summary="Delete a phone number")
def delete_phone_number(request, phone_number_id: uuid.UUID):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    try:
        services.phone_number_delete(phone_number_id, user=request.user)
        return 204, None
    except Http404 as e:
        raise HttpError(404, str(e))
