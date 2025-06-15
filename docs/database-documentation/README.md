# MTK Care Database Documentation

## Overview

This directory contains comprehensive database documentation for the MTK Care case management system. The documentation is designed for data teams, database administrators, business analysts, and technical stakeholders who need to understand the database structure and data flows.

## Documentation Structure

### 1. Database Schema Overview (`01-database-schema-overview.md`)
- **Purpose**: High-level architectural overview of the database design
- **Audience**: Technical leads, architects, data teams
- **Contents**:
  - Core design principles (UUID keys, audit trails, cultural sensitivity)
  - Entity group summaries (8 major functional areas)
  - Integration points (SharePoint, Azure AD)
  - Performance and security considerations
  - Future extensibility planning

### 2. Data Flow Analysis (`02-data-flow-analysis.md`)
- **Purpose**: Detailed analysis of how data moves through the system
- **Audience**: Business analysts, integration teams, QA teams
- **Contents**:
  - Primary business workflows (client onboarding, referral processing)
  - Document lifecycle management
  - Authentication and authorization flows
  - Data synchronization patterns
  - Error handling and recovery procedures
  - Business intelligence data flows

### 3. Data Dictionary (`03-data-dictionary.md`)
- **Purpose**: Comprehensive field-level documentation with business context
- **Audience**: Developers, business users, compliance teams
- **Contents**:
  - Business terminology and definitions
  - Field-by-field descriptions with cultural context
  - Data types and constraints
  - Enumeration values and business rules
  - Compliance annotations (Privacy Act 2020, Children's Act 2014)

## Generated Artifacts

### Entity Relationship Diagram
- **File**: `database_erd.mmd` (Mermaid format)
- **Purpose**: Visual representation of all database relationships
- **Usage**: 
  - View online at [mermaid.live](https://mermaid.live/)
  - Generate PNG with mermaid-cli: `mmdc -i database_erd.mmd -o database_erd.png`
  - View in VS Code with Mermaid extension

### Schema Analysis Data
- **File**: `database_schema_analysis.json`
- **Purpose**: Machine-readable complete schema metadata
- **Contents**:
  - All models with field definitions
  - Relationship mappings
  - Constraint information
  - Metadata for automated tooling

## Key Design Patterns

### 1. Cultural Sensitivity
The database design specifically supports New Zealand's multicultural context:
- **Māori Cultural Support**: Iwi/hapū fields, Te Reo Māori language priority
- **Flexible Naming**: Preferred names alongside legal names
- **Spiritual Needs**: Religious and traditional spiritual practice support
- **Whānau Concepts**: Extended family relationship models

### 2. Comprehensive Audit Trail
Every business entity maintains complete audit history:
- **Change Tracking**: Created/updated timestamps and users
- **Soft Deletion**: Preservation of historical data
- **Access Logging**: Document and system access records
- **Compliance Ready**: Supports regulatory requirements

### 3. Flexible Configuration
The system adapts to changing business needs:
- **Option Lists**: Configurable dropdowns for business values
- **JSON Fields**: Extensible data structures
- **Program Schemas**: Customizable data collection per service
- **Multi-tenancy**: Organization-scoped configurations

### 4. Integration Architecture
Designed for external system integration:
- **SharePoint**: Document storage with structured paths
- **Azure AD**: Single sign-on with group role mapping
- **REST APIs**: Standard interfaces for external referrals
- **Webhook Ready**: Event-driven integrations

## Business Context

### Service Delivery Model
MTK Care supports community services organizations providing:
- **Counselling Services**: Alcohol and other drugs (AOD), mental health
- **Youth Services**: Age-specific programs and interventions
- **Family Violence Support**: Crisis intervention and ongoing support
- **Cultural Services**: Māori-led and culturally appropriate interventions

### Regulatory Compliance
The system is designed to meet New Zealand legal requirements:
- **Privacy Act 2020**: Personal information protection
- **Children's Act 2014**: Special protections for child clients
- **Health Information Privacy Code**: Health data safeguards
- **Te Tiriti o Waitangi**: Māori partnership principles

### Operational Requirements
Supports complex case management workflows:
- **Multi-agency Coordination**: External referrals and information sharing
- **Consent Management**: Multiple consent types with expiry tracking
- **Risk Assessment**: Safety protocols and escalation procedures
- **Program Flexibility**: Diverse service models and funding arrangements

## Usage Guidelines

### For Data Teams
1. **Schema Changes**: Review all three documents before making structural changes
2. **Data Migration**: Use audit patterns to preserve historical integrity
3. **Performance**: Consider query patterns documented in data flow analysis
4. **Compliance**: Ensure privacy requirements are maintained

### For Developers
1. **Model Changes**: Update documentation when modifying Django models
2. **API Design**: Follow patterns documented in data flows
3. **Business Logic**: Respect cultural sensitivity requirements
4. **Testing**: Include audit trail validation in test suites

### For Business Analysts
1. **Requirements**: Reference data dictionary for existing capabilities
2. **Workflow Design**: Use data flow patterns as templates
3. **Reporting**: Understand entity relationships for analytics
4. **Compliance**: Consider privacy implications of new features

## Maintenance

### Documentation Updates
- **Model Changes**: Regenerate ERD and schema analysis after Django model changes
- **Business Rules**: Update data dictionary when validation rules change
- **Process Changes**: Revise data flow analysis for workflow modifications
- **Integration Changes**: Document new external system connections

### Regular Reviews
- **Quarterly**: Review option list accuracy and completeness
- **Semi-annually**: Validate compliance annotations against current regulations
- **Annually**: Assess schema design against evolving business requirements

## Contact Information

For questions about this documentation:
- **Technical Questions**: Development team
- **Business Logic**: Product management team
- **Compliance**: Privacy officer
- **Data Access**: Database administrator

This documentation is maintained as part of the MTK Care codebase and should be updated with each significant system change.