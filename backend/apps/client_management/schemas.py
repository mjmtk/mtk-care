from typing import Optional, Dict, Any
from datetime import date
from ninja import Schema
from pydantic import Field
from apps.common.schemas import UUIDPKBaseModelSchema
from apps.optionlists.schemas import OptionListItemSchemaOut
from apps.reference_data.schemas import LanguageOut


class ClientCreateSchema(Schema):
    """Lightweight schema for creating a new client."""
    
    # Required fields
    first_name: str = Field(..., description="Client's first name")
    last_name: str = Field(..., description="Client's last name")
    date_of_birth: date = Field(..., description="Client's date of birth")
    status_id: str = Field(..., description="Client status option list item ID")
    
    # Optional personal information
    preferred_name: Optional[str] = Field(None, description="Preferred name")
    email: Optional[str] = Field(None, description="Primary email address")
    phone: Optional[str] = Field(None, description="Primary phone number")
    address: Optional[str] = Field(None, description="Full address")
    
    # Optional status and language
    primary_language_id: Optional[str] = Field(None, description="Primary language option list item ID")
    interpreter_needed: Optional[bool] = Field(False, description="Whether interpreter is needed")
    
    # Risk and safety
    risk_level: Optional[str] = Field("low", description="Risk assessment level (low, medium, high)")
    consent_required: Optional[bool] = Field(True, description="Whether consent is required")
    incomplete_documentation: Optional[bool] = Field(False, description="Whether documentation is incomplete")
    
    # Cultural and additional information
    cultural_identity: Optional[Dict[str, Any]] = Field(None, description="Cultural identity information")
    notes: Optional[str] = Field(None, description="Additional notes")
    extended_data: Optional[Dict[str, Any]] = Field(None, description="Extended data for future use")


class ClientUpdateSchema(Schema):
    """Lightweight schema for updating an existing client."""
    
    # All fields are optional for updates
    first_name: Optional[str] = Field(None, description="Client's first name")
    last_name: Optional[str] = Field(None, description="Client's last name")
    preferred_name: Optional[str] = Field(None, description="Preferred name")
    date_of_birth: Optional[date] = Field(None, description="Client's date of birth")
    
    # Contact information
    email: Optional[str] = Field(None, description="Primary email address")
    phone: Optional[str] = Field(None, description="Primary phone number")
    address: Optional[str] = Field(None, description="Full address")
    
    # Status and language
    status_id: Optional[str] = Field(None, description="Client status option list item ID")
    primary_language_id: Optional[str] = Field(None, description="Primary language option list item ID")
    interpreter_needed: Optional[bool] = Field(None, description="Whether interpreter is needed")
    
    # Risk and safety
    risk_level: Optional[str] = Field(None, description="Risk assessment level (low, medium, high)")
    consent_required: Optional[bool] = Field(None, description="Whether consent is required")
    incomplete_documentation: Optional[bool] = Field(None, description="Whether documentation is incomplete")
    
    # Cultural and additional information
    cultural_identity: Optional[Dict[str, Any]] = Field(None, description="Cultural identity information")
    notes: Optional[str] = Field(None, description="Additional notes")
    extended_data: Optional[Dict[str, Any]] = Field(None, description="Extended data for future use")


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