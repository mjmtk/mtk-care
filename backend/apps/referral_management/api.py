from django.http import HttpRequest
from django.shortcuts import get_object_or_404
from ninja import Router
from typing import List, Optional
from uuid import UUID

from .models import Referral
from .schemas import (
    ReferralSchemaIn, 
    ReferralUpdateSchemaIn,
    ReferralSchemaOut, 
    ReferralBatchDropdownsSchemaOut,
    ReferralStatusUpdateSchemaIn,
    OptionListItemSchemaOut,
    ReferralListResponse,
    ProgramFormSchemaOut
)
from .services.referral_service import ReferralService
from apps.optionlists.services import OptionListService
from apps.authentication.decorators import auth_required

router = Router()

@router.get("/", response=ReferralListResponse, auth=auth_required)
def list_referrals(request: HttpRequest, page: int = 1, limit: int = 20, 
                  status: Optional[str] = None, priority: Optional[str] = None, 
                  client_type: Optional[str] = None):
    """List all referrals with pagination and optional filtering."""
    queryset = Referral.objects.select_related(
        'status', 'priority', 'service_type', 'client',
        'external_organisation', 'created_by', 'updated_by'
    ).all()
    
    # Apply filters if provided
    if status:
        queryset = queryset.filter(status__slug=status)
    if priority:
        queryset = queryset.filter(priority__slug=priority)
    if client_type:
        queryset = queryset.filter(client_type=client_type)
    
    # Calculate pagination
    total = queryset.count()
    offset = (page - 1) * limit
    items = list(queryset[offset:offset + limit])
    total_pages = (total + limit - 1) // limit  # Ceiling division
    
    return {
        'items': items,
        'total': total,
        'page': page,
        'limit': limit,
        'total_pages': total_pages
    }

@router.post("/", response=ReferralSchemaOut, auth=auth_required)
def create_referral(request: HttpRequest, payload: ReferralSchemaIn):
    """Create a new referral."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Get the authenticated user or create a default user for testing
    user = request.user
    if not user or user.is_anonymous:
        # For development/testing - get or create a default user
        user, created = User.objects.get_or_create(
            username='test.user@example.com',
            defaults={
                'email': 'test.user@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'is_active': True
            }
        )
    
    try:
        referral = ReferralService.create_referral(payload.dict(), user)
        
        # Refresh from database to ensure all relations are properly loaded
        referral.refresh_from_db()
        
        return referral
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating referral: {e}")
        logger.error(f"Payload data: {payload.dict()}")
        raise

@router.get("/batch-dropdowns", response=ReferralBatchDropdownsSchemaOut, auth=auth_required)
def get_batch_dropdowns(request: HttpRequest):
    """Get all dropdown options needed for referral forms."""
    # Hardcoded referral types instead of using optionlists
    referral_types = [
        {"value": "incoming", "label": "Incoming"},
        {"value": "outgoing", "label": "Outgoing"}
    ]
    
    # Hardcoded referral sources based on model choices
    referral_sources = [
        {"value": "external_agency", "label": "External Agency"},
        {"value": "school", "label": "School"},
        {"value": "self_referral", "label": "Self-Referral"},
        {"value": "internal", "label": "Internal Transfer"},
        {"value": "family", "label": "Family/Whānau"},
        {"value": "other", "label": "Other"}
    ]
    
    # Get active programs for program selection
    from apps.programs.models import Program
    programs = Program.objects.filter(
        status__in=['operational', 'inactive'],
        is_deleted=False
    ).only('id', 'name', 'status')
    
    return {
        "referral_types": referral_types,
        "referral_sources": referral_sources,
        "referral_statuses": OptionListService.get_active_items_for_list_slug('referral-statuses'),
        "referral_priorities": OptionListService.get_active_items_for_list_slug('referral-priorities'),
        "referral_service_types": OptionListService.get_active_items_for_list_slug('referral-service-types'),
        "programs": [{"id": p.id, "name": p.name, "status": p.status} for p in programs]
    }

@router.get("/{referral_id}", response=ReferralSchemaOut, auth=auth_required)
def get_referral(request: HttpRequest, referral_id: UUID):
    """Get a specific referral by ID."""
    referral = get_object_or_404(
        Referral.objects.select_related(
            'status', 'priority', 'service_type', 'client',
            'external_organisation', 'created_by', 'updated_by'
        ), 
        id=referral_id
    )
    return referral

@router.put("/{referral_id}", response=ReferralSchemaOut, auth=auth_required)
def update_referral(request: HttpRequest, referral_id: UUID, payload: ReferralUpdateSchemaIn):
    """Update a referral."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Get the authenticated user or create a default user for testing
    user = request.user
    if not user or user.is_anonymous:
        # For development/testing - get or create a default user
        user, created = User.objects.get_or_create(
            username='test.user@example.com',
            defaults={
                'email': 'test.user@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'is_active': True
            }
        )
    
    referral = get_object_or_404(Referral, id=referral_id)
    return ReferralService.update_referral(referral, payload.dict(exclude_unset=True), user)

@router.patch("/{referral_id}/status", response=ReferralSchemaOut, auth=auth_required)
def update_referral_status(request: HttpRequest, referral_id: UUID, payload: ReferralStatusUpdateSchemaIn):
    """Update only the status of a referral."""
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    # Get the authenticated user or create a default user for testing
    user = request.user
    if not user or user.is_anonymous:
        # For development/testing - get or create a default user
        user, created = User.objects.get_or_create(
            username='test.user@example.com',
            defaults={
                'email': 'test.user@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'is_active': True
            }
        )
    
    referral = get_object_or_404(Referral, id=referral_id)
    return ReferralService.update_referral_status(referral, payload.status_id, user)

@router.get("/programs/{program_id}/form-schema", response=ProgramFormSchemaOut, auth=auth_required)
def get_program_form_schema(request: HttpRequest, program_id: UUID):
    """Get the form schema for a specific program's referral fields."""
    from apps.programs.models import Program
    
    program = get_object_or_404(Program, id=program_id)
    
    # Default schema if program doesn't have custom referral_schema
    default_fields = []
    
    # If program has custom referral_schema, use it
    if program.referral_schema:
        fields = []
        for field_def in program.referral_schema.get('fields', []):
            fields.append({
                "name": field_def.get('name'),
                "type": field_def.get('type', 'string'),
                "label": field_def.get('label'),
                "required": field_def.get('required', False),
                "help_text": field_def.get('help_text'),
                "choices": field_def.get('choices'),
                "option_list_slug": field_def.get('option_list_slug'),
                "validation": field_def.get('validation')
            })
    else:
        # Use default fields for now - this could be enhanced later
        fields = default_fields
    
    return {
        "program_id": program.id,
        "program_name": program.name,
        "fields": fields
    }

@router.delete("/{referral_id}", auth=auth_required)
def delete_referral(request: HttpRequest, referral_id: UUID):
    """Delete a referral."""
    referral = get_object_or_404(Referral, id=referral_id)
    ReferralService.delete_referral(referral)
    return {"detail": "Referral deleted successfully"}