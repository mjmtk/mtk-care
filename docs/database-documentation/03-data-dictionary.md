# MTK Care Data Dictionary

## Business Terminology & Definitions

This document provides comprehensive definitions of business terms, field meanings, and data constraints used throughout the MTK Care database schema.

## Core Business Entities

### Client Management

#### Client (`client_management_Client`)

| Field | Type | Description | Business Rules | Cultural Context |
|-------|------|-------------|----------------|------------------|
| `first_name` | VARCHAR(100) | Legal first name | Required for identification | May differ from preferred name |
| `last_name` | VARCHAR(100) | Legal surname/family name | Required for identification | Cultural naming conventions respected |
| `preferred_name` | VARCHAR(100) | Name client wishes to be called | Optional but important for cultural respect | May include traditional Māori names |
| `date_of_birth` | DATE | Client's date of birth | Must be in past; used for age-based eligibility | Required for service age restrictions |
| `iwi_hapu` | FK to OptionListItem | Iwi or hapū affiliation | Optional; culturally significant for Māori clients | Links to traditional Māori tribal groups |
| `spiritual_needs` | FK to OptionListItem | Religious/spiritual preferences | Optional; impacts service delivery approach | Includes traditional Māori spiritual practices |
| `cultural_identity` | JSON | Extended cultural information | Flexible structure for diverse backgrounds | Supports multicultural New Zealand context |
| `risk_level` | VARCHAR(20) | Safety risk assessment | Enum: LOW, MEDIUM, HIGH, CRITICAL | Determines security protocols |
| `interpreter_needed` | BOOLEAN | Requires language interpretation | Impacts service delivery planning | Essential for non-English speakers |

#### Emergency Contact (`client_management_ClientEmergencyContact`)

| Field | Type | Description | Business Rules | Cultural Context |
|-------|------|-------------|----------------|------------------|
| `relationship` | FK to OptionListItem | Relationship to client | Required; from predefined list | Includes whānau (extended family) concepts |
| `is_primary` | BOOLEAN | Primary emergency contact | Only one primary per client | First contacted in emergencies |
| `priority_order` | INTEGER | Contact order preference | Unique per client; determines sequence | Respects family hierarchy preferences |
| `availability_notes` | TEXT | When contact is available | Free text for complex schedules | Accommodates traditional work patterns |

### Referral Management

#### Referral (`referral_management_Referral`)

| Field | Type | Description | Business Rules | Program Context |
|-------|------|-------------|----------------|-----------------|
| `type` | VARCHAR(20) | Referral classification | Enum: INTERNAL, EXTERNAL, SELF | Determines workflow path |
| `status` | FK to OptionListItem | Current referral status | From configurable status list | Tracks progress through system |
| `priority` | FK to OptionListItem | Urgency level | HIGH, MEDIUM, LOW, ROUTINE | Affects response timeframes |
| `service_type` | FK to OptionListItem | Type of service requested | Must match program capabilities | Determines program eligibility |
| `client_type` | VARCHAR(20) | New, existing, or self-referral | Enum: NEW_CLIENT, EXISTING_CLIENT, SELF | Affects onboarding process |
| `referral_source` | VARCHAR(30) | Origin of referral | Enum: GP, SCHOOL, POLICE, etc. | Required for reporting |
| `requires_approval` | BOOLEAN | Needs supervisor approval | Based on risk level and program | Additional oversight for complex cases |
| `program_data` | JSON | Program-specific information | Structure varies by target program | Flexible data collection per service |

#### Consent Record (`referral_management_ConsentRecord`)

| Field | Type | Description | Business Rules | Legal Context |
|-------|------|-------------|----------------|---------------|
| `consent_type` | FK to OptionListItem | Type of consent | SERVICE, INFORMATION_SHARING, etc. | Legal requirement categories |
| `status` | VARCHAR(20) | Consent status | PENDING, OBTAINED, DECLINED, WITHDRAWN, EXPIRED | Legal validity indicator |
| `consent_date` | DATE | When consent was given | Required if status is OBTAINED | Legal effective date |
| `expiry_date` | DATE | When consent expires | Optional; program-dependent | Ensures ongoing validity |
| `withdrawal_reason` | TEXT | Why consent was withdrawn | Required if status is WITHDRAWN | Legal documentation requirement |

### Program Management

#### Program (`programs_Program`)

| Field | Type | Description | Business Rules | Service Context |
|-------|------|-------------|----------------|-----------------|
| `name` | VARCHAR(128) | Program name | Unique within organization | Clear service identification |
| `status` | VARCHAR(20) | Program operational status | ACTIVE, INACTIVE, SUSPENDED | Affects new enrollments |
| `start_date` | DATE | Program commencement | Required; affects enrollment eligibility | Service availability period |
| `end_date` | DATE | Program conclusion | Optional; if set, no new enrollments after | Funding period constraint |
| `enrolment_schema` | JSON | Custom enrollment fields | Program-specific data requirements | Flexible per service needs |
| `referral_schema` | JSON | Custom referral fields | Program-specific intake data | Tailored data collection |

#### Enrolment (`programs_Enrolment`)

| Field | Type | Description | Business Rules | Service Context |
|-------|------|-------------|----------------|-----------------|
| `enrolment_date` | DATE | Date enrolled in program | Required; usually referral acceptance date | Service commencement |
| `start_date` | DATE | Actual service start | May differ from enrollment; can be future | First service delivery |
| `end_date` | DATE | Service completion | Optional; set when service ends | Service conclusion |
| `episode_number` | VARCHAR(32) | Service episode identifier | Unique per client-program combination | Multiple episodes allowed |
| `exit_reason` | FK to OptionListItem | Why service ended | Required if end_date is set | Outcome classification |

### Document Management

#### Document (`common_Document`)

| Field | Type | Description | Business Rules | Storage Context |
|-------|------|-------------|----------------|-----------------|
| `file_name` | VARCHAR(255) | Document filename | Generated; may differ from original | SharePoint storage name |
| `original_filename` | VARCHAR(255) | User's original filename | Preserved for reference | User-friendly identification |
| `folder_category` | VARCHAR(50) | Document classification | Enum: IDENTIFICATION, MEDICAL, LEGAL, etc. | Organizational structure |
| `type` | FK to OptionListItem | Specific document type | From configurable type list | Detailed classification |
| `access_level` | VARCHAR(20) | Security classification | PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED | Access control |
| `is_confidential` | BOOLEAN | Contains sensitive information | Affects access permissions | Additional security flag |
| `version` | VARCHAR(20) | Document version | Auto-incremented; format: v1.0 | Version control |
| `superseded_by` | FK to Document | Newer version reference | Links to current version | Version chain |

### External Organizations

#### External Organisation (`external_organisation_management_ExternalOrganisation`)

| Field | Type | Description | Business Rules | Partnership Context |
|-------|------|-------------|----------------|---------------------|
| `name` | VARCHAR(255) | Organization name | Unique; official name preferred | Partner identification |
| `type` | FK to OptionListItem | Organization category | GP_PRACTICE, SCHOOL, GOVERNMENT, etc. | Service classification |
| `is_active` | BOOLEAN | Currently operational | Affects new referrals | Partnership status |

### User Management

#### User (`users_User`)
Extended Django User model with MTK Care customizations.

| Field | Type | Description | Business Rules | Security Context |
|-------|------|-------------|----------------|------------------|
| `username` | VARCHAR(150) | Login identifier | Unique; often email address | Authentication key |
| `email` | EMAIL(254) | Email address | Used for notifications | Communication channel |
| `is_active` | BOOLEAN | Account enabled | Disabled users cannot login | Access control |

#### Role (`users_Role`)

| Field | Type | Description | Business Rules | Permission Context |
|-------|------|-------------|----------------|-------------------|
| `name` | VARCHAR(100) | Role name | Unique; descriptive name | Permission grouping |
| `level` | INTEGER | Hierarchy level | 0=Superuser, 7=RestrictedUser | Access hierarchy |
| `is_system_role` | BOOLEAN | System-defined role | Cannot be deleted by users | Core role protection |
| `custom_permissions` | JSON | Additional permissions | Flexible permission extension | CASL-compatible format |

## Data Types & Constraints

### Standard Field Types

| Django Type | Database Type | Description | Usage |
|-------------|---------------|-------------|-------|
| `UUIDField` | UUID | 128-bit identifier | Primary keys (security) |
| `CharField` | VARCHAR(n) | Variable text | Names, codes, short text |
| `TextField` | TEXT | Long text | Notes, descriptions |
| `DateField` | DATE | Date only | Birth dates, service dates |
| `DateTimeField` | TIMESTAMP | Date and time | Audit timestamps |
| `BooleanField` | BOOLEAN | True/False | Flags, status indicators |
| `JSONField` | JSON/JSONB | Structured data | Flexible configurations |
| `EmailField` | VARCHAR(254) | Email format | Email addresses |
| `DecimalField` | NUMERIC | Precise numbers | Currency, FTE values |

### Enumeration Values

#### Risk Levels
- `LOW`: Standard protocols apply
- `MEDIUM`: Additional precautions required  
- `HIGH`: Enhanced security measures
- `CRITICAL`: Maximum security protocols

#### Referral Types
- `INTERNAL`: From within the organization
- `EXTERNAL`: From partner organizations
- `SELF`: Client self-referral

#### Client Types
- `NEW_CLIENT`: First interaction with organization
- `EXISTING_CLIENT`: Previously served client
- `SELF`: Self-referral client

#### Document Access Levels
- `PUBLIC`: Available to all staff
- `INTERNAL`: Staff only with business need
- `CONFIDENTIAL`: Restricted access required
- `RESTRICTED`: Supervisor approval required

#### Program Status
- `ACTIVE`: Accepting new enrollments
- `INACTIVE`: No new enrollments
- `SUSPENDED`: Temporarily unavailable

### Business Rules & Validations

#### Date Validations
- `date_of_birth` must be in the past
- `start_date` must be ≤ `end_date` when both present
- `consent_date` must be ≤ today
- `expiry_date` must be > `consent_date` when present

#### Referential Integrity
- Clients cannot be hard-deleted if referrals exist
- Programs cannot be deleted if enrollments exist
- Documents must belong to existing client or referral
- Users cannot be deleted if they created audit records

#### Cultural Sensitivity Rules
- Preferred names take precedence in user interfaces
- Iwi/hapū information displayed respectfully
- Spiritual needs considered in service planning
- Te Reo Māori language prioritized in dropdowns

#### Security Constraints
- User passwords must meet complexity requirements
- Document access logged for audit compliance
- Personal information encrypted at rest
- Session timeouts enforce security policies

## Option List Categories

### Configurable Dropdowns

These business values are stored in `optionlists_OptionList` and `optionlists_OptionListItem`:

#### Client-Related
- **Ethnicity**: Cultural background classifications
- **Gender Identity**: Self-identified gender options
- **Pronouns**: Preferred pronoun usage
- **Primary Identity**: Main cultural identification
- **Secondary Identity**: Additional cultural affiliations
- **Iwi/Hapū**: Māori tribal affiliations
- **Spiritual Needs**: Religious/spiritual preferences

#### Referral-Related
- **Referral Types**: Classification of referral sources
- **Referral Statuses**: Current referral state
- **Referral Priorities**: Urgency classifications
- **Service Types**: Available service categories
- **Decline Reasons**: Why referrals are declined

#### Document-Related
- **Document Types**: Specific document classifications
- **Document Categories**: Broad organizational groupings

#### Contact-Related
- **Phone Types**: Mobile, home, work, emergency
- **Email Types**: Personal, work, emergency
- **Emergency Contact Relationships**: Family, friend, professional

#### Program-Related
- **Program Types**: Service delivery categories
- **Delivery Modes**: In-person, virtual, hybrid
- **Funding Agencies**: Program funding sources
- **Exit Reasons**: Why enrollments end
- **Enrollment Statuses**: Current enrollment state

### Reference Data

#### Languages (`reference_data_Language`)
- Standardized language codes (ISO 639)
- Prioritized for New Zealand context (Te Reo Māori first)
- Used for interpreter requirements

#### Countries (`reference_data_Country`)
- ISO country codes
- Used for address validation and reporting

## Audit & Compliance Fields

### Universal Audit Pattern
Every business entity includes these audit fields:

| Field | Type | Purpose | Compliance Note |
|-------|------|---------|-----------------|
| `created_at` | TIMESTAMP | Record creation time | Immutable audit trail |
| `updated_at` | TIMESTAMP | Last modification time | Change tracking |
| `created_by` | FK to User | Creating user | Accountability |
| `updated_by` | FK to User | Last modifying user | Change responsibility |
| `is_deleted` | BOOLEAN | Soft delete flag | Data retention |
| `deleted_at` | TIMESTAMP | Deletion timestamp | Audit preservation |
| `deleted_by` | FK to User | Deleting user | Deletion accountability |
| `last_synced_at` | TIMESTAMP | External sync time | Integration tracking |

### Compliance Annotations

#### Privacy Act 2020 (NZ)
- Personal information clearly identified
- Access controls documented
- Retention periods specified
- Deletion procedures defined

#### Children's Act 2014 (NZ)
- Special protections for child client data
- Guardian consent requirements
- Information sharing limitations
- Safety override procedures

#### Health Information Privacy Code
- Health information identification
- Authorized access definitions
- Disclosure logging requirements
- Security safeguard specifications

This data dictionary serves as the authoritative reference for understanding data meaning, constraints, and business context within the MTK Care system.