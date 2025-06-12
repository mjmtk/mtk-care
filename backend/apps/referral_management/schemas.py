from ninja import Schema
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import date, datetime
from apps.common.schemas import UserAuditSchema

# Input schemas for creating/updating referrals
class ReferralSchemaIn(Schema):
    type: str
    status_id: int
    priority_id: int
    service_type_id: Optional[int] = None
    reason: str
    client_type: str = 'new'
    client_id: Optional[UUID] = None
    referral_date: date
    accepted_date: Optional[date] = None
    completed_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    client_consent_date: Optional[date] = None
    notes: Optional[str] = None
    external_organisation_id: Optional[UUID] = None
    external_organisation_contact_id: Optional[UUID] = None
    # New fields for program-specific functionality
    referral_source: str = 'external_agency'
    external_reference_number: Optional[str] = None
    target_program_id: Optional[UUID] = None
    program_data: Dict[str, Any] = {}
    
    # New client fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gender_id: Optional[int] = None
    
    # Cultural identity fields
    iwi_hapu_id: Optional[int] = None
    spiritual_needs_id: Optional[int] = None
    primary_language_id: Optional[int] = None
    interpreter_needed: bool = False
    
    # Emergency contacts and consent records
    emergency_contacts: Optional[List[Dict[str, Any]]] = None
    consent_records: Optional[List[Dict[str, Any]]] = None

class ReferralUpdateSchemaIn(Schema):
    type: Optional[str] = None
    status_id: Optional[int] = None
    priority_id: Optional[int] = None
    service_type_id: Optional[int] = None
    reason: Optional[str] = None
    client_type: Optional[str] = None
    client_id: Optional[UUID] = None
    referral_date: Optional[date] = None
    accepted_date: Optional[date] = None
    completed_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    client_consent_date: Optional[date] = None
    notes: Optional[str] = None
    external_organisation_id: Optional[UUID] = None
    external_organisation_contact_id: Optional[UUID] = None
    # New fields for program-specific functionality
    referral_source: Optional[str] = None
    external_reference_number: Optional[str] = None
    target_program_id: Optional[UUID] = None
    program_data: Optional[Dict[str, Any]] = None
    
    # New client fields
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gender_id: Optional[int] = None
    
    # Cultural identity fields
    iwi_hapu_id: Optional[int] = None
    spiritual_needs_id: Optional[int] = None
    primary_language_id: Optional[int] = None
    interpreter_needed: Optional[bool] = None
    
    # Emergency contacts and consent records
    emergency_contacts: Optional[List[Dict[str, Any]]] = None
    consent_records: Optional[List[Dict[str, Any]]] = None

# Client basic info for referral display
class ReferralClientSchemaOut(Schema):
    model_config = {"from_attributes": True}
    
    id: UUID
    first_name: str
    last_name: str
    preferred_name: Optional[str] = None
    date_of_birth: date
    email: Optional[str] = None
    phone: Optional[str] = None

# Output schemas for referral data
class ReferralSchemaOut(Schema):
    model_config = {
        "from_attributes": True,
        "exclude_unset": True,
        "use_enum_values": True
    }
    
    id: UUID
    type: str
    status: "OptionListItemSchemaOut"
    priority: "OptionListItemSchemaOut"
    service_type: Optional["OptionListItemSchemaOut"] = None
    reason: str
    client_type: str
    client_id: Optional[UUID] = None
    client: Optional[ReferralClientSchemaOut] = None
    referral_date: date
    accepted_date: Optional[date] = None
    completed_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    client_consent_date: Optional[date] = None
    notes: Optional[str] = None
    external_organisation_id: Optional[UUID] = None
    external_organisation_contact_id: Optional[UUID] = None
    # New fields for program-specific functionality
    referral_source: str
    external_reference_number: Optional[str] = None
    target_program: Optional["ProgramBasicSchemaOut"] = None
    program_data: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    created_by: UserAuditSchema
    updated_by: UserAuditSchema

# OptionList item schema for dropdowns
class OptionListItemSchemaOut(Schema):
    model_config = {"from_attributes": True}
    
    id: int
    label: str
    slug: str
    description: Optional[str] = None
    is_active: bool

# Simple choice schema for referral types
class ReferralTypeChoice(Schema):
    value: str
    label: str

# Simple choice schema for referral sources
class ReferralSourceChoice(Schema):
    value: str
    label: str

# Basic program info for referral display
class ProgramBasicSchemaOut(Schema):
    model_config = {"from_attributes": True}
    
    id: UUID
    name: str
    status: str

# Batch dropdown response schema
class ReferralBatchDropdownsSchemaOut(Schema):
    referral_types: list[ReferralTypeChoice]
    referral_sources: list[ReferralSourceChoice]
    referral_statuses: list[OptionListItemSchemaOut]
    referral_priorities: list[OptionListItemSchemaOut]
    referral_service_types: list[OptionListItemSchemaOut]
    programs: list[ProgramBasicSchemaOut]

# Status update schema
class ReferralStatusUpdateSchemaIn(Schema):
    status_id: int

# Paginated response schema
class ReferralListResponse(Schema):
    items: list[ReferralSchemaOut]
    total: int
    page: int
    limit: int
    total_pages: int

# Form schema for dynamic field generation
class FormFieldSchema(Schema):
    name: str
    type: str  # 'string', 'number', 'date', 'select', 'optionlist', 'boolean'
    label: str
    required: bool = False
    help_text: Optional[str] = None
    choices: Optional[list[Dict[str, str]]] = None
    option_list_slug: Optional[str] = None
    validation: Optional[Dict[str, Any]] = None

class ProgramFormSchemaOut(Schema):
    program_id: UUID
    program_name: str
    fields: list[FormFieldSchema]

# Emergency Contact schemas
class EmergencyContactSchemaIn(Schema):
    relationship_id: int
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    is_primary: bool = False
    priority_order: int = 1

class EmergencyContactSchemaOut(Schema):
    model_config = {"from_attributes": True}
    
    id: UUID
    relationship: "OptionListItemSchemaOut"
    first_name: str
    last_name: str
    phone: str
    email: Optional[str] = None
    is_primary: bool
    priority_order: int
    created_at: datetime
    updated_at: datetime

# Consent Record schemas
class ConsentRecordSchemaIn(Schema):
    consent_type_id: int
    status: str = 'pending'
    consent_date: Optional[date] = None
    withdrawal_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None
    document_id: Optional[UUID] = None

class ConsentRecordSchemaOut(Schema):
    model_config = {"from_attributes": True}
    
    id: UUID
    consent_type: "OptionListItemSchemaOut"
    status: str
    consent_date: Optional[date] = None
    withdrawal_date: Optional[date] = None
    expiry_date: Optional[date] = None
    notes: Optional[str] = None
    document: Optional["DocumentSchemaOut"] = None
    obtained_by: Optional[UserAuditSchema] = None
    withdrawn_by: Optional[UserAuditSchema] = None
    withdrawal_reason: Optional[str] = None
    is_active: bool
    days_until_expiry: Optional[int] = None
    created_at: datetime
    updated_at: datetime

# Document schema (basic)
class DocumentSchemaOut(Schema):
    model_config = {"from_attributes": True}
    
    id: UUID
    name: str
    type: "OptionListItemSchemaOut"
    file_path: Optional[str] = None
    sharepoint_url: Optional[str] = None
    created_at: datetime
