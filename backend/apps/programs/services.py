from typing import List, Optional, Union
from uuid import UUID
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import ServiceProgram, ServiceAssignedStaff, Enrolment
from apps.optionlists.models import OptionListItem
from .schemas import (
    ServiceProgramIn, ServiceProgramOut, 
    ServiceAssignedStaffIn, ServiceAssignedStaffOut,
    EnrolmentIn, EnrolmentOut, EnrolmentUpdateIn,
    SimpleOptionListItemOut, BatchOptionListsOut
)
from apps.client_management.models import Client # Assuming Client model location

User = get_user_model()

class ServiceProgramService:
    @staticmethod
    @transaction.atomic
    def create_service_program(data: ServiceProgramIn, user_id: Union[UUID, int]) -> ServiceProgram:
        """
        Creates a new ServiceProgram along with its M2M relationships and staff assignments.
        """
        program_data = data.dict(exclude={'service_types', 'delivery_modes', 'locations', 'funding_agencies', 'cultural_groups', 'staff_input'})
        
        # Ensure user_id is a User instance for ForeignKey fields
        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            # Handle case where user_id is invalid, perhaps raise an error or handle as per app logic
            # For now, we'll assume user_id is valid or this will raise an exception upstream.
            # Consider how to handle this if user_id might not exist in a real scenario.
            raise ValueError(f"User with ID {user_id} not found.")

        service_program = ServiceProgram.objects.create(
            **program_data,
            created_by=user,
            updated_by=user
        )

        # Handle M2M relationships
        if data.service_types:
            service_program.service_types.set(data.service_types)
        if data.delivery_modes:
            service_program.delivery_modes.set(data.delivery_modes)
        if data.locations:
            service_program.locations.set(data.locations)
        if data.funding_agencies:
            service_program.funding_agencies.set(data.funding_agencies)
        if data.cultural_groups:
            service_program.cultural_groups.set(data.cultural_groups)

        # Handle staff assignments
        if data.staff_input:
            for staff_data in data.staff_input:
                ServiceAssignedStaff.objects.create(
                    service_program=service_program,
                    staff_id=staff_data.staff_id,
                    role=staff_data.role,
                    fte=staff_data.fte,
                    is_responsible=staff_data.is_responsible,
                    start_date=staff_data.start_date or service_program.start_date,
                    end_date=staff_data.end_date or service_program.end_date,
                    created_by=user,
                    updated_by=user
                )
        
        return service_program

    @staticmethod
    def get_service_program(program_id: UUID) -> Optional[ServiceProgram]:
        """
        Retrieves a single ServiceProgram by its ID.
        Returns None if not found (Ninja will handle 404 if used in an endpoint).
        """
        try:
            return ServiceProgram.objects.prefetch_related(
                'service_types', 
                'delivery_modes', 
                'locations', 
                'funding_agencies', 
                'cultural_groups', 
                'staff' # Use the new related_name
            ).get(id=program_id)
        except ServiceProgram.DoesNotExist:
            return None

    @staticmethod
    def list_service_programs() -> List[ServiceProgram]:
        """
        Retrieves a list of all ServicePrograms with prefetched related data.
        """
        return ServiceProgram.objects.prefetch_related(
            'service_types', 
            'delivery_modes', 
            'locations', 
            'funding_agencies', 
            'cultural_groups', 
            'staff'
        ).all()

    @staticmethod
    @transaction.atomic
    def update_service_program(program_id: UUID, data: ServiceProgramIn, user_id: Union[UUID, int]) -> ServiceProgram:
        """
        Updates an existing ServiceProgram.
        """
        service_program = ServiceProgramService.get_service_program(program_id)
        if not service_program:
            # This case should ideally be handled by the API layer returning a 404
            # Or raise a specific exception here if preferred.
            return None # Or raise an exception e.g. ServiceProgram.DoesNotExist

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise ValueError(f"User with ID {user_id} not found.")

        # Update direct fields from data if they are provided
        program_update_data = data.dict(exclude_unset=True, exclude={'service_types', 'delivery_modes', 'locations', 'funding_agencies', 'cultural_groups', 'staff_input'})        
        for key, value in program_update_data.items():
            setattr(service_program, key, value)
        
        service_program.updated_by = user
        service_program.save()

        # Update M2M relationships - `set` handles clearing old and adding new
        if data.service_types is not None: # Check if field was provided in input
            service_program.service_types.set(data.service_types)
        if data.delivery_modes is not None:
            service_program.delivery_modes.set(data.delivery_modes)
        if data.locations is not None:
            service_program.locations.set(data.locations)
        if data.funding_agencies is not None:
            service_program.funding_agencies.set(data.funding_agencies)
        if data.cultural_groups is not None:
            service_program.cultural_groups.set(data.cultural_groups)

        # Re-sync staff assignments (delete old, create new based on input)
        if data.staff_input is not None: # Check if staff_input was provided
            ServiceAssignedStaff.objects.filter(service_program=service_program).delete()
            for staff_data in data.staff_input:
                ServiceAssignedStaff.objects.create(
                    service_program=service_program,
                    staff_id=staff_data.staff_id,
                    role=staff_data.role,
                    fte=staff_data.fte,
                    is_responsible=staff_data.is_responsible,
                    start_date=staff_data.start_date or service_program.start_date,
                    end_date=staff_data.end_date or service_program.end_date,
                    created_by=user, # Staff assignments are new, so user is creator
                    updated_by=user
                )
        
        # Re-fetch to get all prefetched data correctly after updates
        return ServiceProgramService.get_service_program(program_id)

    @staticmethod
    @transaction.atomic
    def delete_service_program(program_id: UUID, user_id: Union[UUID, int]) -> bool:
        """
        Soft deletes a ServiceProgram.
        Returns True if deletion was successful, False otherwise.
        """
        service_program = ServiceProgramService.get_service_program(program_id)
        if not service_program or service_program.is_deleted:
            # Already deleted or not found
            return False

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            # Invalid user, cannot attribute deletion
            raise ValueError(f"User with ID {user_id} not found for deletion operation.")

        service_program.is_deleted = True
        service_program.deleted_at = timezone.now()
        service_program.deleted_by = user
        service_program.updated_by = user # Ensure updated_by is also set
        service_program.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'updated_by'])
        return True


class EnrolmentService:
    @staticmethod
    @transaction.atomic
    def create_enrolment(data: EnrolmentIn, user_id: Union[UUID, int]) -> Enrolment:
        """
        Creates a new Enrolment.
        """
        client = get_object_or_404(Client, pk=data.client_id, is_deleted=False)
        service_program = get_object_or_404(ServiceProgram, pk=data.service_program_id, is_deleted=False)
        
        exit_reason_obj = None
        if data.exit_reason_id:
            # Assuming 'service_management-exit-reasons' is the correct slug for the OptionList
            exit_reason_obj = get_object_or_404(OptionListItem, pk=data.exit_reason_id, option_list__slug='service_management-exit-reasons')

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise ValueError(f"User with ID {user_id} not found.")

        # Prepare data for Enrolment creation, excluding FK IDs that will be passed as objects
        enrolment_create_data = data.dict(exclude={'client_id', 'service_program_id', 'exit_reason_id', 'status'}, exclude_none=True)

        # Fetch status OptionListItem
        status_obj = get_object_or_404(OptionListItem, slug=data.status, option_list__slug='enrolment-status')

        enrolment = Enrolment.objects.create(
            client=client,
            service_program=service_program,
            status=status_obj, # Assign status object
            exit_reason=exit_reason_obj,
            **enrolment_create_data,
            created_by=user,
            updated_by=user
        )
        return enrolment

    @staticmethod
    def get_enrolment(enrolment_id: UUID) -> Optional[Enrolment]:
        """
        Retrieves a single Enrolment by its ID.
        Returns None if not found.
        """
        try:
            # Prefetch related OptionListItem for exit_reason to avoid extra query later if needed by EnrolmentOut schema
            return Enrolment.objects.select_related('client', 'service_program', 'exit_reason').get(id=enrolment_id)
        except Enrolment.DoesNotExist:
            return None

    @staticmethod
    def list_enrolments() -> List[Enrolment]:
        """
        Retrieves a list of all Enrolments with selected related data.
        """
        return Enrolment.objects.select_related('client', 'service_program', 'exit_reason').all()

    @staticmethod
    @transaction.atomic
    def update_enrolment(enrolment_id: UUID, data: EnrolmentUpdateIn, user_id: Union[UUID, int]) -> Enrolment:
        """
        Updates an existing Enrolment.
        """
        enrolment = EnrolmentService.get_enrolment(enrolment_id)
        if not enrolment:
            return None # Or raise exception

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise ValueError(f"User with ID {user_id} not found.")

        # Update direct fields and FKs from data if they are provided
        update_fields_data = data.dict(exclude_unset=True)
        
        # Handle FKs separately if their IDs are in the input
        if 'client_id' in update_fields_data:
            client = get_object_or_404(Client, pk=update_fields_data.pop('client_id'), is_deleted=False)
            enrolment.client = client
        
        if 'service_program_id' in update_fields_data:
            service_program = get_object_or_404(ServiceProgram, pk=update_fields_data.pop('service_program_id'), is_deleted=False)
            enrolment.service_program = service_program

        if 'status' in update_fields_data: # Handle status slug
            status_slug = update_fields_data.pop('status')
            if status_slug:
                status_obj = get_object_or_404(OptionListItem, slug=status_slug, option_list__slug='enrolment-status')
                enrolment.status = status_obj
            # else: if status_slug is None/empty, what should happen? Maybe nothing, or disallow unsetting status without explicit logic.

        if 'exit_reason_id' in update_fields_data:
            exit_reason_id_val = update_fields_data.pop('exit_reason_id')
            if exit_reason_id_val is not None:
                exit_reason_obj = get_object_or_404(OptionListItem, pk=exit_reason_id_val, option_list__slug='service_management-exit-reasons')
                enrolment.exit_reason = exit_reason_obj
            else:
                enrolment.exit_reason = None # Allow unsetting exit reason

        for key, value in update_fields_data.items():
            setattr(enrolment, key, value)
        
        enrolment.updated_by = user
        enrolment.save()
        
        # Re-fetch to get all select_related data correctly after updates
        return EnrolmentService.get_enrolment(enrolment_id)

    @staticmethod
    @transaction.atomic
    def delete_enrolment(enrolment_id: UUID, user_id: Union[UUID, int]) -> bool:
        """
        Soft deletes an Enrolment.
        Returns True if deletion was successful, False otherwise.
        """
        enrolment = EnrolmentService.get_enrolment(enrolment_id)
        if not enrolment or enrolment.is_deleted:
            return False # Already deleted or not found

        try:
            user = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            raise ValueError(f"User with ID {user_id} not found for deletion operation.")

        enrolment.is_deleted = True
        enrolment.deleted_at = timezone.now()
        enrolment.deleted_by = user
        enrolment.updated_by = user # Ensure updated_by is also set
        enrolment.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by', 'updated_by'])
        return True


class ServiceManagementOptionListService:
    @staticmethod
    def get_batch_option_lists() -> dict: # Maps to BatchOptionListsOut schema
        """
        Retrieves a batch of option lists defined in BatchOptionListsOut.
        Ensures all keys from BatchOptionListsOut are present in the response.
        """
        # Define the mapping from BatchOptionListsOut field names to OptionList slugs
        # These slugs must exist in the OptionList table.
        slug_map = {
            'service_types': 'service_management-service_types',
            'delivery_modes': 'service_management-delivery_modes',
            'locations': 'service_management-locations', # Ensure this slug exists for location options
        }

        result = {}
        for field_name, slug in slug_map.items():
            items = list(OptionListItem.objects.filter(
                option_list__slug=slug, 
                is_active=True
            ).values('id', 'name', 'slug')) # Fetch 'slug' as it's used by SimpleOptionListItemOut
            result[field_name] = items

        return result
