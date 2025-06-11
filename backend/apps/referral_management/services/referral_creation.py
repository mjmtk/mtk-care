from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework.exceptions import ValidationError
from django.db import transaction

from apps.optionlists.models import OptionListItem
from ..models import Referral, ConsentRecord
from ..repositories import ReferralRepository
from apps.client_management.models import Client, ClientEmergencyContact

class ReferralCreationService:
    """
    Service for handling referral creation business logic and validation.
    """
    ACTIVE_STATUS_SLUGS = ['pending', 'in-progress']
    INCOMING_TYPE_VALUE = 'incoming'  # String value instead of slug

    @classmethod
    def validate_referral_data(cls, data):
        # Validate dates
        if 'follow_up_date' in data and data['follow_up_date'] and 'referral_date' in data:
            if data['follow_up_date'] < data['referral_date']:
                raise ValidationError({
                    'follow_up_date': _('Follow-up date cannot be before referral date')
                })
        # Validate referral type choices
        if 'type' in data:
            if data['type'] not in ['incoming', 'outgoing']:
                raise ValidationError({
                    'type': _('Invalid referral type. Must be "incoming" or "outgoing".')
                })
        
        # Only one active incoming referral per client (if client is provided)
        client_id = data.get('client_id')
        referral_type = data.get('type')
        status_id = data.get('status_id')
        
        if client_id and referral_type and status_id:
            # Get the status to check its slug
            from apps.optionlists.models import OptionListItem
            try:
                status = OptionListItem.objects.get(id=status_id)
                if referral_type == cls.INCOMING_TYPE_VALUE and status.slug in cls.ACTIVE_STATUS_SLUGS:
                    existing_active = Referral.objects.filter(
                        client_id=client_id,
                        type=cls.INCOMING_TYPE_VALUE,
                        status__slug__in=cls.ACTIVE_STATUS_SLUGS
                    ).exists()
                    if existing_active:
                        raise ValidationError({'client': [_('An active incoming referral already exists for this client.')]})
            except OptionListItem.DoesNotExist:
                # If status doesn't exist, we'll let the normal validation handle it
                pass

    @classmethod
    @transaction.atomic
    def create_referral(cls, data, created_by_user: User):
        cls.validate_referral_data(data)
        
        # Handle client creation/update with new fields
        client = None
        client_type = data.get('client_type', 'new')
        
        if client_type == 'existing' and data.get('client_id'):
            try:
                client = Client.objects.get(id=data['client_id'])
                # Update client with any new information
                cls._update_client_data(client, data, created_by_user)
            except Client.DoesNotExist:
                raise ValidationError({'client_id': _('Client not found')})
        elif client_type == 'new':
            # Create new client with enhanced data
            client = cls._create_client_from_referral_data(data, created_by_user)
            data['client_id'] = client.id
        
        # Create the referral
        referral = ReferralRepository.create_referral(data, created_by_user)
        
        # Handle emergency contacts
        emergency_contacts = data.get('emergency_contacts', [])
        if emergency_contacts and client:
            cls._create_emergency_contacts(client, emergency_contacts, created_by_user)
        
        # Handle consent records
        consent_records = data.get('consent_records', [])
        if consent_records:
            cls._create_consent_records(referral, consent_records, created_by_user)
        
        return referral
    
    @classmethod
    def _create_client_from_referral_data(cls, data, created_by_user: User):
        """Create a new client from referral form data."""
        from apps.client_management.services import ClientService
        
        client_data = {
            'first_name': data.get('first_name', ''),
            'last_name': data.get('last_name', ''),
            'date_of_birth': data.get('date_of_birth'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'gender_id': data.get('gender_id'),
            'primary_language_id': data.get('primary_language_id'),
            'interpreter_needed': data.get('interpreter_needed', False),
            'iwi_hapu_id': data.get('iwi_hapu_id'),
            'spiritual_needs_id': data.get('spiritual_needs_id'),
            'status_id': '1',  # Default to active status
            'cultural_identity': {
                'iwi_hapu_id': data.get('iwi_hapu_id'),
                'spiritual_needs_id': data.get('spiritual_needs_id'),
                'interpreter_needed': data.get('interpreter_needed', False)
            }
        }
        
        from apps.client_management.services import ClientService
        return ClientService.create_client(client_data, created_by_user)
    
    @classmethod
    def _update_client_data(cls, client, data, updated_by_user: User):
        """Update existing client with new data from referral form."""
        update_fields = ['email', 'phone', 'gender_id', 'primary_language_id', 
                        'interpreter_needed', 'iwi_hapu_id', 'spiritual_needs_id']
        
        updated = False
        for field in update_fields:
            if field in data and data[field] is not None:
                if getattr(client, field) != data[field]:
                    setattr(client, field, data[field])
                    updated = True
        
        if updated:
            client.updated_by = updated_by_user
            client.save()
    
    @classmethod
    def _create_emergency_contacts(cls, client, emergency_contacts_data, created_by_user: User):
        """Create emergency contacts for the client."""
        for contact_data in emergency_contacts_data:
            if contact_data.get('first_name') and contact_data.get('last_name'):
                ClientEmergencyContact.objects.create(
                    client=client,
                    relationship_id=contact_data.get('relationship_id'),
                    first_name=contact_data.get('first_name'),
                    last_name=contact_data.get('last_name'),
                    phone=contact_data.get('phone', ''),
                    email=contact_data.get('email'),
                    is_primary=contact_data.get('is_primary', False),
                    priority_order=contact_data.get('priority_order', 1),
                    created_by=created_by_user,
                    updated_by=created_by_user
                )
    
    @classmethod
    def _create_consent_records(cls, referral, consent_records_data, created_by_user: User):
        """Create consent records for the referral."""
        for consent_data in consent_records_data:
            if consent_data.get('consent_type_id'):
                ConsentRecord.objects.create(
                    referral=referral,
                    consent_type_id=consent_data.get('consent_type_id'),
                    status=consent_data.get('status', 'pending'),
                    consent_date=consent_data.get('consent_date'),
                    withdrawal_date=consent_data.get('withdrawal_date'),
                    expiry_date=consent_data.get('expiry_date'),
                    notes=consent_data.get('notes'),
                    document_id=consent_data.get('document_id'),
                    obtained_by=created_by_user if consent_data.get('status') == 'obtained' else None,
                    created_by=created_by_user,
                    updated_by=created_by_user
                )
