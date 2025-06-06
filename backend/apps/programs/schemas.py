from ninja import Schema
from uuid import UUID
from typing import List, Optional, Union
from datetime import date, datetime

# Input schema for staff assignments within ServiceProgramIn
class ServiceAssignedStaffIn(Schema):
    staff_id: int  # User model PK is likely int (default Django User)
    role: str
    fte: float = 1.0
    is_responsible: bool = False
    start_date: Optional[date] = None
    end_date: Optional[date] = None

# Output schema for simple option list items
class SimpleOptionListItemOut(Schema):
    id: int
    name: str
    slug: str # Renamed from 'value', corresponds to OptionListItem.slug

# Input schema for creating/updating a ServiceProgram
class ServiceProgramIn(Schema):
    name: str
    description: Optional[str] = None
    status: Optional[str] = None # e.g., 'draft', 'active', 'inactive', 'archived'
    start_date: date # Made required to match model
    end_date: Optional[date] = None
    service_types: List[int] = []       # List of OptionListItem IDs
    delivery_modes: List[int] = []      # List of OptionListItem IDs
    locations: List[int] = []           # List of OptionListItem IDs
    funding_agencies: List[int] = []    # List of OptionListItem IDs
    cultural_groups: List[int] = []     # List of OptionListItem IDs
    staff_input: Optional[List[ServiceAssignedStaffIn]] = None
    extra_data: Optional[dict] = None

# Output schema for staff assignments
class ServiceAssignedStaffOut(Schema):
    id: UUID # PK of ServiceAssignedStaff model instance
    staff_id: int # PK of the User/Staff model
    staff_first_name: Optional[str] = None
    staff_last_name: Optional[str] = None
    role: str
    fte: float
    is_responsible: bool
    start_date: date
    end_date: Optional[date]

# Output schema for a ServiceProgram
class ServiceProgramOut(Schema):
    id: UUID
    name: str
    description: Optional[str]
    status: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    service_types: List[SimpleOptionListItemOut] = []
    delivery_modes: List[SimpleOptionListItemOut] = []
    locations: List[SimpleOptionListItemOut] = []
    funding_agencies: List[SimpleOptionListItemOut] = []
    cultural_groups: List[SimpleOptionListItemOut] = []
    staff: List[ServiceAssignedStaffOut] = []
    extra_data: Optional[dict] = None

    # Audit and sync fields from FactTableBaseModel
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[Union[UUID, int]] = None # User PK can be int or UUID
    updated_by_id: Optional[Union[UUID, int]] = None # User PK can be int or UUID
    last_synced_at: Optional[datetime] = None

# Schema for batch option list response
class BatchOptionListsOut(Schema):
    service_types: List[SimpleOptionListItemOut]
    delivery_modes: List[SimpleOptionListItemOut]
    locations: List[SimpleOptionListItemOut]
    # Add other option lists as needed, e.g., funding_agencies, cultural_groups, roles

# Input schema for creating/updating an Enrolment
class EnrolmentIn(Schema):
    client_id: UUID # Reverted to UUID as Client model will now have UUID PK
    service_program_id: UUID
    enrolment_date: date
    start_date: date
    end_date: Optional[date] = None
    status: str # e.g., 'active', 'pending', 'completed', 'cancelled'
    exit_reason_id: Optional[int] = None # FK to OptionListItem
    exit_notes: Optional[str] = None
    notes: Optional[str] = None # Added notes field
    extra_data: Optional[dict] = None

# Input schema for updating an Enrolment (all fields optional)
class EnrolmentUpdateIn(Schema):
    client_id: Optional[UUID] = None 
    service_program_id: Optional[UUID] = None
    enrolment_date: Optional[date] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None # e.g., 'active', 'pending', 'completed', 'cancelled'
    exit_reason_id: Optional[int] = None # FK to OptionListItem
    exit_notes: Optional[str] = None
    notes: Optional[str] = None
    extra_data: Optional[dict] = None

# Output schema for an Enrolment
class EnrolmentOut(Schema):
    id: UUID
    client_id: UUID # Consider SimpleClientOut if more client details are needed
    service_program_id: UUID # Consider SimpleServiceProgramOut if more program details are needed
    enrolment_date: date
    start_date: date
    end_date: Optional[date]
    status: SimpleOptionListItemOut # Changed from str
    exit_reason: Optional[SimpleOptionListItemOut] = None
    exit_notes: Optional[str]
    notes: Optional[str] = None # Added general notes field
    extra_data: Optional[dict]

    # Audit and sync fields from FactTableBaseModel
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[Union[UUID, int]] = None # User PK can be int or UUID
    updated_by_id: Optional[Union[UUID, int]] = None # User PK can be int or UUID
    last_synced_at: Optional[datetime] = None
