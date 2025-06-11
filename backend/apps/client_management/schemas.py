from typing import Optional, Dict, Any, List
from datetime import date, datetime
from ninja import Schema
from pydantic import Field
from uuid import UUID
from apps.common.schemas import UUIDPKBaseModelSchema
from apps.optionlists.schemas import OptionListItemSchemaOut
from apps.reference_data.schemas import LanguageOut


class ClientCreateSchema(Schema):
    """Lightweight schema for creating a new client."""
    
    # Required fields
    first_name: str = Field(..., description="Client's first name")
    last_name: str = Field(..., description="Client's last name")
    date_of_birth: date = Field(..., description="Client's date of birth")
    
    # Optional fields (status_id defaults to first available status if not provided)
    status_id: Optional[int] = Field(None, description="Client status option list item ID")
    
    # Optional personal information
    preferred_name: Optional[str] = Field(None, description="Preferred name")
    email: Optional[str] = Field(None, description="Primary email address")
    phone: Optional[str] = Field(None, description="Primary phone number")
    address: Optional[str] = Field(None, description="Full address")
    gender_id: Optional[int] = Field(None, description="Gender identity option list item ID")
    
    # Optional status and language
    primary_language_id: Optional[int] = Field(None, description="Primary language option list item ID")
    interpreter_needed: Optional[bool] = Field(False, description="Whether interpreter is needed")
    
    # Risk and safety
    risk_level: Optional[str] = Field("low", description="Risk assessment level (low, medium, high)")
    consent_required: Optional[bool] = Field(True, description="Whether consent is required")
    incomplete_documentation: Optional[bool] = Field(False, description="Whether documentation is incomplete")
    
    # Cultural and additional information
    cultural_identity: Optional[Dict[str, Any]] = Field(None, description="Cultural identity information")
    iwi_hapu_id: Optional[int] = Field(None, description="Iwi/Hapū affiliation option list item ID")
    spiritual_needs_id: Optional[int] = Field(None, description="Spiritual needs option list item ID")
    notes: Optional[str] = Field(None, description="Additional notes")
    extended_data: Optional[Dict[str, Any]] = Field(None, description="Extended data for future use")
    
    # Emergency contacts
    emergency_contacts: Optional[List[Dict[str, Any]]] = Field(None, description="Emergency contact information")


class ClientUpdateSchema(Schema):
    """Lightweight schema for updating an existing client."""
    
    # All fields are optional for updates
    first_name: Optional[str] = Field(None, description="Client's first name")
    last_name: Optional[str] = Field(None, description="Client's last name")
    preferred_name: Optional[str] = Field(None, description="Preferred name")
    date_of_birth: Optional[date] = Field(None, description="Client's date of birth")
    
    # Contact information
    email: Optional[str] = Field(None, description="Primary email address")
    gender_id: Optional[int] = Field(None, description="Gender identity option list item ID")
    phone: Optional[str] = Field(None, description="Primary phone number")
    address: Optional[str] = Field(None, description="Full address")
    
    # Status and language
    status_id: Optional[int] = Field(None, description="Client status option list item ID")
    primary_language_id: Optional[int] = Field(None, description="Primary language option list item ID")
    interpreter_needed: Optional[bool] = Field(None, description="Whether interpreter is needed")
    
    # Risk and safety
    risk_level: Optional[str] = Field(None, description="Risk assessment level (low, medium, high)")
    consent_required: Optional[bool] = Field(None, description="Whether consent is required")
    incomplete_documentation: Optional[bool] = Field(None, description="Whether documentation is incomplete")
    
    # Cultural and additional information
    cultural_identity: Optional[Dict[str, Any]] = Field(None, description="Cultural identity information")
    iwi_hapu_id: Optional[int] = Field(None, description="Iwi/Hapū affiliation option list item ID")
    spiritual_needs_id: Optional[int] = Field(None, description="Spiritual needs option list item ID")
    notes: Optional[str] = Field(None, description="Additional notes")
    extended_data: Optional[Dict[str, Any]] = Field(None, description="Extended data for future use")
    
    # Emergency contacts
    emergency_contacts: Optional[List[Dict[str, Any]]] = Field(None, description="Emergency contact information")


class ClientListSchema(UUIDPKBaseModelSchema):
    """Lightweight schema for client list view."""
    model_config = {"from_attributes": True}
    
    first_name: str
    last_name: str
    preferred_name: Optional[str] = None
    date_of_birth: date
    email: Optional[str] = None
    phone: Optional[str] = None
    risk_level: str
    consent_required: bool
    incomplete_documentation: bool
    
    # Related objects
    status: Optional[OptionListItemSchemaOut] = None
    primary_language: Optional[LanguageOut] = None
    
    # Computed fields
    active_referral_count: Optional[int] = 0


class ClientDetailSchema(ClientListSchema):
    """Extended schema for detailed client view."""
    
    # Additional fields for detail view
    address: Optional[str] = None
    interpreter_needed: bool
    cultural_identity: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    extended_data: Optional[Dict[str, Any]] = None
    
    # Computed fields - these will be added manually in the API
    display_name: Optional[str] = None
    full_name: Optional[str] = None
    age: Optional[int] = None


class ClientSearchSchema(Schema):
    """Simple schema for client search parameters."""
    
    search: Optional[str] = Field(None, description="Search term for name, email, or phone")
    status_id: Optional[str] = Field(None, description="Filter by status")
    risk_level: Optional[str] = Field(None, description="Filter by risk level")
    primary_language_id: Optional[str] = Field(None, description="Filter by primary language")
    interpreter_needed: Optional[bool] = Field(None, description="Filter by interpreter requirement")
    consent_required: Optional[bool] = Field(None, description="Filter by consent requirement")
    incomplete_documentation: Optional[bool] = Field(None, description="Filter by documentation status")


class ClientStatsSchema(Schema):
    """Schema for client statistics."""
    
    total_clients: int
    active_clients: int
    high_risk_clients: int
    clients_needing_interpreter: int
    clients_with_incomplete_docs: int
    age_distribution: Dict[str, int]
    language_distribution: Dict[str, int]
    risk_distribution: Dict[str, int]


# Emergency Contact schemas for client management
class ClientEmergencyContactSchemaIn(Schema):
    """Schema for creating/updating emergency contacts."""
    
    relationship_id: int = Field(..., description="Emergency contact relationship type ID")
    first_name: str = Field(..., description="Emergency contact first name")
    last_name: str = Field(..., description="Emergency contact last name")
    phone: str = Field(..., description="Emergency contact phone number")
    email: Optional[str] = Field(None, description="Emergency contact email address")
    is_primary: bool = Field(False, description="Whether this is the primary emergency contact")
    priority_order: int = Field(1, description="Priority order for contacting")


class ClientEmergencyContactSchemaOut(UUIDPKBaseModelSchema):
    """Schema for emergency contact output."""
    model_config = {"from_attributes": True}
    
    relationship: OptionListItemSchemaOut
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    is_primary: bool
    priority_order: int
    
    # Computed properties
    full_name: Optional[str] = None
    
    # Audit fields
    created_at: datetime
    updated_at: datetime