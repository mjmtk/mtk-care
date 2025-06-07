from ninja import Schema
from typing import Optional
from uuid import UUID
from datetime import date, datetime
from apps.common.schemas import UserAuditSchema

# Input schemas for creating/updating referrals
class ReferralSchemaIn(Schema):
    type_id: int
    status_id: int
    priority_id: int
    service_type_id: int
    reason: str
    client_type: str = 'new'
    # client_id: Optional[UUID] = None  # Temporarily removed until client_management app is implemented
    referral_date: date
    accepted_date: Optional[date] = None
    completed_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    client_consent_date: Optional[date] = None
    notes: Optional[str] = None
    external_organisation_id: Optional[UUID] = None
    external_organisation_contact_id: Optional[UUID] = None

class ReferralUpdateSchemaIn(Schema):
    type_id: Optional[int] = None
    status_id: Optional[int] = None
    priority_id: Optional[int] = None
    service_type_id: Optional[int] = None
    reason: Optional[str] = None
    client_type: Optional[str] = None
    # client_id: Optional[UUID] = None  # Temporarily removed until client_management app is implemented
    referral_date: Optional[date] = None
    accepted_date: Optional[date] = None
    completed_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    client_consent_date: Optional[date] = None
    notes: Optional[str] = None
    external_organisation_id: Optional[UUID] = None
    external_organisation_contact_id: Optional[UUID] = None

# Output schemas for referral data
class ReferralSchemaOut(Schema):
    model_config = {"from_attributes": True}
    
    id: UUID
    type: "OptionListItemSchemaOut"
    status: "OptionListItemSchemaOut"
    priority: "OptionListItemSchemaOut"
    service_type: "OptionListItemSchemaOut"
    reason: str
    client_type: str
    # client_id: Optional[UUID] = None  # Temporarily removed until client_management app is implemented
    referral_date: date
    accepted_date: Optional[date] = None
    completed_date: Optional[date] = None
    follow_up_date: Optional[date] = None
    client_consent_date: Optional[date] = None
    notes: Optional[str] = None
    external_organisation_id: Optional[UUID] = None
    external_organisation_contact_id: Optional[UUID] = None
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

# Batch dropdown response schema
class ReferralBatchDropdownsSchemaOut(Schema):
    referral_types: list[OptionListItemSchemaOut]
    referral_statuses: list[OptionListItemSchemaOut]
    referral_priorities: list[OptionListItemSchemaOut]
    referral_service_types: list[OptionListItemSchemaOut]

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
