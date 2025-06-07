from typing import List, Optional
from uuid import UUID

from ninja import Router
from django.contrib.auth import get_user_model
from ninja.errors import HttpError

# Schemas
from .schemas import (
    ServiceProgramIn, ServiceProgramOut,
    EnrolmentIn, EnrolmentOut,
    BatchOptionListsOut,
    # SimpleOptionListItemOut is implicitly used by ServiceProgramOut and BatchOptionListsOut
)
# Services
from .services import (
    ServiceProgramService,
    EnrolmentService,
    ServiceManagementOptionListService
)
# from apps.core.auth import AuthBearer # Placeholder for custom auth, if needed

User = get_user_model()

router = Router(tags=["Service Management"])

# --- Service Program Endpoints ---
@router.get(
    "/programs/",
    response=List[ServiceProgramOut],
    summary="List all Service Programs",
    description="Retrieve a list of all active service programs."
)
def list_service_programs_api(request):
    programs = ServiceProgramService.list_service_programs()
    return programs

@router.post(
    "/programs/",
    response={201: ServiceProgramOut},
    summary="Create a new Service Program",
    description="Create a new service program. `request.user` will be used as `created_by` and `updated_by`."
)
def create_service_program_api(request, payload: ServiceProgramIn):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    
    user_id = request.user.id
    try:
        program = ServiceProgramService.create_service_program(data=payload, user_id=user_id)
        return 201, program
    except ValueError as e:
        raise HttpError(400, str(e))
    except Exception as e: # Catch-all for unexpected errors
        # Log the error e
        raise HttpError(500, "An unexpected error occurred.")

@router.get(
    "/programs/{program_id}/",
    response=ServiceProgramOut,
    summary="Retrieve a specific Service Program",
    description="Retrieve a specific service program by its ID."
)
def retrieve_service_program_api(request, program_id: UUID):
    program = ServiceProgramService.get_service_program(program_id=program_id)
    if not program or program.is_deleted:
        raise HttpError(404, "Service program not found.")
    return program

@router.put(
    "/programs/{program_id}/",
    response=ServiceProgramOut,
    summary="Update a Service Program",
    description="Update an existing service program. `request.user` will be used as `updated_by`."
)
def update_service_program_api(request, program_id: UUID, payload: ServiceProgramIn):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    
    user_id = request.user.id
    try:
        updated_program = ServiceProgramService.update_service_program(
            program_id=program_id,
            data=payload,
            user_id=user_id
        )
        if not updated_program:
             raise HttpError(404, "Service program not found for update.")
        return updated_program
    except ValueError as e:
        raise HttpError(400, str(e))
    except Exception as e: # Catch-all for unexpected errors
        # Log the error e
        raise HttpError(500, "An unexpected error occurred.")

@router.delete(
    "/programs/{program_id}/",
    response={204: None},
    summary="Delete a Service Program",
    description="Soft delete a service program. `request.user` will be used as `deleted_by`."
)
def delete_service_program_api(request, program_id: UUID):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
        
    user_id = request.user.id
    try:
        success = ServiceProgramService.delete_service_program(program_id=program_id, user_id=user_id)
        if not success:
            raise HttpError(404, "Service program not found or already deleted.")
        return 204, None
    except ValueError as e:
        raise HttpError(400, str(e))
    except Exception as e: # Catch-all for unexpected errors
        # Log the error e
        raise HttpError(500, "An unexpected error occurred.")

# --- Enrolment Endpoints ---
@router.post(
    "/enrolments/",
    response={201: EnrolmentOut},
    summary="Create a new Enrolment",
    description="Create a new client enrolment in a service program."
)
def create_enrolment_api(request, payload: EnrolmentIn):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    user_id = request.user.id
    try:
        enrolment = EnrolmentService.create_enrolment(data=payload, user_id=user_id)
        return 201, enrolment
    except ValueError as e:
        raise HttpError(400, str(e))
    except Exception as e:
        raise HttpError(500, "An unexpected error occurred.")

@router.get(
    "/enrolments/",
    response=List[EnrolmentOut],
    summary="List all Enrolments",
    description="Retrieve a list of all enrolments. Filtering can be added later."
)
def list_enrolments_api(request):
    # Add filtering query params later if needed (e.g., client_id, program_id)
    enrolments = EnrolmentService.list_enrolments()
    return enrolments

@router.get(
    "/enrolments/{enrolment_id}/",
    response=EnrolmentOut,
    summary="Retrieve a specific Enrolment",
    description="Retrieve details of a specific enrolment by its ID."
)
def retrieve_enrolment_api(request, enrolment_id: UUID):
    enrolment = EnrolmentService.get_enrolment(enrolment_id=enrolment_id)
    if not enrolment or enrolment.is_deleted:
        raise HttpError(404, "Enrolment not found.")
    return enrolment

@router.put(
    "/enrolments/{enrolment_id}/",
    response=EnrolmentOut,
    summary="Update an Enrolment",
    description="Update an existing enrolment. `request.user` will be used as `updated_by`."
)
def update_enrolment_api(request, enrolment_id: UUID, payload: EnrolmentIn):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    user_id = request.user.id
    try:
        updated_enrolment = EnrolmentService.update_enrolment(
            enrolment_id=enrolment_id,
            data=payload,
            user_id=user_id
        )
        if not updated_enrolment:
            raise HttpError(404, "Enrolment not found for update.")
        return updated_enrolment
    except ValueError as e:
        raise HttpError(400, str(e))
    except Exception as e:
        raise HttpError(500, "An unexpected error occurred.")

@router.delete(
    "/enrolments/{enrolment_id}/",
    response={204: None},
    summary="Delete an Enrolment",
    description="Soft delete an enrolment. `request.user` will be used as `deleted_by`."
)
def delete_enrolment_api(request, enrolment_id: UUID):
    if not hasattr(request, 'user') or not request.user.is_authenticated:
        raise HttpError(401, "Authentication required.")
    user_id = request.user.id
    try:
        success = EnrolmentService.delete_enrolment(enrolment_id=enrolment_id, user_id=user_id)
        if not success:
            raise HttpError(404, "Enrolment not found or already deleted.")
        return 204, None
    except ValueError as e:
        raise HttpError(400, str(e))
    except Exception as e:
        raise HttpError(500, "An unexpected error occurred.")

# --- Option List Endpoints ---
@router.get(
    "/options/batch/",
    response=BatchOptionListsOut,
    summary="Get Batch Option Lists for Service Management",
    description="Retrieves a batch of option lists (e.g., service types, delivery modes) for UI dropdowns."
)
def get_batch_options_api(request):
    # The service returns a dict, Ninja will serialize it using BatchOptionListsOut
    options = ServiceManagementOptionListService.get_batch_option_lists()
    return options


# Keep this if it's used elsewhere in the project to register the router
def get_service_management_router():
    return router
