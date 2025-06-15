# Case Management System - Status Implementation PRD/Tech Spec

## 1. Executive Summary

This document outlines the Product Requirements and Technical Specifications for implementing a comprehensive status management system for a community services case management application, specifically designed for counselling services for New Zealand children and families.

## 2. Business Context

### 2.1 Problem Statement
The organization needs a digital case management system to track client journeys from initial referral through service completion, ensuring compliance with consent requirements and enabling effective service delivery monitoring.

### 2.2 Goals
- Digitize the current paper-based process
- Ensure clear visibility of case status at all times
- Enable compliance with consent and assessment requirements
- Support iterative service delivery and monitoring
- Provide comprehensive reporting on service outcomes

## 3. Functional Requirements

### 3.1 Status Categories

The system shall implement two main status categories:

#### 3.1.1 Referral/Intake Statuses
1. **Draft/Incomplete**
2. **Pending - Awaiting Consent/Initial Assessment**
3. **Accepted**
4. **Declined**
5. **No Further Action Required**
6. **Active/Enrolled**
7. **Closed**
8. **Completed**
9. **Reopened**
10. **Archived**

#### 3.1.2 Service Delivery Statuses
1. **Active - Implementing Plan**
2. **Active - In Review**
3. **Service Episode Complete**

### 3.2 Status Definitions and Business Rules

#### Referral/Intake Statuses

| Status | Definition | Entry Criteria | Exit Criteria | Allowed Transitions |
|--------|------------|----------------|---------------|-------------------|
| **Draft/Incomplete** | Referral started but not submitted | User begins referral entry | User completes and submits referral | → Pending - Awaiting Consent/Initial Assessment |
| **Pending - Awaiting Consent/Initial Assessment** | Referral received, awaiting consent and/or assessment | Referral submitted | Consent received AND initial assessment completed | → Accepted, Declined, No Further Action Required, Closed |
| **Accepted** | Client meets criteria for service | Initial assessment completed with positive outcome | Service allocation begins | → Active/Enrolled |
| **Declined** | NPO decided against providing service | Initial assessment completed or other decline reason | N/A | Terminal status |
| **No Further Action Required** | Assessment determines no service needed | Initial assessment completed | N/A | Terminal status |
| **Active/Enrolled** | Client actively receiving services | Client accepted and allocated to program | Service episode ends | → Service Episode Complete, Closed |
| **Closed** | Case closed before service completion | Various (see sub-statuses) | N/A | → Reopened (if applicable) |
| **Completed** | Service episode successfully completed | All service goals achieved | N/A | Terminal status |
| **Reopened** | Previously closed case reactivated | Management approval | Same as original status | → Any applicable status |
| **Archived** | Administrative removal | Created in error | N/A | Terminal status |

#### Sub-statuses

**Pending - Awaiting Consent/Initial Assessment:**
- Consent forms sent
- Consent received, assessment pending

**Declined:**
- Did not meet criteria
- Referred to another organisation
- Other (requires description)

**Closed:**
- Declined consent
- Onward referral to external organization

**Service Episode Complete:**
- By mutual consent
- Client/Whānau withdrew consent
- Not contactable
- Client moved out of area
- Referred to external provider
- Other (requires description)

### 3.3 Required Fields and Data Points

#### 3.3.1 Core Status Fields
```python
class CaseStatus:
    status_id: str  # Primary key
    case_id: str  # Foreign key to case
    status: str  # Main status
    sub_status: str  # Optional sub-status
    reason: str  # Required for certain statuses
    created_by: str  # User who set status
    created_at: datetime
    notes: str  # Optional admin notes
```

#### 3.3.2 Additional Tracking Fields
```python
class Case:
    case_id: str
    referral_date: datetime
    consent_status: bool
    consent_date: datetime
    sdq_initial_completed: bool
    sdq_initial_date: datetime
    sdq_followup_completed: bool
    sdq_followup_date: datetime
    initial_assessment_completed: bool
    initial_assessment_date: datetime
    care_plan_created: bool
    care_plan_date: datetime
    intervention_goals: List[str]
    referrer_notified: bool
    guardian_notified: bool
    last_review_date: datetime
    next_review_date: datetime
```

### 3.4 User Interface Requirements

#### 3.4.1 Status Display
- Current status prominently displayed on case view
- Status history viewable with timestamps
- Color coding for status categories:
  - Blue: Pending/In Progress
  - Green: Active/Accepted
  - Red: Declined/Closed
  - Gray: Archived/Completed

#### 3.4.2 Status Change Interface
- Dropdown selection for new status
- Conditional fields based on status selection
- Mandatory reason fields for specific transitions
- Confirmation dialog for terminal statuses

### 3.5 Notifications and Alerts

| Trigger | Recipients | Method | Content |
|---------|------------|--------|---------|
| Status change to Accepted | Referrer, Guardian | Email/SMS | Next steps information |
| No contact for 7 days in Pending | Case worker | System alert | Follow-up reminder |
| Review date approaching | Case worker | System alert | Schedule review reminder |
| Status change to Closed/Complete | Referrer, Guardian | Email | Closure notification |

## 4. Technical Specifications

### 4.1 Database Schema

```sql
-- Status lookup table
CREATE TABLE status_types (
    status_code VARCHAR(50) PRIMARY KEY,
    status_name VARCHAR(100) NOT NULL,
    status_category VARCHAR(20) NOT NULL CHECK (status_category IN ('INTAKE', 'SERVICE')),
    is_terminal BOOLEAN DEFAULT FALSE,
    requires_reason BOOLEAN DEFAULT FALSE,
    display_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

-- Sub-status lookup table
CREATE TABLE sub_status_types (
    sub_status_code VARCHAR(50) PRIMARY KEY,
    parent_status_code VARCHAR(50) REFERENCES status_types(status_code),
    sub_status_name VARCHAR(100) NOT NULL,
    requires_description BOOLEAN DEFAULT FALSE,
    display_order INTEGER
);

-- Case status history
CREATE TABLE case_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES cases(case_id),
    status_code VARCHAR(50) NOT NULL REFERENCES status_types(status_code),
    sub_status_code VARCHAR(50) REFERENCES sub_status_types(sub_status_code),
    reason TEXT,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE
);

-- Status transition rules
CREATE TABLE status_transitions (
    from_status VARCHAR(50) REFERENCES status_types(status_code),
    to_status VARCHAR(50) REFERENCES status_types(status_code),
    requires_approval BOOLEAN DEFAULT FALSE,
    min_days_in_status INTEGER DEFAULT 0,
    PRIMARY KEY (from_status, to_status)
);
```

### 4.2 API Endpoints

```python
# Status Management Endpoints

GET /api/cases/{case_id}/status
# Returns current status and status history

POST /api/cases/{case_id}/status
# Request body:
{
    "status": "ACCEPTED",
    "sub_status": null,
    "reason": "Meets all criteria for counselling service",
    "notes": "Family very engaged"
}

GET /api/status-types
# Returns all available status types and their rules

GET /api/status-types/{status_code}/transitions
# Returns allowed transitions from a specific status

GET /api/cases/{case_id}/status-history
# Returns complete status history with pagination
```

### 4.3 Business Logic Implementation

```python
class StatusManager:
    def __init__(self, case_id: str):
        self.case_id = case_id
        
    def change_status(self, new_status: str, sub_status: str = None, 
                     reason: str = None, user_id: str = None) -> dict:
        """
        Changes case status with validation
        """
        # Get current status
        current_status = self.get_current_status()
        
        # Validate transition
        if not self.is_valid_transition(current_status, new_status):
            raise InvalidTransitionError(
                f"Cannot transition from {current_status} to {new_status}"
            )
        
        # Check required fields
        if self.requires_reason(new_status) and not reason:
            raise ValidationError(f"Reason required for status {new_status}")
        
        # Check time constraints
        if not self.meets_time_constraints(current_status, new_status):
            raise ValidationError("Minimum time in current status not met")
        
        # Create status record
        status_record = self.create_status_record(
            new_status, sub_status, reason, user_id
        )
        
        # Trigger side effects
        self.trigger_status_change_effects(new_status, current_status)
        
        return status_record
    
    def trigger_status_change_effects(self, new_status: str, old_status: str):
        """
        Handles notifications and other side effects
        """
        if new_status == "ACCEPTED":
            self.notify_referrer_and_guardian("accepted")
            self.schedule_initial_review()
        elif new_status == "CLOSED":
            self.notify_referrer_and_guardian("closed")
            self.cancel_scheduled_reviews()
        elif new_status == "ACTIVE_IN_REVIEW":
            self.create_review_record()
```

### 4.4 State Machine Configuration

```python
STATUS_TRANSITIONS = {
    "DRAFT": ["PENDING_CONSENT_ASSESSMENT"],
    "PENDING_CONSENT_ASSESSMENT": ["ACCEPTED", "DECLINED", "NO_ACTION_REQUIRED", "CLOSED"],
    "ACCEPTED": ["ACTIVE_ENROLLED"],
    "ACTIVE_ENROLLED": ["ACTIVE_IMPLEMENTING", "ACTIVE_IN_REVIEW", "SERVICE_COMPLETE", "CLOSED"],
    "ACTIVE_IMPLEMENTING": ["ACTIVE_IN_REVIEW", "SERVICE_COMPLETE", "CLOSED"],
    "ACTIVE_IN_REVIEW": ["ACTIVE_IMPLEMENTING", "SERVICE_COMPLETE", "CLOSED"],
    "DECLINED": ["REOPENED"],
    "CLOSED": ["REOPENED"],
    "SERVICE_COMPLETE": ["REOPENED"],
    "REOPENED": ["PENDING_CONSENT_ASSESSMENT", "ACTIVE_ENROLLED"]
}
```

## 5. Security and Compliance

### 5.1 Access Control
- Status changes require appropriate user permissions
- Audit trail maintained for all status changes
- Terminal status changes require supervisor approval

### 5.2 Data Privacy
- Status history retained for 7 years
- Personal information in status notes encrypted at rest
- Access logs maintained for compliance

## 6. Performance Requirements

- Status change operations < 500ms
- Status history retrieval < 1s for up to 1000 records
- Real-time status updates via WebSocket for active users

## 7. Testing Requirements

### 7.1 Unit Tests
- All status transition validations
- Business rule enforcement
- Required field validation

### 7.2 Integration Tests
- End-to-end status workflows
- Notification delivery
- Concurrent status updates

### 7.3 User Acceptance Criteria
- Users can view current status within 2 clicks
- Status changes require maximum 4 fields
- Status history clearly shows progression

## 8. Implementation Phases

### Phase 1 (MVP)
- Core status types and transitions
- Basic UI for status management
- Manual notifications

### Phase 2
- Automated notifications
- Advanced reporting
- Bulk status operations

### Phase 3
- Integration with external systems
- Advanced analytics
- Mobile app support

## 9. Success Metrics

- 90% of cases have accurate status within 24 hours
- 50% reduction in time to update case status
- 95% user satisfaction with status visibility
- Zero critical status data loss incidents

## 10. Dependencies

- User authentication system
- Email/SMS notification service
- Document management system for consent forms
- Reporting infrastructure