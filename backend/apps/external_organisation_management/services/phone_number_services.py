import uuid
from typing import List, Optional, Dict, Any
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.conf import settings

from ..models import (
    ExternalOrganisation,
    ExternalOrganisationContact,
    PhoneNumber,
)
from ..schemas import (
    PhoneNumberSchemaIn,
)
from apps.optionlists.models import OptionListItem

# --- Phone Number Services ---

def phone_number_create(payload: PhoneNumberSchemaIn, user: settings.AUTH_USER_MODEL) -> PhoneNumber:
    if not payload.contact_id and not payload.organisation_id:
        raise ValueError("PhoneNumber must be associated with a contact or an organisation.")
    if payload.contact_id and payload.organisation_id:
        raise ValueError("PhoneNumber cannot be associated with both a contact and an organisation simultaneously.")

    phone_data = payload.dict(exclude_unset=True)
    
    type_instance = get_object_or_404(OptionListItem, pk=payload.type_id)
    phone_data['type'] = type_instance
    del phone_data['type_id']

    if payload.contact_id:
        contact_instance = get_object_or_404(ExternalOrganisationContact, pk=payload.contact_id)
        phone_data['contact'] = contact_instance
        del phone_data['contact_id']
    
    if payload.organisation_id:
        organisation_instance = get_object_or_404(ExternalOrganisation, pk=payload.organisation_id)
        phone_data['organisation'] = organisation_instance
        del phone_data['organisation_id']

    phone = PhoneNumber(**phone_data)
    phone.save(user=user)
    return PhoneNumber.objects.select_related('type', 'created_by', 'updated_by', 'contact', 'organisation').get(pk=phone.id)

def phone_number_get(phone_number_id: uuid.UUID) -> PhoneNumber:
    return get_object_or_404(PhoneNumber, pk=phone_number_id)

def phone_number_list(filters: Optional[Dict[str, Any]] = None) -> List[PhoneNumber]:
    filters = filters or {}
    return PhoneNumber.objects.filter(**filters)

def phone_number_update(phone_number_id: uuid.UUID, payload: PhoneNumberSchemaIn, user: settings.AUTH_USER_MODEL) -> PhoneNumber:
    phone_number = get_object_or_404(PhoneNumber, pk=phone_number_id)

    if payload.contact_id is not None and payload.organisation_id is not None:
        raise ValueError("PhoneNumber cannot be associated with both a contact and an organisation simultaneously.")

    update_data = payload.dict(exclude_unset=True)

    if 'type_id' in update_data:
        type_instance = get_object_or_404(OptionListItem, pk=update_data.pop('type_id'))
        phone_number.type = type_instance

    final_contact = phone_number.contact
    final_organisation = phone_number.organisation

    if 'contact_id' in update_data:
        contact_id_val = update_data.pop('contact_id')
        if contact_id_val is None:
            final_contact = None
        else:
            final_contact = get_object_or_404(ExternalOrganisationContact, pk=contact_id_val)
            final_organisation = None

    if 'organisation_id' in update_data:
        organisation_id_val = update_data.pop('organisation_id')
        if organisation_id_val is None:
            final_organisation = None
        else:
            final_organisation = get_object_or_404(ExternalOrganisation, pk=organisation_id_val)
            final_contact = None 
    
    if final_contact is None and final_organisation is None:
        # This ensures a phone number always has an association
        raise ValueError("PhoneNumber must be associated with a contact or an organisation.")

    phone_number.contact = final_contact
    phone_number.organisation = final_organisation
    
    for key, value in update_data.items():
        setattr(phone_number, key, value)
    
    phone_number.save(user=user)
    return PhoneNumber.objects.select_related('type', 'created_by', 'updated_by', 'contact', 'organisation').get(pk=phone_number.id)

def phone_number_delete(phone_number_id: uuid.UUID, user: settings.AUTH_USER_MODEL) -> None:
    phone_number = get_object_or_404(PhoneNumber, pk=phone_number_id)
    phone_number.delete(user=user)
