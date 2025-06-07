from typing import List
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.http import Http404
from django.db import models
from ninja import Router
from ninja.pagination import paginate
from ninja.errors import HttpError

from .models import Client
from .schemas import (
    ClientCreateSchema,
    ClientUpdateSchema,
    ClientListSchema,
    ClientDetailSchema,
    ClientSearchSchema,
    ClientStatsSchema
)
from .services import ClientService
from apps.common.schemas import MessageSchema


def serialize_client_for_detail(client: Client) -> dict:
    """Custom serializer to handle computed fields and ensure proper JSON defaults."""
    from .schemas import ClientDetailSchema
    
    # Create base data
    data = {
        'id': str(client.id),
        'created_at': client.created_at,
        'updated_at': client.updated_at,
        'first_name': client.first_name,
        'last_name': client.last_name,
        'preferred_name': client.preferred_name,
        'date_of_birth': client.date_of_birth,
        'email': client.email,
        'phone': client.phone,
        'address': client.address,
        'risk_level': client.risk_level,
        'consent_required': client.consent_required,
        'incomplete_documentation': client.incomplete_documentation,
        'interpreter_needed': client.interpreter_needed,
        'notes': client.notes,
        
        # Ensure JSON fields are never None
        'cultural_identity': client.cultural_identity if client.cultural_identity is not None else {},
        'extended_data': client.extended_data if client.extended_data is not None else {},
        
        # Related objects
        'status': client.status,
        'primary_language': client.primary_language,
        
        # Computed fields
        'display_name': client.display_name,
        'full_name': client.full_name,
        'age': client.get_age(),
    }
    
    return data


def serialize_client_for_list(client: Client) -> dict:
    """Custom serializer for list view."""
    return {
        'id': str(client.id),
        'created_at': client.created_at,
        'updated_at': client.updated_at,
        'first_name': client.first_name,
        'last_name': client.last_name,
        'preferred_name': client.preferred_name,
        'date_of_birth': client.date_of_birth,
        'email': client.email,
        'phone': client.phone,
        'risk_level': client.risk_level,
        'consent_required': client.consent_required,
        'incomplete_documentation': client.incomplete_documentation,
        
        # Related objects
        'status': client.status,
        'primary_language': client.primary_language,
    }

# Create the main router for client management
router = Router(tags=["Clients"])


@router.get("/", response=List[ClientListSchema], summary="List clients")
@paginate
def list_clients(request, filters: ClientSearchSchema = None):
    """
    List clients with optional filtering and pagination.
    
    Supports filtering by:
    - Text search (name, email, phone)
    - Status, risk level, language
    - Age range
    - Boolean flags (interpreter needed, consent required, etc.)
    """
    if filters is None:
        filters = ClientSearchSchema()
    
    # Get pagination parameters from request
    limit = int(request.GET.get('limit', 25))
    offset = int(request.GET.get('offset', 0))
    
    clients, total_count = ClientService.search_clients(filters, limit, offset)
    
    # The @paginate decorator will handle the pagination wrapper
    return clients


@router.post("/", response=ClientDetailSchema, summary="Create client")
def create_client(request, data: ClientCreateSchema):
    """
    Create a new client.
    
    Required fields:
    - first_name, last_name, date_of_birth, status_id
    
    Optional fields:
    - All other client fields
    """
    try:
        client = ClientService.create_client(data)
        return serialize_client_for_detail(client)
    except ValidationError as e:
        raise HttpError(400, str(e))
    except Exception as e:
        raise HttpError(500, f"Failed to create client: {str(e)}")


@router.get("/{client_id}", response=ClientDetailSchema, summary="Get client details")
def get_client(request, client_id: str):
    """Get detailed information about a specific client."""
    client = ClientService.get_client_by_id(client_id)
    if not client:
        raise Http404("Client not found")
    return serialize_client_for_detail(client)


@router.patch("/{client_id}", response=ClientDetailSchema, summary="Update client")
def update_client(request, client_id: str, data: ClientUpdateSchema):
    """
    Update an existing client.
    
    All fields are optional - only provided fields will be updated.
    """
    client = ClientService.get_client_by_id(client_id)
    if not client:
        raise Http404("Client not found")
    
    try:
        updated_client = ClientService.update_client(client, data)
        return serialize_client_for_detail(updated_client)
    except ValidationError as e:
        raise HttpError(400, str(e))
    except Exception as e:
        raise HttpError(500, f"Failed to update client: {str(e)}")


@router.delete("/{client_id}", response=MessageSchema, summary="Delete client")
def delete_client(request, client_id: str):
    """
    Soft delete a client.
    
    This marks the client as inactive rather than permanently deleting the record
    to preserve data integrity and audit trails.
    """
    success = ClientService.delete_client(client_id)
    if not success:
        raise Http404("Client not found")
    
    return {"message": "Client successfully deactivated"}


@router.get("/stats/overview", response=ClientStatsSchema, summary="Get client statistics")
def get_client_stats(request):
    """
    Get comprehensive client statistics for dashboard and reporting.
    
    Returns:
    - Total counts (all clients, active, high-risk, etc.)
    - Age distribution
    - Language distribution
    - Risk level distribution
    """
    try:
        stats = ClientService.get_client_stats()
        return stats
    except Exception as e:
        raise HttpError(500, f"Failed to retrieve client statistics: {str(e)}")


@router.get("/{client_id}/summary", response=ClientListSchema, summary="Get client summary")
def get_client_summary(request, client_id: str):
    """
    Get a summary view of a client (lighter than full details).
    
    Useful for references in other parts of the application
    like referral forms or quick lookups.
    """
    client = ClientService.get_client_by_id(client_id)
    if not client:
        raise Http404("Client not found")
    return serialize_client_for_list(client)


# Additional utility endpoints

@router.post("/validate", response=MessageSchema, summary="Validate client data")
def validate_client_data(request, data: ClientCreateSchema):
    """
    Validate client data without creating a record.
    
    Useful for form validation on the frontend before submission.
    """
    try:
        # Convert schema to dict for validation
        client_data = data.dict()
        errors = ClientService.validate_client_data(client_data)
        
        if errors:
            return {"message": f"Validation errors: {', '.join(errors)}"}
        else:
            return {"message": "Data is valid"}
            
    except Exception as e:
        raise HttpError(400, f"Validation failed: {str(e)}")


@router.get("/search/suggestions", response=List[str], summary="Get search suggestions")
def get_search_suggestions(request, query: str = ""):
    """
    Get search suggestions for client names.
    
    Returns a list of matching client names for autocomplete functionality.
    """
    if len(query) < 2:
        return []
    
    # Search for clients matching the query
    clients = Client.objects.filter(
        models.Q(first_name__icontains=query) |
        models.Q(last_name__icontains=query) |
        models.Q(preferred_name__icontains=query)
    ).distinct()[:10]
    
    suggestions = []
    for client in clients:
        suggestions.append(f"{client.display_name} ({client.id})")
    
    return suggestions