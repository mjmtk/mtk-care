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
    ClientStatsSchema,
    ClientEmergencyContactSchemaIn,
    ClientEmergencyContactSchemaOut,
    EmergencyContactsReplaceSchema,
    ClientCulturalUpdateSchema
)
from .services import ClientService
from apps.common.schemas import MessageSchema


def serialize_client_for_cultural_identity(client: Client) -> dict:
    """Custom serializer for cultural identity endpoint - returns minimal JSON-safe dict."""
    
    # Basic client info
    result = {
        'id': str(client.id),
        'first_name': client.first_name,
        'last_name': client.last_name,
        'email': client.email,
        'phone': client.phone,
        'interpreter_needed': client.interpreter_needed,
        
        # Cultural identity data
        'cultural_identity': client.cultural_identity if client.cultural_identity is not None else {},
        
        # Field IDs for form editing (the most important part)
        'gender_id': client.gender.id if client.gender else None,
        'iwi_hapu_id': client.iwi_hapu.id if client.iwi_hapu else None,
        'spiritual_needs_id': client.spiritual_needs.id if client.spiritual_needs else None,
        'primary_language_id': client.primary_language.id if client.primary_language else None,
    }
    
    # Add timestamp fields as ISO strings
    if client.created_at:
        result['created_at'] = client.created_at.isoformat()
    if client.updated_at:
        result['updated_at'] = client.updated_at.isoformat()
    if client.date_of_birth:
        result['date_of_birth'] = client.date_of_birth.isoformat()
    
    # Add related object details if they exist
    if client.iwi_hapu:
        result['iwi_hapu'] = {
            'id': client.iwi_hapu.id,
            'label': client.iwi_hapu.label,
            'slug': client.iwi_hapu.slug
        }
    
    if client.spiritual_needs:
        result['spiritual_needs'] = {
            'id': client.spiritual_needs.id,
            'label': client.spiritual_needs.label,
            'slug': client.spiritual_needs.slug
        }
        
    if client.primary_language:
        result['primary_language'] = {
            'id': client.primary_language.id,
            'name': client.primary_language.name,
            'code': client.primary_language.code
        }
        
    if client.gender:
        result['gender'] = {
            'id': client.gender.id,
            'label': client.gender.label,
            'slug': client.gender.slug
        }
    
    return result


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
        
        # Related objects (serialize to dicts for frontend compatibility)
        'status': {
            'id': client.status.id,
            'label': client.status.label,
            'slug': client.status.slug,
            'name': client.status.label,  # Legacy compatibility
            'sort_order': getattr(client.status, 'sort_order', 0),
            'is_active': getattr(client.status, 'is_active', True)
        } if client.status else None,
        'primary_language': {
            'id': client.primary_language.id,
            'name': client.primary_language.name,
            'code': client.primary_language.code
        } if client.primary_language else None,
        'gender': {
            'id': client.gender.id,
            'label': client.gender.label,
            'slug': client.gender.slug
        } if client.gender else None,
        'iwi_hapu': {
            'id': client.iwi_hapu.id,
            'label': client.iwi_hapu.label,
            'slug': client.iwi_hapu.slug
        } if client.iwi_hapu else None,
        'spiritual_needs': {
            'id': client.spiritual_needs.id,
            'label': client.spiritual_needs.label,
            'slug': client.spiritual_needs.slug
        } if client.spiritual_needs else None,
        
        # Emergency contacts
        'emergency_contacts': [
            {
                'id': contact.id,
                'relationship': {
                    'id': contact.relationship.id,
                    'label': contact.relationship.label,
                    'slug': contact.relationship.slug
                } if contact.relationship else None,
                'first_name': contact.first_name,
                'last_name': contact.last_name,
                'phone': contact.phone,
                'email': contact.email,
                'is_primary': contact.is_primary,
                'priority_order': contact.priority_order
            } for contact in client.emergency_contacts.all()
        ],
        
        # Computed fields
        'display_name': client.display_name,
        'full_name': client.full_name,
        'age': client.get_age(),
        
        # Include field IDs for form editing
        'gender_id': client.gender.id if client.gender else None,
        'iwi_hapu_id': client.iwi_hapu.id if client.iwi_hapu else None,
        'spiritual_needs_id': client.spiritual_needs.id if client.spiritual_needs else None,
        'primary_language_id': client.primary_language.id if client.primary_language else None,
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
def list_clients(
    request, 
    search: str = None,
    status_id: str = None,
    risk_level: str = None,
    primary_language_id: str = None,
    interpreter_needed: bool = None,
    consent_required: bool = None,
    incomplete_documentation: bool = None
):
    """
    List clients with optional filtering and pagination.
    
    Supports filtering by:
    - Text search (name, email, phone)
    - Status, risk level, language
    - Age range
    - Boolean flags (interpreter needed, consent required, etc.)
    """
    # Get pagination parameters from request (handled by @paginate decorator)
    limit = int(request.GET.get('limit', 25))
    offset = int(request.GET.get('offset', 0))
    
    # Create filters object from query parameters
    filters = ClientSearchSchema(
        search=search,
        status_id=status_id,
        risk_level=risk_level,
        primary_language_id=primary_language_id,
        interpreter_needed=interpreter_needed,
        consent_required=consent_required,
        incomplete_documentation=incomplete_documentation,
    )
    
    clients, total_count = ClientService.search_clients(filters, limit, offset)
    
    # The @paginate decorator will handle the pagination wrapper
    return clients


@router.post("/", response=ClientDetailSchema, summary="Create client")
def create_client(request, data: ClientCreateSchema):
    """
    Create a new client.
    
    Required fields:
    - first_name, last_name, date_of_birth
    
    Optional fields:
    - All other client fields (status_id defaults to first available if not provided)
    """
    try:
        # Convert schema to dict for service
        client_data = data.dict()
        
        # Get user from request (for auth bypass mode or JWT auth)
        user = getattr(request, 'auth', None) or getattr(request, 'user', None)
        
        client = ClientService.create_client(client_data, user)
        return serialize_client_for_detail(client)
    except ValidationError as e:
        raise HttpError(400, str(e))
    except Exception as e:
        raise HttpError(500, f"Failed to create client: {str(e)}")


@router.get("/{client_id}", summary="Get client details")
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


# Emergency Contacts Endpoints

@router.get("/{client_id}/emergency-contacts", response=List[ClientEmergencyContactSchemaOut], summary="Get client emergency contacts")
def get_client_emergency_contacts(request, client_id: str):
    """Get all emergency contacts for a specific client."""
    client = ClientService.get_client_by_id(client_id)
    if not client:
        raise Http404("Client not found")
    
    contacts = client.emergency_contacts.all()
    return [
        {
            'id': str(contact.id),
            'relationship': contact.relationship,
            'first_name': contact.first_name,
            'last_name': contact.last_name,
            'phone': contact.phone,
            'email': contact.email,
            'is_primary': contact.is_primary,
            'priority_order': contact.priority_order,
            'created_at': contact.created_at,
            'updated_at': contact.updated_at,
            'full_name': f"{contact.first_name} {contact.last_name}"
        } for contact in contacts
    ]


@router.post("/{client_id}/emergency-contacts", response=ClientEmergencyContactSchemaOut, summary="Create emergency contact")
def create_emergency_contact(request, client_id: str, contact_data: ClientEmergencyContactSchemaIn):
    """Create a new emergency contact for a client."""
    client = ClientService.get_client_by_id(client_id)
    if not client:
        raise Http404("Client not found")
    
    try:
        from apps.optionlists.models import OptionListItem
        from .models import ClientEmergencyContact
        
        # Get user from request
        user = getattr(request, 'auth', None) or getattr(request, 'user', None)
        
        # Get the relationship object
        relationship = None
        if contact_data.relationship_id:
            try:
                relationship = OptionListItem.objects.get(
                    id=contact_data.relationship_id,
                    option_list__slug='emergency-contact-relationships'
                )
            except OptionListItem.DoesNotExist:
                raise HttpError(400, f"Invalid relationship_id: {contact_data.relationship_id}")
        
        contact = ClientEmergencyContact.objects.create(
            client=client,
            relationship=relationship,
            first_name=contact_data.first_name,
            last_name=contact_data.last_name,
            phone=contact_data.phone,
            email=contact_data.email,
            is_primary=contact_data.is_primary,
            priority_order=contact_data.priority_order,
            created_by=user,
            updated_by=user
        )
        
        return {
            'id': str(contact.id),
            'relationship': contact.relationship,
            'first_name': contact.first_name,
            'last_name': contact.last_name,
            'phone': contact.phone,
            'email': contact.email,
            'is_primary': contact.is_primary,
            'priority_order': contact.priority_order,
            'created_at': contact.created_at,
            'updated_at': contact.updated_at,
            'full_name': f"{contact.first_name} {contact.last_name}"
        }
        
    except Exception as e:
        raise HttpError(500, f"Failed to create emergency contact: {str(e)}")


@router.put("/{client_id}/emergency-contacts", response=List[ClientEmergencyContactSchemaOut], summary="Replace all emergency contacts")
def replace_emergency_contacts(request, client_id: str, payload: EmergencyContactsReplaceSchema):
    """Replace all emergency contacts for a client."""
    client = ClientService.get_client_by_id(client_id)
    if not client:
        raise Http404("Client not found")
    
    try:
        from django.db import transaction
        from apps.optionlists.models import OptionListItem
        from .models import ClientEmergencyContact
        
        # Get user from request
        user = getattr(request, 'auth', None) or getattr(request, 'user', None)
        
        emergency_contacts_data = payload.emergency_contacts
        
        with transaction.atomic():
            # Clear existing emergency contacts
            ClientEmergencyContact.objects.filter(client=client).delete()
            
            # Create new emergency contacts
            created_contacts = []
            for i, contact_data in enumerate(emergency_contacts_data):
                if not (contact_data.first_name and contact_data.last_name):
                    continue
                    
                # Get the relationship object
                relationship = None
                if contact_data.relationship_id:
                    try:
                        relationship = OptionListItem.objects.get(
                            id=contact_data.relationship_id,
                            option_list__slug='emergency-contact-relationships'
                        )
                    except OptionListItem.DoesNotExist:
                        print(f"Warning: Invalid relationship_id {contact_data.relationship_id}")
                
                priority_order = contact_data.priority_order or (i + 1)
                
                contact = ClientEmergencyContact.objects.create(
                    client=client,
                    relationship=relationship,
                    first_name=contact_data.first_name,
                    last_name=contact_data.last_name,
                    phone=contact_data.phone,
                    email=contact_data.email,
                    is_primary=contact_data.is_primary,
                    priority_order=priority_order,
                    created_by=user,
                    updated_by=user
                )
                
                created_contacts.append({
                    'id': str(contact.id),
                    'relationship': contact.relationship,
                    'first_name': contact.first_name,
                    'last_name': contact.last_name,
                    'phone': contact.phone,
                    'email': contact.email,
                    'is_primary': contact.is_primary,
                    'priority_order': contact.priority_order,
                    'created_at': contact.created_at,
                    'updated_at': contact.updated_at,
                    'full_name': f"{contact.first_name} {contact.last_name}"
                })
            
            return created_contacts
            
    except Exception as e:
        raise HttpError(500, f"Failed to replace emergency contacts: {str(e)}")


@router.delete("/{client_id}/emergency-contacts/{contact_id}", response=MessageSchema, summary="Delete emergency contact")
def delete_emergency_contact(request, client_id: str, contact_id: str):
    """Delete a specific emergency contact."""
    try:
        from .models import ClientEmergencyContact
        contact = ClientEmergencyContact.objects.get(
            id=contact_id,
            client_id=client_id
        )
        contact.delete()
        return {"message": "Emergency contact deleted successfully"}
    except ClientEmergencyContact.DoesNotExist:
        raise Http404("Emergency contact not found")


# Cultural Identity Endpoints

@router.patch("/{client_id}/cultural-identity", summary="Update client cultural identity")
def update_client_cultural_identity(request, client_id: str, cultural_data: ClientCulturalUpdateSchema):
    """Update cultural identity information for a client."""
    client = ClientService.get_client_by_id(client_id)
    if not client:
        raise Http404("Client not found")
    
    try:
        from apps.optionlists.models import OptionListItem
        import logging
        
        logger = logging.getLogger(__name__)
        logger.info(f"Updating cultural identity for client {client_id}")
        logger.info(f"Received cultural data: {cultural_data}")
        logger.info(f"iwi_hapu_id: {cultural_data.iwi_hapu_id}")
        logger.info(f"spiritual_needs_id: {cultural_data.spiritual_needs_id}")
        
        # Get user from request
        user = getattr(request, 'auth', None) or getattr(request, 'user', None)
        
        # Update cultural identity fields
        if cultural_data.cultural_identity is not None:
            client.cultural_identity = cultural_data.cultural_identity
        
        # Update option list relationships
        if cultural_data.iwi_hapu_id is not None:
            if cultural_data.iwi_hapu_id:
                try:
                    iwi_hapu = OptionListItem.objects.get(
                        id=cultural_data.iwi_hapu_id,
                        option_list__slug='iwi-hapu'
                    )
                    client.iwi_hapu = iwi_hapu
                except OptionListItem.DoesNotExist:
                    raise HttpError(400, f"Invalid iwi_hapu_id: {cultural_data.iwi_hapu_id}")
            else:
                client.iwi_hapu = None
        
        if cultural_data.spiritual_needs_id is not None:
            if cultural_data.spiritual_needs_id:
                try:
                    spiritual_needs = OptionListItem.objects.get(
                        id=cultural_data.spiritual_needs_id,
                        option_list__slug='spiritual-needs'
                    )
                    client.spiritual_needs = spiritual_needs
                except OptionListItem.DoesNotExist:
                    raise HttpError(400, f"Invalid spiritual_needs_id: {cultural_data.spiritual_needs_id}")
            else:
                client.spiritual_needs = None
        
        if cultural_data.primary_language_id is not None:
            if cultural_data.primary_language_id:
                try:
                    from apps.reference_data.models import Language
                    language = Language.objects.get(id=cultural_data.primary_language_id)
                    client.primary_language = language
                except Language.DoesNotExist:
                    raise HttpError(400, f"Invalid primary_language_id: {cultural_data.primary_language_id}")
            else:
                client.primary_language = None
        
        if cultural_data.interpreter_needed is not None:
            client.interpreter_needed = cultural_data.interpreter_needed
        
        # Set updated_by and save
        client.updated_by = user
        client.save()
        
        # Refresh from database to ensure related objects are loaded
        client.refresh_from_db()
        
        logger.info(f"Client saved successfully. Final state:")
        logger.info(f"iwi_hapu: {client.iwi_hapu} (ID: {client.iwi_hapu.id if client.iwi_hapu else None})")
        logger.info(f"spiritual_needs: {client.spiritual_needs} (ID: {client.spiritual_needs.id if client.spiritual_needs else None})")
        logger.info(f"primary_language: {client.primary_language} (ID: {client.primary_language.id if client.primary_language else None})")
        
        result = serialize_client_for_cultural_identity(client)
        logger.info(f"Serialized result includes IDs: iwi_hapu_id={result.get('iwi_hapu_id')}, spiritual_needs_id={result.get('spiritual_needs_id')}")
        
        return result
        
    except Exception as e:
        raise HttpError(500, f"Failed to update cultural identity: {str(e)}")