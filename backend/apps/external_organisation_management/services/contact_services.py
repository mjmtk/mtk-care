import uuid
from typing import List, Optional, Dict, Any
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db import transaction # Added transaction as it was in the original file's contact services part
from django.conf import settings

from ..models import (
    ExternalOrganisation,
    ExternalOrganisationContact,
)
from ..schemas import (
    ExternalOrganisationContactSchemaIn,
)

# --- External Organisation Contact Services ---

def external_organisation_contact_create(payload: ExternalOrganisationContactSchemaIn, user: settings.AUTH_USER_MODEL) -> ExternalOrganisationContact:
    contact_data = payload.dict(exclude_unset=True)
    organisation_instance = get_object_or_404(ExternalOrganisation, pk=payload.organisation_id)
    contact_data['organisation'] = organisation_instance
    del contact_data['organisation_id']
    
    contact = ExternalOrganisationContact(**contact_data)
    contact.save(user=user)
    return ExternalOrganisationContact.objects.select_related('created_by', 'updated_by', 'organisation').get(pk=contact.id)

def external_organisation_contact_get(contact_id: uuid.UUID) -> ExternalOrganisationContact:
    return get_object_or_404(ExternalOrganisationContact, pk=contact_id)

def external_organisation_contact_list(filters: Optional[Dict[str, Any]] = None) -> List[ExternalOrganisationContact]:
    filters = filters or {}
    return ExternalOrganisationContact.objects.filter(**filters).select_related('created_by', 'updated_by', 'organisation')

def external_organisation_contact_update(contact_id: uuid.UUID, payload: ExternalOrganisationContactSchemaIn, user: settings.AUTH_USER_MODEL) -> ExternalOrganisationContact:
    contact = get_object_or_404(ExternalOrganisationContact, pk=contact_id)
    update_data = payload.dict(exclude_unset=True)

    if 'organisation_id' in update_data:
        organisation_instance = get_object_or_404(ExternalOrganisation, pk=update_data.pop('organisation_id'))
        contact.organisation = organisation_instance

    for key, value in update_data.items():
        setattr(contact, key, value)
    
    contact.save(user=user)
    return ExternalOrganisationContact.objects.select_related('created_by', 'updated_by', 'organisation').get(pk=contact.id)

def external_organisation_contact_delete(contact_id: uuid.UUID, user: settings.AUTH_USER_MODEL) -> None:
    contact = get_object_or_404(ExternalOrganisationContact, pk=contact_id)
    contact.delete(user=user)
