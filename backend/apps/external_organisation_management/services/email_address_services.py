import uuid
from typing import List, Optional, Dict, Any
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.conf import settings

from ..models import (
    ExternalOrganisation,
    ExternalOrganisationContact,
    EmailAddress,
)
from ..schemas import (
    EmailAddressSchemaIn,
)
from apps.optionlists.models import OptionListItem

# --- Email Address Services ---

def email_address_create(payload: EmailAddressSchemaIn, user: settings.AUTH_USER_MODEL) -> EmailAddress:
    if not payload.contact_id and not payload.organisation_id:
        raise ValueError("EmailAddress must be associated with a contact or an organisation.")
    if payload.contact_id and payload.organisation_id:
        raise ValueError("EmailAddress cannot be associated with both a contact and an organisation simultaneously.")

    email_data = payload.dict(exclude_unset=True)
    type_instance = get_object_or_404(OptionListItem, pk=payload.type_id)
    email_data['type'] = type_instance
    del email_data['type_id']

    if payload.contact_id:
        contact_instance = get_object_or_404(ExternalOrganisationContact, pk=payload.contact_id)
        email_data['contact'] = contact_instance
        del email_data['contact_id']
    
    if payload.organisation_id:
        organisation_instance = get_object_or_404(ExternalOrganisation, pk=payload.organisation_id)
        email_data['organisation'] = organisation_instance
        del email_data['organisation_id']

    email = EmailAddress(**email_data)
    email.save(user=user)
    # Re-fetch to ensure related fields are loaded for serialization
    return EmailAddress.objects.select_related('type', 'contact', 'organisation', 'created_by', 'updated_by').get(pk=email.id)

def email_address_get(email_address_id: uuid.UUID) -> EmailAddress:
    return get_object_or_404(EmailAddress, pk=email_address_id)

def email_address_list(filters: Optional[Dict[str, Any]] = None) -> List[EmailAddress]:
    filters = filters or {}
    return EmailAddress.objects.select_related('type', 'contact', 'organisation', 'created_by', 'updated_by').filter(**filters)

def email_address_update(email_address_id: uuid.UUID, payload: EmailAddressSchemaIn, user: settings.AUTH_USER_MODEL) -> EmailAddress:
    email_address = get_object_or_404(EmailAddress, pk=email_address_id)

    if payload.contact_id is not None and payload.organisation_id is not None:
        raise ValueError("EmailAddress cannot be associated with both a contact and an organisation simultaneously.")

    update_data = payload.dict(exclude_unset=True)

    if 'type_id' in update_data:
        type_instance = get_object_or_404(OptionListItem, pk=update_data.pop('type_id'))
        email_address.type = type_instance

    # Determine final state of associations based on explicit payload fields
    final_contact = email_address.contact
    final_organisation = email_address.organisation

    if 'contact_id' in update_data:  # If contact_id was explicitly in the request
        contact_id_val = update_data.pop('contact_id')
        if contact_id_val is None:
            final_contact = None
        else:
            final_contact = get_object_or_404(ExternalOrganisationContact, pk=contact_id_val)
            final_organisation = None  # If setting/changing contact, ensure organisation is cleared

    if 'organisation_id' in update_data:  # If organisation_id was explicitly in the request
        organisation_id_val = update_data.pop('organisation_id')
        if organisation_id_val is None:
            final_organisation = None
        else:
            final_organisation = get_object_or_404(ExternalOrganisation, pk=organisation_id_val)
            final_contact = None # If setting/changing organisation, ensure contact is cleared
            
    if final_contact is None and final_organisation is None:
        # This ensures an email address always has an association
        raise ValueError("EmailAddress must be associated with a contact or an organisation.")

    email_address.contact = final_contact
    email_address.organisation = final_organisation

    for key, value in update_data.items():
        setattr(email_address, key, value)
    
    email_address.save(user=user)
    return EmailAddress.objects.select_related('type', 'contact', 'organisation', 'created_by', 'updated_by').get(pk=email_address.id)

def email_address_delete(email_address_id: uuid.UUID, user: settings.AUTH_USER_MODEL) -> None:
    email_address = get_object_or_404(EmailAddress, pk=email_address_id)
    email_address.delete(user=user)
