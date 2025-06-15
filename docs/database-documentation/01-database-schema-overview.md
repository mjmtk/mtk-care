# MTK Care Database Schema Documentation

## Executive Summary

The MTK Care database supports a comprehensive case management system for community services organizations, with particular focus on counselling services for New Zealand children and families. The system is built on PostgreSQL with Django ORM, featuring UUID primary keys, comprehensive audit trails, and flexible data structures to support cultural sensitivity and evolving requirements.

## Architecture Overview

### Core Design Principles

1. **UUID Primary Keys**: All entities use UUID primary keys for better security, distributed systems support, and elimination of enumeration attacks
2. **Comprehensive Audit Trail**: Every entity includes creation/update timestamps, user tracking, and soft delete capabilities
3. **Cultural Sensitivity**: Special support for Māori cultural identity, iwi/hapū affiliation, and spiritual needs
4. **Flexible Data Storage**: Extensive use of JSON fields for extensible metadata and program-specific customization
5. **Multi-tenancy Ready**: Organization-scoped data with support for templates and instances

### Database Statistics

- **Total Tables**: 23 core entities plus Django system tables
- **Total Relationships**: 150+ foreign key relationships
- **Apps/Modules**: 10 functional areas
- **Primary Business Entities**: Users, Clients, Referrals, Programs, Documents, External Organizations

## Core Entity Groups

### 1. Identity & Access Management

**Primary Tables**: `users_User`, `users_Role`, `users_UserProfile`, `users_GroupRoleMapping`, `authentication_UserProfile`

**Purpose**: Manages user authentication, role-based access control, and Azure AD integration

**Key Features**:
- Database-driven role hierarchy (0=Superuser → 7=RestrictedUser)
- Azure AD group mapping for SSO integration
- Custom permissions via JSON storage
- User preferences and profile extensions

### 2. Client Management

**Primary Tables**: `client_management_Client`, `client_management_ClientEmergencyContact`

**Purpose**: Central client registry with cultural sensitivity and comprehensive contact management

**Key Features**:
- Cultural identity support (iwi/hapū, spiritual needs)
- Risk assessment and safety levels
- Language preferences with interpreter requirements
- Multiple emergency contacts with priority ordering
- Consent and documentation tracking

### 3. Referral & Case Management

**Primary Tables**: `referral_management_Referral`, `referral_management_ConsentRecord`

**Purpose**: Manages the complete referral lifecycle from intake to service completion

**Key Features**:
- Comprehensive approval workflow
- Multiple consent types with expiry tracking
- External organization integration
- Program assignment and staff allocation
- Status tracking with decline reasons

### 4. Service Delivery

**Primary Tables**: `programs_Program`, `programs_Enrolment`, `programs_ProgramAssignedStaff`, `programs_ProgramFunding`

**Purpose**: Service program management and client enrollment tracking

**Key Features**:
- Flexible program configuration with JSON schemas
- Staff assignments with FTE tracking
- Funding agency relationships
- Episode-based enrollment with exit tracking
- Document linkage for compliance

### 5. Document Management

**Primary Tables**: `common_Document`, `common_DocumentAuditLog`

**Purpose**: Comprehensive document lifecycle management with SharePoint integration

**Key Features**:
- Structured folder hierarchy by client/referral
- Multiple SharePoint identifiers for robust integration
- Version control and superseding relationships
- Access levels and confidentiality flags
- Complete audit trail for compliance

### 6. External Organizations

**Primary Tables**: `external_organisation_management_ExternalOrganisation`, `external_organisation_management_ExternalOrganisationContact`, `external_organisation_management_PhoneNumber`, `external_organisation_management_EmailAddress`

**Purpose**: Partner organization and contact management

**Key Features**:
- Organization type classification
- Multiple contact methods with type classification
- Activity status tracking
- Integration with referral system

### 7. Configuration & Reference Data

**Primary Tables**: `optionlists_OptionList`, `optionlists_OptionListItem`, `reference_data_Language`, `reference_data_Country`

**Purpose**: Flexible configuration system and reference data management

**Key Features**:
- Hierarchical option lists with parent-child relationships
- Organization-scoped configuration
- Template and instance pattern for multi-tenancy
- Internationalization support with Te Reo Māori priority

### 8. Supporting Systems

**Primary Tables**: `tasks_Task`, `notifications_Notification`, `audit_AuditLog`

**Purpose**: Workflow management, user notifications, and system auditing

**Key Features**:
- Task assignment with progress tracking
- User notification system with read/unread status
- System-wide audit logging with request details
- Generic object linking for flexibility

## Data Types & Constraints

### Standard Audit Fields (All Tables)
- `id`: UUID primary key
- `created_at`: Timestamp (NOT NULL)
- `updated_at`: Timestamp (NOT NULL)
- `created_by`: Foreign key to User (nullable)
- `updated_by`: Foreign key to User (nullable)
- `is_deleted`: Boolean (soft delete)
- `deleted_at`: Timestamp (nullable)
- `deleted_by`: Foreign key to User (nullable)
- `last_synced_at`: Timestamp (for integration)

### Cultural Sensitivity Fields
- `iwi_hapu`: Foreign key to option list items
- `spiritual_needs`: Foreign key to option list items
- `cultural_identity`: JSON field for flexible cultural data
- `primary_language`: Foreign key to language reference
- `interpreter_needed`: Boolean flag

### Business Logic Constraints
- Unique constraints on business identifiers (usernames, external references)
- Check constraints on status enumerations
- Date range validations (start_date ≤ end_date)
- Priority ordering for lists (emergency contacts, option items)

## Integration Points

### SharePoint Integration
- Document storage with structured folder hierarchy
- Multiple SharePoint identifiers (ID, unique ID, ETag)
- Server-relative URLs for consistent access
- Upload status tracking with error handling

### Azure AD Integration
- User profile linking via Azure Object ID (OID)
- Group role mapping for automated permissions
- Immutable identifier support for user lifecycle

### External Systems
- External organization registry for referral sources
- Program funding agency integration
- Reference data APIs for countries and languages

## Performance Considerations

### Indexing Strategy
- UUID primary keys with GIN indexes
- Foreign key indexes on all relationship fields
- Composite indexes on frequently queried combinations
- Text search indexes on names and descriptions

### Query Optimization
- Soft delete filtering in default managers
- Prefetch related for common relationships
- Select related for single foreign key lookups
- JSON field indexing for metadata queries

## Security & Compliance

### Data Protection
- Soft delete preserves audit trail
- Personal information encryption at rest
- Access level controls on documents
- IP address and user agent logging

### Audit Requirements
- Complete change history on all entities
- User action tracking with timestamps
- Request context preservation
- Document access logging for compliance

### Role-Based Access Control
- Hierarchical role structure with numeric levels
- Custom permissions via JSON storage
- Organization-scoped data access
- Program-specific role assignments

## Future Extensibility

### JSON Schema Support
- Program-specific enrollment data
- Referral customization per program type
- Client extended data for evolving requirements
- Document metadata for additional classification

### Multi-tenancy Preparation
- Organization scoping throughout
- Template/instance pattern in option lists
- Tenant-specific configuration
- Data isolation strategies

This schema provides a robust foundation for case management while maintaining flexibility for future requirements and cultural adaptations.