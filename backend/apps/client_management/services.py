from typing import List, Optional, Dict, Any, Tuple
from datetime import date, timedelta
from django.db import transaction
from django.db.models import Q, Count
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
User = get_user_model()
from .models import Client, ClientEmergencyContact
from .schemas import ClientCreateSchema, ClientUpdateSchema, ClientSearchSchema
from apps.optionlists.models import OptionListItem
from apps.reference_data.models import Language


class ClientService:
    """Service layer for client management operations."""
    
    @staticmethod
    def create_client(data: Dict[str, Any], created_by_user: User = None) -> Client:
        """Create a new client with validation and cultural identity fields."""
        with transaction.atomic():
            # Validate status
            status_id = data.get('status_id')  # Get status ID if provided
            if status_id:
                try:
                    status = OptionListItem.objects.get(
                        id=status_id,
                        option_list__slug='client-statuses'
                    )
                except OptionListItem.DoesNotExist:
                    raise ValidationError("Invalid status ID provided")
            else:
                # Get first available status if none provided
                status = OptionListItem.objects.filter(
                    option_list__slug='client-statuses'
                ).first()
                if not status:
                    raise ValidationError("No client statuses available")
            
            # Validate primary language if provided
            primary_language = None
            if data.get('primary_language_id'):
                try:
                    primary_language = Language.objects.get(id=data['primary_language_id'])
                except Language.DoesNotExist:
                    raise ValidationError("Invalid primary language ID provided")
            
            # Validate gender if provided
            gender = None
            if data.get('gender_id'):
                try:
                    gender = OptionListItem.objects.get(
                        id=data['gender_id'],
                        option_list__slug='gender-identity'
                    )
                except OptionListItem.DoesNotExist:
                    raise ValidationError("Invalid gender ID provided")
            
            # Validate cultural identity fields
            iwi_hapu = None
            if data.get('iwi_hapu_id'):
                try:
                    iwi_hapu = OptionListItem.objects.get(
                        id=data['iwi_hapu_id'],
                        option_list__slug='iwi-hapu'
                    )
                except OptionListItem.DoesNotExist:
                    raise ValidationError("Invalid iwi/hapū ID provided")
            
            spiritual_needs = None
            if data.get('spiritual_needs_id'):
                try:
                    spiritual_needs = OptionListItem.objects.get(
                        id=data['spiritual_needs_id'],
                        option_list__slug='spiritual-needs'
                    )
                except OptionListItem.DoesNotExist:
                    raise ValidationError("Invalid spiritual needs ID provided")
            
            # Prepare client data excluding foreign key IDs
            client_data = {
                'first_name': data.get('first_name', ''),
                'last_name': data.get('last_name', ''),
                'preferred_name': data.get('preferred_name'),
                'date_of_birth': data.get('date_of_birth'),
                'email': data.get('email'),
                'phone': data.get('phone'),
                'address': data.get('address'),
                'interpreter_needed': data.get('interpreter_needed', False),
                'risk_level': data.get('risk_level', 'low'),
                'consent_required': data.get('consent_required', True),
                'incomplete_documentation': data.get('incomplete_documentation', False),
                'cultural_identity': data.get('cultural_identity', {}),
                'notes': data.get('notes'),
                'extended_data': data.get('extended_data', {}),
            }
            
            # Create client
            client = Client.objects.create(
                status=status,
                primary_language=primary_language,
                gender=gender,
                iwi_hapu=iwi_hapu,
                spiritual_needs=spiritual_needs,
                created_by=created_by_user,
                updated_by=created_by_user,
                **client_data
            )
            
            # Handle emergency contacts if provided
            emergency_contacts = data.get('emergency_contacts', [])
            if emergency_contacts:
                ClientService._create_emergency_contacts(client, emergency_contacts, created_by_user)
            
            return client
    
    @staticmethod
    def update_client(client: Client, data: ClientUpdateSchema) -> Client:
        """Update an existing client with validation."""
        with transaction.atomic():
            update_data = data.dict(exclude_unset=True, exclude={'status_id', 'primary_language_id'})
            
            # Handle status update
            if data.status_id is not None:
                try:
                    status = OptionListItem.objects.get(
                        id=data.status_id,
                        option_list__slug='client-statuses'
                    )
                    client.status = status
                except OptionListItem.DoesNotExist:
                    raise ValidationError("Invalid status ID provided")
            
            # Handle primary language update
            if data.primary_language_id is not None:
                try:
                    primary_language = Language.objects.get(id=data.primary_language_id)
                    client.primary_language = primary_language
                except Language.DoesNotExist:
                    raise ValidationError("Invalid primary language ID provided")
            
            # Update other fields
            for field, value in update_data.items():
                setattr(client, field, value)
            
            client.full_clean()
            client.save()
            
            return client
    
    @staticmethod
    def search_clients(search_params: ClientSearchSchema, limit: int = 50, offset: int = 0) -> Tuple[List[Client], int]:
        """Search clients with filters and pagination."""
        from apps.referral_management.models import Referral
        from django.db.models import Count, Q as DjangoQ
        
        # Subquery to count active referrals (non-closed) for each client
        active_statuses = ['pending', 'new', 'in-progress', 'accepted']
        
        queryset = Client.objects.select_related('status', 'primary_language').annotate(
            active_referral_count=Count(
                'referrals',
                filter=DjangoQ(referrals__status__slug__in=active_statuses)
            )
        )
        
        # Text search across name, email, phone
        if search_params.search:
            search_term = search_params.search.strip()
            queryset = queryset.filter(
                Q(first_name__icontains=search_term) |
                Q(last_name__icontains=search_term) |
                Q(preferred_name__icontains=search_term) |
                Q(email__icontains=search_term) |
                Q(phone__icontains=search_term)
            )
        
        # Status filter
        if search_params.status_id:
            queryset = queryset.filter(status_id=search_params.status_id)
        
        # Risk level filter
        if search_params.risk_level:
            queryset = queryset.filter(risk_level=search_params.risk_level)
        
        # Language filter
        if search_params.primary_language_id:
            queryset = queryset.filter(primary_language_id=search_params.primary_language_id)
        
        # Boolean filters
        if search_params.interpreter_needed is not None:
            queryset = queryset.filter(interpreter_needed=search_params.interpreter_needed)
        
        if search_params.consent_required is not None:
            queryset = queryset.filter(consent_required=search_params.consent_required)
        
        if search_params.incomplete_documentation is not None:
            queryset = queryset.filter(incomplete_documentation=search_params.incomplete_documentation)
        
        # Get total count before pagination
        total_count = queryset.count()
        
        # Apply pagination
        clients = list(queryset[offset:offset + limit])
        
        return clients, total_count
    
    @staticmethod
    def get_client_stats() -> Dict[str, Any]:
        """Get client statistics for dashboard."""
        total_clients = Client.objects.count()
        
        # Get status statistics (assuming 'active' status exists)
        active_clients = Client.objects.filter(
            status__option_list__slug='client-statuses',
            status__name__icontains='active'
        ).count()
        
        # Risk level statistics
        high_risk_clients = Client.objects.filter(risk_level='high').count()
        
        # Other statistics
        clients_needing_interpreter = Client.objects.filter(interpreter_needed=True).count()
        clients_with_incomplete_docs = Client.objects.filter(incomplete_documentation=True).count()
        
        # Age distribution
        today = date.today()
        age_groups = {
            '0-17': 0,
            '18-25': 0,
            '26-35': 0,
            '36-50': 0,
            '51-65': 0,
            '65+': 0
        }
        
        # Calculate age distributions
        clients_with_ages = Client.objects.all()
        for client in clients_with_ages:
            age = client.get_age()
            if age <= 17:
                age_groups['0-17'] += 1
            elif age <= 25:
                age_groups['18-25'] += 1
            elif age <= 35:
                age_groups['26-35'] += 1
            elif age <= 50:
                age_groups['36-50'] += 1
            elif age <= 65:
                age_groups['51-65'] += 1
            else:
                age_groups['65+'] += 1
        
        # Language distribution
        language_distribution = {}
        language_stats = Client.objects.values(
            'primary_language__label'
        ).annotate(
            count=Count('id')
        ).exclude(primary_language__isnull=True)
        
        for stat in language_stats:
            language_distribution[stat['primary_language__label'] or 'Unknown'] = stat['count']
        
        # Risk distribution
        risk_distribution = dict(
            Client.objects.values('risk_level').annotate(count=Count('id')).values_list('risk_level', 'count')
        )
        
        return {
            'total_clients': total_clients,
            'active_clients': active_clients,
            'high_risk_clients': high_risk_clients,
            'clients_needing_interpreter': clients_needing_interpreter,
            'clients_with_incomplete_docs': clients_with_incomplete_docs,
            'age_distribution': age_groups,
            'language_distribution': language_distribution,
            'risk_distribution': risk_distribution,
        }
    
    @staticmethod
    def get_client_by_id(client_id: str) -> Optional[Client]:
        """Get a client by ID with related objects."""
        try:
            return Client.objects.select_related(
                'status', 'primary_language'
            ).get(id=client_id)
        except Client.DoesNotExist:
            return None
    
    @staticmethod
    def delete_client(client_id: str) -> bool:
        """Soft delete a client (mark as inactive rather than actual deletion)."""
        try:
            client = Client.objects.get(id=client_id)
            
            # Try to find an 'inactive' status
            try:
                inactive_status = OptionListItem.objects.get(
                    option_list__slug='client-statuses',
                    value__icontains='inactive'
                )
                client.status = inactive_status
                client.save()
                return True
            except OptionListItem.DoesNotExist:
                # If no inactive status exists, just mark as low risk and add note
                client.risk_level = 'low'
                if client.notes:
                    client.notes += f"\n[DEACTIVATED: {date.today()}]"
                else:
                    client.notes = f"[DEACTIVATED: {date.today()}]"
                client.save()
                return True
                
        except Client.DoesNotExist:
            return False
    
    @staticmethod
    def validate_client_data(data: Dict[str, Any]) -> List[str]:
        """Validate client data and return list of errors."""
        errors = []
        
        # Check required fields for creation
        if 'first_name' in data and not data['first_name']:
            errors.append("First name is required")
        
        if 'last_name' in data and not data['last_name']:
            errors.append("Last name is required")
        
        if 'date_of_birth' in data:
            if not data['date_of_birth']:
                errors.append("Date of birth is required")
            elif isinstance(data['date_of_birth'], date) and data['date_of_birth'] > date.today():
                errors.append("Date of birth cannot be in the future")
        
        # Validate email format if provided
        if 'email' in data and data['email']:
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, data['email']):
                errors.append("Invalid email format")
        
        # Validate risk level
        if 'risk_level' in data and data['risk_level'] not in ['low', 'medium', 'high']:
            errors.append("Risk level must be 'low', 'medium', or 'high'")
        
        return errors
    
    @staticmethod
    def _create_emergency_contacts(client: Client, emergency_contacts_data: List[Dict[str, Any]], created_by_user: User = None):
        """Create emergency contacts for a client."""
        for contact_data in emergency_contacts_data:
            if contact_data.get('first_name') and contact_data.get('last_name') and contact_data.get('relationship_id'):
                try:
                    relationship = OptionListItem.objects.get(
                        id=contact_data['relationship_id'],
                        option_list__slug='emergency-contact-relationships'
                    )
                    
                    ClientEmergencyContact.objects.create(
                        client=client,
                        relationship=relationship,
                        first_name=contact_data['first_name'],
                        last_name=contact_data['last_name'],
                        phone=contact_data.get('phone', ''),
                        email=contact_data.get('email'),
                        is_primary=contact_data.get('is_primary', False),
                        priority_order=contact_data.get('priority_order', 1),
                        created_by=created_by_user,
                        updated_by=created_by_user
                    )
                except OptionListItem.DoesNotExist:
                    # Skip invalid relationships but don't fail the entire operation
                    continue