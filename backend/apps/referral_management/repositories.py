from django.db.models import Q, Count, F, Prefetch, QuerySet
from django.contrib.auth import get_user_model
User = get_user_model()
from django.utils import timezone
from datetime import timedelta
from typing import Optional, Any, Dict, Union
import uuid

from .models import (
    Referral,
)
from apps.optionlists.models import OptionListItem


class ServiceTypeRepository:
    """
    Repository for accessing service type OptionListItems.
    """
    SERVICE_TYPE_SLUG = 'referral-service-types'

    @staticmethod
    def get_all_service_types():
        return OptionListItem.objects.filter(option_list__slug=ServiceTypeRepository.SERVICE_TYPE_SLUG, is_active=True)

    @staticmethod
    def get_service_type_by_id(service_type_id):
        return OptionListItem.objects.get(id=service_type_id, option_list__slug=ServiceTypeRepository.SERVICE_TYPE_SLUG)



class ReferralRepository:
    """
    Repository class for handling complex queries related to Referrals.
    This separates data access logic from business logic.
    """
    
    @staticmethod
    def get_all_referrals(
        filters: Optional[dict[str, Any]] = None,
        search_term: Optional[str] = None,
        order_by: Optional[str] = None
    ) -> 'QuerySet[Referral]':
        """
        Get all referrals with optional filtering, searching, and ordering.
        
        Args:
            filters (dict): Dictionary of filter parameters
            search_term (str): Search term to filter by
            order_by (str): Field to order by
            
        Returns:
            QuerySet: Filtered, searched, and ordered queryset of Referrals
        """
        queryset = Referral.objects.select_related(
            'status', 'type', 'service_type'
        )
        
        # Apply filters
        if filters:
            queryset = queryset.filter(**filters)
        
        # Apply search
        if search_term:
            queryset = queryset.filter(
                Q(reason__icontains=search_term) |
                Q(notes__icontains=search_term)
                # Client search temporarily disabled until client_management is implemented
                # Q(client__first_name__icontains=search_term) |
                # Q(client__last_name__icontains=search_term) |
                # Q(client__email__icontains=search_term)
            )
        
        # Apply ordering
        if order_by:
            queryset = queryset.order_by(order_by)
        else:
            queryset = queryset.order_by('-referral_date')
        
        return queryset
    
    @staticmethod
    def get_referral_by_id(referral_id: Union[int, str, uuid.UUID]) -> Referral:
        """
        Get a specific referral by ID with all related objects.
        
        Args:
            referral_id: The ID of the referral to retrieve
            
        Returns:
            Referral: The requested referral with all related objects
        """
        return Referral.objects.select_related( # type: ignore
            'status', 'type', 'service_type', 'client'
        ).get(id=referral_id)
    
    @staticmethod
    def create_referral(data: dict[str, Any], created_by_user: User) -> Referral:
        """
        Create a new referral.
        
        Args:
            data (dict): The data for the new referral, potentially with FKs as IDs.
            created_by_user (User): The user instance creating the referral.
        
        Returns:
            Referral: The newly created referral.
        """
        # Ensure audit fields are set with the User instance
        data['created_by'] = created_by_user
        data['updated_by'] = created_by_user # For creation, creator is also updater

        # Ensure foreign key fields are model instances if they are passed as IDs
        # Django's Model.objects.create() can often handle FKs if passed as IDs,
        # but explicit conversion can be safer depending on model/serializer setup.
        # For now, assuming validated_data from serializer provides IDs that Django can handle.

        return Referral.objects.create(**data)
    
    @staticmethod
    def update_referral(referral: Referral, updated_by_user: User) -> Referral:
        """
        Update an existing referral, setting the audit field and saving.
        Assumes the 'referral' instance has already been updated with other data by the service layer.

        Args:
            referral (Referral): The referral instance with updated data fields.
            updated_by_user (User): The user performing the update.

        Returns:
            Referral: The updated and saved referral.
        """
        referral.updated_by = updated_by_user
        referral.save() # Saves all changes made to the referral instance
        return referral
    
    @staticmethod
    def update_referral_status(referral, new_status, updated_by_user: User):
        """
        Update the status of a referral and handle related date fields.
        
        Args:
            referral (Referral): The referral to update
            new_status: The new status (OptionListItem or similar)
            updated_by_user (User): The user performing the update
        
        Returns:
            Referral: The updated referral
        """
        referral.status = new_status
        referral.updated_by = updated_by_user
        referral.save()
        return referral
    
    @staticmethod
    def get_referrals_by_client_name(client_name):
        """
        Get all referrals for a specific client name.
        
        Args:
            client_name (str): The name of the client
            
        Returns:
            QuerySet: Referrals for the specified client name
        """
        return Referral.objects.filter(
            # Search only in client relationship fields
            
            Q(client__first_name__icontains=client_name) |
            Q(client__last_name__icontains=client_name)
        ).select_related(
            'status', 'type', 'service_type', 'client'
        )
        
    @staticmethod
    def get_referrals_by_client_id(client_id):
        """
        Get all referrals for a specific client ID.
        
        Args:
            client_id (int): The ID of the client
            
        Returns:
            QuerySet: Referrals for the specified client ID
        """
        return Referral.objects.filter(client_id=client_id).select_related(
            'status', 'type', 'client'
        ).order_by('-referral_date')
    
    @staticmethod
    def get_all_statuses():
        from apps.optionlists.models import OptionList, OptionListItem
        try:
            status_list = OptionList.objects.get(slug="referral-statuses")
            return OptionListItem.objects.filter(option_list=status_list)
        except OptionList.DoesNotExist:
            return OptionListItem.objects.none()

        """
        Get all referrals with status OptionListItem for 'pending'.
        Returns:
            QuerySet: All pending referrals
        """
        return Referral.objects.filter(
            status__option_list__slug='referral-statuses',
            status__value='pending'
        ).select_related(
            'status', 'type', 'client'
        ).order_by('-referral_date')

    @staticmethod
    def get_overdue_referrals(days=7):
        """
        Get referrals that have been pending for more than the specified number of days.
        Args:
            days (int): Number of days to consider a referral overdue
        Returns:
            QuerySet: All overdue referrals
        """
        cutoff_date = timezone.now().date() - timedelta(days=days)
        return Referral.objects.filter(
            status__option_list__slug='referral-statuses',
            status__value='pending',
            referral_date__lt=cutoff_date
        ).select_related(
            'status', 'type', 'client'
        ).order_by('referral_date')

    @staticmethod
    def get_referrals_by_service_type(service_type_id):
        """
        Get all referrals for a specific service type OptionListItem.
        Args:
            service_type_id (UUID): The ID of the OptionListItem for service type
        Returns:
            QuerySet: Referrals for the specified service type
        """
        return Referral.objects.filter(
            type__option_list__slug='service-types',
            type__id=service_type_id
        ).select_related(
            'status', 'type', 'client'
        ).order_by('-referral_date')
