# Product Requirements Document: Referrals & Intake Management System

## 1. Executive Summary

### 1.1 Product Overview
A comprehensive digital system for managing incoming referrals and client intake processes for community services organizations, with specialized support for programs like Social Workers in Schools (SWiS). The system streamlines the journey from initial referral receipt through client record creation and program assignment.

### 1.2 Success Metrics
- **Efficiency**: Reduce average referral processing time from 3-5 days to 24-48 hours
- **Accuracy**: Achieve 95% accuracy in client matching and reduce duplicate records by 80%
- **Compliance**: 100% consent tracking compliance and audit trail completeness
- **User Adoption**: 90% staff adoption rate within 3 months of deployment

## 2. Problem Statement

### 2.1 Current Pain Points
- **Fragmented Workflow**: Multiple systems and manual processes create inefficiencies
- **Client Identification Issues**: High rate of duplicate records and missed existing client matches
- **Consent Management Gaps**: Inconsistent tracking of parent/guardian consent status
- **Limited Visibility**: Poor transparency into referral status and processing bottlenecks
- **Program-Specific Needs**: Generic systems don't accommodate specialized workflows like SWiS

### 2.2 Impact of Problems
- Delayed service delivery to children and families
- Administrative burden on frontline staff
- Compliance risks and audit findings
- Poor stakeholder communication and trust

## 3. Target Users

### 3.1 Primary Users
- **Intake Coordinators**: Process initial referrals and make acceptance decisions
- **Program Managers**: Assess referrals and allocate to practitioners
- **Administrative Staff**: Support data entry and file management

### 3.2 Secondary Users
- **Practitioners**: View assigned cases and access referral history
- **External Referrers**: Submit referrals and track status
- **Management**: Access reporting and oversight dashboards

## 4. Core Features

### 4.1 Intelligent Referral Capture

#### 4.1.1 Multi-Channel Intake
**Description**: Accept referrals from various sources with appropriate validation and routing.

**Functional Requirements**:
- Support for external agency referrals, self-referrals, internal referrals, and school-based referrals
- Dynamic form fields based on referral source and program type
- File attachment capabilities for supporting documentation
- Email integration for direct referral submission

**Technical Requirements**:
- RESTful API for external system integration
- Secure file upload with virus scanning
- Email parsing and automatic data extraction
- Mobile-responsive design for field-based submissions

#### 4.1.2 Smart Client Resolution
**Description**: Intelligent matching of referrals to existing clients while supporting new client creation.

**Functional Requirements**:
- Real-time client search with fuzzy matching algorithms
- Duplicate detection using name, DOB, phone, and address matching
- Support for reference-only scenarios (external system IDs)
- Progressive disclosure of client creation fields
- Visual indicators for match confidence levels

**Technical Requirements**:
- Elasticsearch or similar for advanced search capabilities
- Machine learning algorithms for duplicate detection
- API integration with external systems (MOE, MSD databases where permitted)
- Data validation and cleansing routines

### 4.2 Program-Aware Processing

#### 4.2.1 SWiS-Specific Workflow
**Description**: Specialized processing for Social Workers in Schools program requirements.

**Functional Requirements**:
- School lookup and validation against MOE database
- Year level and class information capture
- Teacher and principal contact integration
- SDQ assessment flagging and preparation
- Cultural considerations and whānau engagement tracking

**Technical Requirements**:
- Integration with Education Sector systems where available
- Configurable workflow rules engine
- Role-based access controls for school-sensitive information

#### 4.2.2 Flexible Program Configuration
**Description**: Configurable workflows to support different community service programs.

**Functional Requirements**:
- Program-specific intake forms and validation rules
- Customizable eligibility criteria and decision trees
- Configurable approval workflows and escalation paths
- Program capacity and waitlist management

**Technical Requirements**:
- Rules engine for business logic configuration
- Workflow orchestration capabilities
- Real-time capacity monitoring and alerts

### 4.3 Consent and Compliance Management

#### 4.3.1 Comprehensive Consent Tracking
**Description**: End-to-end management of consent requirements and status monitoring.

**Functional Requirements**:
- Multiple consent types (assessment, intervention, information sharing)
- Parent/guardian contact management with multiple contacts
- Consent expiry tracking and renewal reminders
- Withdrawal of consent processing and impact assessment
- Digital consent capture with electronic signatures

**Technical Requirements**:
- Automated workflow triggers for consent actions
- Integration with communication systems for reminders
- Audit logging for all consent-related activities
- Secure storage of consent documentation

#### 4.3.2 Privacy and Security Compliance
**Description**: Ensure compliance with Privacy Act 2020 and sector-specific requirements.

**Functional Requirements**:
- Data classification and handling rules
- Access logging and audit trails
- Retention policy enforcement
- Breach detection and reporting capabilities

**Technical Requirements**:
- Encryption at rest and in transit
- Role-based access controls with principle of least privilege
- Data loss prevention (DLP) capabilities
- Regular security scanning and vulnerability assessment

## 5. User Experience Requirements

### 5.1 Core UX Principles
- **Progressive Disclosure**: Present information and options based on context and user expertise level
- **Error Prevention**: Validate data in real-time and provide clear guidance for corrections
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Mobile-First**: Responsive design optimized for tablet and mobile use

### 5.2 Key User Journeys

#### 5.2.1 Standard Referral Processing
1. Referral source and urgency selection
2. Client identification with smart search
3. Referral details and presenting concerns
4. Consent status and contact information
5. Program assignment and initial triage
6. Confirmation and next steps notification

#### 5.2.2 Urgent Referral Fast-Track
1. Urgent flag triggers simplified workflow
2. Minimal required information capture
3. Immediate notification to program managers
4. Follow-up data collection scheduled

#### 5.2.3 Reference-Only Processing
1. External reference number capture
2. Placeholder record creation
3. Information gathering workflow triggered
4. Progressive record completion

### 5.3 Interface Design Requirements

#### 5.3.1 Dashboard Design
- Real-time referral queue with priority sorting
- Visual status indicators and progress tracking
- Quick action buttons for common tasks
- Workload distribution visualization

#### 5.3.2 Form Design
- Single-page application with smart save functionality
- Contextual help and guidance text
- Field validation with immediate feedback
- Conditional logic for dynamic form behavior

## 6. Technical Architecture

### 6.1 System Architecture
- **Frontend**: React-based SPA with TypeScript
- **Backend**: Django
- **Database**: PostgreSQL with Redis for caching
- **Search**: Elasticsearch for client matching and search
- **Integration**: RESTful APIs with message queue for async processing

### 6.2 Integration Requirements
- **Communication Platform**: Email and SMS notifications
- **Document Management**: Secure file storage and retrieval

### 6.3 Performance Requirements
- **Response Time**: <2 seconds for standard operations, <5 seconds for complex searches
- **Availability**: 99.5% uptime during business hours
- **Scalability**: Support for 50 concurrent users initially, scalable to 200
- **Data Volume**: Handle 1000+ referrals per month with 10-year retention

## 7. Compliance and Security

### 7.1 Regulatory Compliance
- Privacy Act 2020 compliance for personal information handling
- Children, Young Persons, and Their Families Act requirements
- Oranga Tamariki information sharing protocols
- Health Information Privacy Code where applicable

### 7.2 Security Requirements
- Multi-factor authentication for all users
- Role-based access controls with regular review cycles
- Data encryption using AES-256 standards
- Regular penetration testing and security audits
- Incident response and breach notification procedures

## 8. Success Criteria and KPIs

### 8.1 Operational Metrics
- **Processing Time**: Average referral processing time
- **Accuracy Rate**: Percentage of correctly matched clients
- **Compliance Rate**: Consent tracking and audit completeness
- **User Satisfaction**: Staff feedback scores and adoption rates

### 8.2 Business Impact Metrics
- **Service Delivery Speed**: Time from referral to first contact
- **Resource Utilization**: Staff productivity and workload distribution
- **Quality Indicators**: Error rates and rework requirements
- **Stakeholder Satisfaction**: Referrer and family feedback


---

**Document Version**: 1.0
**Last Updated**: June 11, 2025
**Next Review**: July 11, 2025
**Approval**: [Pending stakeholder review]
