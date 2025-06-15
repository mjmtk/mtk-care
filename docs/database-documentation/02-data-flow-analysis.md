# MTK Care Data Flow Analysis

## Overview

This document describes how data flows through the MTK Care system, from initial client contact through service completion. The system supports multiple entry points and complex workflows while maintaining data integrity and audit trails.

## Primary Data Flow Patterns

### 1. Client Onboarding Flow

```mermaid
flowchart TD
    A[External Referral Received] --> B[Create Referral Record]
    B --> C[Client Lookup/Create]
    C --> D{Existing Client?}
    D -->|Yes| E[Link to Existing Client]
    D -->|No| F[Create New Client Record]
    E --> G[Update Client Information]
    F --> G
    G --> H[Collect Emergency Contacts]
    H --> I[Document Cultural Identity]
    I --> J[Set Risk Assessment]
    J --> K[Assign to Program]
    K --> L[Request Consent]
    L --> M[Consent Obtained?]
    M -->|Yes| N[Create Enrollment]
    M -->|No| O[Mark Referral Declined]
    N --> P[Begin Service Delivery]
```

**Key Tables Involved**:
- `referral_management_Referral` (entry point)
- `client_management_Client` (central entity)
- `client_management_ClientEmergencyContact`
- `referral_management_ConsentRecord`
- `programs_Enrolment`

### 2. Document Lifecycle Flow

```mermaid
flowchart TD
    A[Document Upload Request] --> B[Validate File Type]
    B --> C[Generate SharePoint Path]
    C --> D[Upload to SharePoint]
    D --> E{Upload Success?}
    E -->|Yes| F[Create Document Record]
    E -->|No| G[Log Error & Retry]
    F --> H[Set Access Permissions]
    H --> I[Create Audit Log Entry]
    I --> J[Notify Relevant Staff]
    J --> K[Document Available]
    K --> L[User Access Event]
    L --> M[Log Access Audit]
    M --> N{Document Update?}
    N -->|Yes| O[Create New Version]
    N -->|No| P[Continue Normal Access]
    O --> Q[Mark Previous as Superseded]
    Q --> F
```

**Key Tables Involved**:
- `common_Document` (central document metadata)
- `common_DocumentAuditLog` (access tracking)
- SharePoint integration (external storage)

### 3. Referral Processing Workflow

```mermaid
flowchart TD
    A[Referral Submitted] --> B[Initial Assessment]
    B --> C{Meets Criteria?}
    C -->|Yes| D[Assign to Program]
    C -->|No| E[Decline with Reason]
    D --> F[Staff Assignment]
    F --> G[Request Client Consent]
    G --> H{Consent Status}
    H -->|Obtained| I[Approve Referral]
    H -->|Declined| J[Close Referral]
    H -->|Pending| K[Follow-up Required]
    I --> L[Schedule Commencement]
    L --> M[Create Enrollment]
    M --> N[Begin Service Delivery]
    E --> O[Notify External Organisation]
    J --> O
    K --> P[Set Follow-up Date]
    P --> G
```

**Key Tables Involved**:
- `referral_management_Referral` (workflow state)
- `referral_management_ConsentRecord` (consent tracking)
- `programs_Enrolment` (service enrollment)
- `external_organisation_management_ExternalOrganisation` (notifications)

### 4. User Authentication & Authorization Flow

```mermaid
flowchart TD
    A[User Login] --> B{Azure AD SSO?}
    B -->|Yes| C[Validate Azure Token]
    B -->|No| D[Local Authentication]
    C --> E[Extract Azure Groups]
    D --> F[Load User Profile]
    E --> G[Map Groups to Roles]
    F --> G
    G --> H[Load User Permissions]
    H --> I[Create Session]
    I --> J[User Accesses Resource]
    J --> K[Check Permissions]
    K --> L{Authorized?}
    L -->|Yes| M[Grant Access]
    L -->|No| N[Access Denied]
    M --> O[Log Access Audit]
    N --> P[Log Security Event]
```

**Key Tables Involved**:
- `users_User` (authentication)
- `users_UserProfile` (extended profile)
- `users_Role` (role definitions)
- `users_GroupRoleMapping` (Azure AD integration)
- `audit_AuditLog` (access logging)

## Data Synchronization Patterns

### 1. Azure AD Integration

```mermaid
sequenceDiagram
    participant AAD as Azure AD
    participant App as MTK Care
    participant DB as Database
    
    AAD->>App: User Login with Groups
    App->>DB: Query Group Role Mappings
    DB->>App: Return Role Assignments
    App->>DB: Update User Profile
    App->>DB: Log Authentication Event
    Note over App,DB: Periodic group sync (planned)
```

### 2. SharePoint Document Sync

```mermaid
sequenceDiagram
    participant User as User Interface
    participant App as Django Backend
    participant SP as SharePoint
    participant DB as Database
    
    User->>App: Upload Document
    App->>SP: Create SharePoint Item
    SP->>App: Return SharePoint IDs
    App->>DB: Create Document Record
    App->>DB: Create Audit Log
    DB->>App: Confirm Storage
    App->>User: Upload Complete
    
    Note over App,SP: Periodic sync for metadata updates
```

### 3. External Organization Updates

```mermaid
sequenceDiagram
    participant Ext as External System
    participant API as MTK Care API
    participant DB as Database
    participant Users as Staff Users
    
    Ext->>API: Submit Referral
    API->>DB: Create/Update Organization
    API->>DB: Create Referral Record
    API->>DB: Log API Access
    DB->>API: Return Referral ID
    API->>Ext: Confirm Receipt
    API->>Users: Notify New Referral
```

## Data Validation & Integrity Patterns

### 1. Business Rule Enforcement

**Client Data Validation**:
- Date of birth must be in the past
- Risk level must be valid enum value
- Primary language must exist in reference data
- Emergency contacts require phone number

**Referral Validation**:
- Referral date cannot be in future
- Client consent required for most services
- Program assignment must match service type
- Staff assignment requires active user

**Document Validation**:
- File type must be in allowed list
- Client/referral must exist before document upload
- Access level must match user permissions
- SharePoint path must follow naming convention

### 2. Audit Trail Consistency

**Universal Audit Pattern**:
```sql
-- Every business operation creates audit records
INSERT INTO audit_auditlog (user_id, action, resource, resource_id, timestamp)
VALUES (current_user_id, 'CREATE', 'Client', new_client_id, NOW());

-- Model-level audit fields updated automatically
UPDATE client_management_client 
SET updated_at = NOW(), updated_by = current_user_id
WHERE id = target_client_id;
```

### 3. Soft Delete Cascade

When a record is soft-deleted, related records follow business rules:
- **Client deletion**: Referrals remain but marked as orphaned
- **Program deletion**: Enrollments retained for historical reporting
- **User deletion**: Created records retain user reference for audit

## Performance Optimization Patterns

### 1. Query Optimization

**Common Query Patterns**:
```sql
-- Client with all related data (single query)
SELECT c.*, ec.*, r.* 
FROM client_management_client c
LEFT JOIN client_management_clientemergencycontact ec ON c.id = ec.client_id
LEFT JOIN referral_management_referral r ON c.id = r.client_id
WHERE c.is_deleted = false;

-- Active referrals with program details
SELECT r.*, p.name as program_name, u.first_name as staff_name
FROM referral_management_referral r
JOIN programs_program p ON r.target_program_id = p.id
LEFT JOIN users_user u ON r.assigned_staff_id = u.id
WHERE r.is_deleted = false AND r.status IN ('ACTIVE', 'PENDING');
```

### 2. Caching Strategy

**Django Model Caching**:
- Option lists cached for 1 hour
- User permissions cached per session
- Program configurations cached until updated
- Reference data cached for 24 hours

### 3. Bulk Operations

**Batch Processing Patterns**:
- Document uploads processed in batches
- Consent record creation for multiple clients
- Notification dispatch using bulk operations
- Report generation with optimized queries

## Integration Data Flows

### 1. External Referral Sources

**Inbound Flow**:
1. External system POST to `/api/v1/referrals/`
2. Validate organization credentials
3. Create/update external organization record
4. Create referral with pending status
5. Notify assigned staff via notification system
6. Return confirmation with tracking ID

### 2. Reporting & Analytics

**Data Extraction Flow**:
1. Scheduled report generation
2. Query optimization with read replicas (future)
3. Data aggregation with privacy filtering
4. Export to business intelligence tools
5. Audit log all data access

### 3. Compliance Reporting

**Audit Data Flow**:
1. Continuous audit log collection
2. Compliance rule evaluation
3. Exception reporting and alerts
4. Data retention policy enforcement
5. Secure archive for long-term storage

## Error Handling & Recovery

### 1. Data Consistency Recovery

**Transaction Rollback Scenarios**:
- SharePoint upload failure → Rollback document record
- Azure AD sync failure → Maintain local role cache
- External API timeout → Queue for retry with exponential backoff

### 2. Data Migration Patterns

**Schema Evolution Strategy**:
1. Create new fields with defaults
2. Migrate data in batches during maintenance windows
3. Update application code to use new fields
4. Deprecate old fields with warning period
5. Remove old fields in subsequent release

### 3. Backup & Recovery

**Data Protection Flow**:
1. Automated database backups every 6 hours
2. SharePoint versioning for document recovery
3. Point-in-time recovery for data corruption
4. Cross-region replication for disaster recovery
5. Audit log preservation for 7+ years

## Business Intelligence Data Flow

### 1. Operational Reporting

**Real-time Dashboards**:
- Active referral counts by status
- Program enrollment trends
- Staff workload distribution
- Document compliance tracking

### 2. Analytics Pipeline

**Data Warehouse Flow** (Future Implementation):
1. Nightly ETL from operational database
2. Data cleansing and transformation
3. Dimensional modeling for analysis
4. Business intelligence tool integration
5. Self-service analytics for managers

This data flow analysis provides the foundation for understanding how information moves through the MTK Care system and supports business operations, compliance requirements, and future scalability needs.