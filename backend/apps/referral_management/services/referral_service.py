from django.db import transaction
from django.contrib.auth import get_user_model
User = get_user_model()
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import ValidationError
from django.db.models import QuerySet
from typing import Optional, Any, Union
import uuid

from ..repositories import ReferralRepository
from ..models import Referral

class ReferralService:
    """
    Service class for handling business logic related to Referrals.
    This separates business logic from data access and presentation layers.
    """
    @staticmethod
    def get_referrals(
        filters: Optional[dict[str, Any]] = None,
        search_term: Optional[str] = None,
        order_by: Optional[str] = None
    ) -> QuerySet:
        """
        Get referrals with filtering, searching, and ordering.
        """
        return ReferralRepository.get_all_referrals(filters, search_term, order_by)

    @staticmethod
    def get_referral(referral_id: Union[int, str, uuid.UUID]) -> Any:
        """
        Get a specific referral by ID.
        """
        return ReferralRepository.get_referral_by_id(referral_id)

    @staticmethod
    def get_referral_by_id(referral_id: Union[int, str, uuid.UUID]) -> Any:
        """
        Alias for get_referral for backward compatibility.
        """
        return ReferralService.get_referral(referral_id)

    @staticmethod
    def create_referral(data, created_by_user: User):
        """
        Create a new referral using ReferralCreationService (delegation for consistency).
        """
        from .referral_creation import ReferralCreationService
        return ReferralCreationService.create_referral(data, created_by_user)

    @staticmethod
    def update_referral_status(referral, status_id_or_item, updated_by_user: User):
        """
        Update the status of a referral. Accepts either an OptionListItem or its ID.
        """
        from apps.optionlists.models import OptionListItem
        # Accept either an OptionListItem or an ID
        if isinstance(status_id_or_item, OptionListItem):
            new_status = status_id_or_item
        else:
            try:
                new_status = OptionListItem.objects.get(id=status_id_or_item)
            except OptionListItem.DoesNotExist:
                raise ValidationError({"status": [_("Invalid status ID")]})
        return ReferralRepository.update_referral_status(referral, new_status, updated_by_user)

    @staticmethod
    def update_referral(referral: Referral, data: dict[str, Any], updated_by_user: User) -> Referral:
        """
        Update referral fields from data dict, handling OptionListItem fields,
        emergency contacts, consent records, and then delegate to repository for saving and audit trail.
        """
        from apps.optionlists.models import OptionListItem 
        from .referral_creation import ReferralCreationService

        # Extract related data that needs special handling
        consent_records_data = data.pop('consent_records', None)
        
        # Remove client-specific fields that should not be in referral data
        # These should be handled directly via client API endpoints
        client_fields_to_remove = [
            'emergency_contacts', 'iwi_hapu_id', 'spiritual_needs_id', 
            'primary_language_id', 'interpreter_needed', 'gender_id'
        ]
        for field_name in client_fields_to_remove:
            data.pop(field_name, None)

        optionlist_fields = ['status', 'priority', 'service_type']
        
        # Handle OptionListItem fields first (excluding 'type' which is now a string)
        for field_name in optionlist_fields:
            if field_name in data:
                item_id = data.pop(field_name) # Use pop to remove it from data dict
                if item_id is None:
                    # Don't allow required fields to be set to null
                    if field_name in ['status', 'priority']:
                        continue  # Skip this update
                    setattr(referral, field_name, None)
                else:
                    try:
                        item_instance = OptionListItem.objects.get(id=item_id)
                        setattr(referral, field_name, item_instance)
                    except OptionListItem.DoesNotExist:
                        raise ValidationError({field_name: _(f"Invalid {field_name} ID: {item_id}")})
                    except TypeError: # Handle cases where item_id might not be a valid UUID/PK type
                        raise ValidationError({field_name: _(f"Invalid ID format for {field_name}: {item_id}")})

        # Update other direct fields from the remaining data
        required_id_fields = ['status_id', 'priority_id']  # ID fields that cannot be null
        
        for field_name, value in data.items():
            if hasattr(referral, field_name):
                # Don't allow required ID fields to be set to null
                if field_name in required_id_fields and value is None:
                    continue  # Skip this update
                setattr(referral, field_name, value)
            # else: consider logging a warning for unexpected fields in data

        # Use transaction to ensure all updates happen atomically
        with transaction.atomic():
            # Delegate to repository to set updated_by and save
            updated_referral = ReferralRepository.update_referral(referral, updated_by_user)
            
            # Handle consent records if provided
            if consent_records_data is not None:
                import logging
                logger = logging.getLogger(__name__)
                logger.info(f"Processing consent records for referral {updated_referral.id}")
                logger.info(f"Consent records data: {consent_records_data}")
                
                # Use update_or_create to avoid unique constraint violations
                existing_consent_types = set()
                
                for consent_data in consent_records_data:
                    if consent_data.get('consent_type_id'):
                        consent_type_id = consent_data.get('consent_type_id')
                        existing_consent_types.add(consent_type_id)
                        
                        # Use get_or_create with atomic operation to handle race conditions
                        from ..models import ConsentRecord
                        
                        logger.info(f"Processing consent type {consent_type_id}")
                        
                        # Prepare the defaults for update/create
                        defaults = {
                            'status': consent_data.get('status', 'pending'),
                            'consent_date': consent_data.get('consent_date'),
                            'withdrawal_date': consent_data.get('withdrawal_date'),
                            'expiry_date': consent_data.get('expiry_date'),
                            'notes': consent_data.get('notes'),
                            'document_id': consent_data.get('document_id'),
                            'obtained_by': updated_by_user if consent_data.get('status') == 'obtained' else None,
                            'updated_by': updated_by_user,
                            'created_by': updated_by_user  # This will only be used if creating
                        }
                        
                        try:
                            # Use get_or_create for atomic operation
                            consent_record, created = ConsentRecord.objects.get_or_create(
                                referral=updated_referral,
                                consent_type_id=consent_type_id,
                                defaults=defaults
                            )
                            
                            if not created:
                                # Record existed, update it
                                for field, value in defaults.items():
                                    if field != 'created_by':  # Don't update created_by for existing records
                                        setattr(consent_record, field, value)
                                consent_record.save()
                                logger.info(f"Updated existing consent record for type {consent_type_id}")
                            else:
                                logger.info(f"Created new consent record for type {consent_type_id}")
                                
                        except Exception as e:
                            logger.error(f"Error processing consent record for type {consent_type_id}: {str(e)}")
                            # As a last resort, try to just update any existing record
                            try:
                                ConsentRecord.objects.filter(
                                    referral=updated_referral,
                                    consent_type_id=consent_type_id
                                ).update(**{k: v for k, v in defaults.items() if k != 'created_by'})
                                logger.info(f"Force updated consent record for type {consent_type_id}")
                            except Exception as e2:
                                logger.error(f"Final fallback failed for consent type {consent_type_id}: {str(e2)}")
                                raise
                
                # Remove consent records that are no longer needed
                updated_referral.consent_records.exclude(
                    consent_type_id__in=existing_consent_types
                ).delete()
            
            return updated_referral

    @staticmethod
    def get_referrals_by_client_id(client_id):
        """
        Get all referrals for a specific client ID.
        """
        return ReferralRepository.get_referrals_by_client_id(client_id)

    @staticmethod
    def get_referrals_by_client_name(client_name):
        """
        Get all referrals for a specific client name.
        """
        return ReferralRepository.get_referrals_by_client_name(client_name)

