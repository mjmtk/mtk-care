from ninja import Schema
from pydantic import EmailStr
from typing import Optional, List
import uuid
from datetime import datetime
from apps.optionlists.schemas import OptionListItemSchemaOut
from apps.common.schemas import UserAuditSchema

# Forward declaration for ExternalOrganisationSchemaOut's 'contacts' field
class ExternalOrganisationContactSchemaOut(Schema):
    pass

class PhoneNumberSchemaOut(Schema):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    number: str
    type: OptionListItemSchemaOut
    is_active: bool
    is_primary: Optional[bool] = False
    contact_id: Optional[uuid.UUID] = None
    organisation_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UserAuditSchema] = None
    updated_by: Optional[UserAuditSchema] = None

class PhoneNumberSchemaIn(Schema):
    number: str
    type_id: int
    is_primary: Optional[bool] = False
    is_active: Optional[bool] = True
    contact_id: Optional[uuid.UUID] = None
    organisation_id: Optional[uuid.UUID] = None
    notes: Optional[str] = None

class EmailAddressSchemaOut(Schema):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    email: EmailStr
    type: OptionListItemSchemaOut
    is_active: bool
    is_primary: Optional[bool] = False
    contact_id: Optional[uuid.UUID] = None
    organisation_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UserAuditSchema] = None
    updated_by: Optional[UserAuditSchema] = None

class EmailAddressSchemaIn(Schema):
    email: EmailStr
    type_id: int
    is_primary: Optional[bool] = False
    is_active: Optional[bool] = True
    contact_id: Optional[uuid.UUID] = None
    organisation_id: Optional[uuid.UUID] = None

# Define ExternalOrganisationSchemaOut first
class ExternalOrganisationSchemaOut(Schema):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    name: str
    type: OptionListItemSchemaOut
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_active: bool
    contacts: List['ExternalOrganisationContactSchemaOut'] = [] # Use forward reference here
    phones: List[PhoneNumberSchemaOut] = []
    emails: List[EmailAddressSchemaOut] = []
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UserAuditSchema] = None
    updated_by: Optional[UserAuditSchema] = None

# Now define ExternalOrganisationContactSchemaOut, which depends on ExternalOrganisationSchemaOut
class ExternalOrganisationContactSchemaOut(Schema):
    model_config = {"from_attributes": True}
    id: uuid.UUID
    organisation: ExternalOrganisationSchemaOut # Direct type hint
    first_name: str
    last_name: str
    job_title: Optional[str] = None
    is_active: bool
    notes: Optional[str] = None
    phones: List[PhoneNumberSchemaOut] = []
    emails: List[EmailAddressSchemaOut] = []
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UserAuditSchema] = None
    updated_by: Optional[UserAuditSchema] = None

class ExternalOrganisationContactSchemaIn(Schema):
    organisation_id: uuid.UUID
    first_name: str
    last_name: str
    job_title: Optional[str] = None
    is_active: Optional[bool] = True
    notes: Optional[str] = None

class ExternalOrganisationSchemaIn(Schema):
    name: str
    type_id: int
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    is_active: Optional[bool] = True

# Schemas for Batch Dropdowns
class ExtOrgDropdownItemOut(Schema):
    id: int
    slug: str
    name: str  # Primary display field from OptionListItem.name
    label: Optional[str] = None # Optional, more descriptive from OptionListItem.label

class ExternalOrganisationBatchDropdownsOut(Schema):
    external_organisation_types: List[ExtOrgDropdownItemOut]
    # Future: Add other dropdowns like organisation_statuses etc.

# Resolve circular dependencies
ExternalOrganisationContactSchemaOut.model_rebuild()
ExternalOrganisationSchemaOut.model_rebuild()
