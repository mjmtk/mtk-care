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
        and then delegate to repository for saving and audit trail.
        """
        from apps.optionlists.models import OptionListItem 

        optionlist_fields = ['type', 'status', 'priority', 'service_type']
        
        # Handle OptionListItem fields first
        for field_name in optionlist_fields:
            if field_name in data:
                item_id = data.pop(field_name) # Use pop to remove it from data dict
                if item_id is None:
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
        for field_name, value in data.items():
            if hasattr(referral, field_name):
                setattr(referral, field_name, value)
            # else: consider logging a warning for unexpected fields in data

        # Delegate to repository to set updated_by and save
        return ReferralRepository.update_referral(referral, updated_by_user)

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

