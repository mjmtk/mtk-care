# MTK-Care - Functional Requirements Document

## 1. Executive Summary

MTK-Care is a task management system for healthcare teams with Azure AD integration and role-based access control. The system enables secure task creation, assignment, tracking, and collaboration across healthcare departments.

## 2. Core Functional Requirements

### 2.1 Authentication & User Management

#### FR-001: Azure AD Single Sign-On
- Users must authenticate using existing Azure AD credentials
- System automatically creates Django user accounts on first login
- Support for multi-factor authentication through Azure AD
- Automatic session management and token refresh

#### FR-002: User Profile Management
- Display user information from Azure AD (name, email, department)
- Allow users to update preferences and settings
- Show user's current role and permissions
- Support for profile picture from Azure AD

#### FR-003: Role-Based Access Control
- Map Azure AD groups to application roles automatically
- Support for hierarchical roles: Admin → Manager → Provider → Staff
- Dynamic permission assignment based on Azure AD group membership
- Role changes reflect immediately upon next login

### 2.2 Task Management Core

#### FR-004: Task Creation
- Create tasks with title, description, priority level, and due date
- Support for task categories and tags for organization
- Ability to add file attachments and links
- Set task dependencies and prerequisites
- Use task templates for common workflows

#### FR-005: Task Assignment
- Assign tasks to individual users or teams
- Support for department-based assignment
- Bulk assignment capabilities for multiple tasks
- Automatic notification upon task assignment
- Assignment history tracking

#### FR-006: Task Status Management
- Task statuses: Not Started, In Progress, Review, Completed, Cancelled
- Status change tracking with timestamps
- Automatic status updates based on dependencies
- Visual status indicators and progress bars
- Bulk status updates for multiple tasks

#### FR-007: Task Organization
- Categorize tasks by department, project, or custom categories
- Flexible tagging system for cross-cutting concerns
- Task filtering by status, priority, assignee, due date
- Search functionality across task title, description, and comments
- Saved search filters and custom views

### 2.3 Collaboration Features

#### FR-008: Task Comments & Communication
- Add comments to tasks with @mention functionality
- Thread-based discussions on specific tasks
- Real-time comment notifications
- Comment editing and deletion (by author)
- Rich text formatting in comments

#### FR-009: File Management
- Upload and attach files to tasks
- Support for common file types (PDF, DOC, images)
- File versioning and download tracking
- Secure file access based on task permissions
- File preview capabilities where possible

#### FR-010: Notifications
- Real-time notifications for task assignments, comments, and status changes
- Configurable notification preferences per user
- Email notifications for critical updates
- Desktop/browser notifications when app is open
- Notification history and mark as read functionality

### 2.4 Dashboard & Reporting

#### FR-011: Personal Dashboard
- Overview of assigned tasks by status and priority
- Upcoming deadlines and overdue tasks
- Recent activity feed and notifications
- Quick task creation and status updates
- Workload summary and metrics

#### FR-012: Team Dashboard
- Department/team task overview and progress
- Team member workload distribution
- Task completion metrics and trends
- Bottleneck identification and alerts
- Team performance indicators

#### FR-013: Task Reporting
- Generate reports on task completion rates
- Workload analysis by user and department
- Performance metrics and trend analysis
- Export reports in PDF and Excel formats
- Scheduled report generation and delivery

### 2.5 Search & Filtering

#### FR-014: Advanced Search
- Full-text search across tasks, comments, and attachments
- Advanced filtering by multiple criteria simultaneously
- Saved search queries and quick filters
- Search result ranking by relevance and recency
- Search within specific departments or categories

#### FR-015: Data Organization
- Custom task categories and subcategories
- Hierarchical organization of departments and teams
- Tag management and standardization
- Bulk organization tools for existing tasks
- Import/export of organizational structures

## 3. User Roles & Permissions

### 3.1 Role Definitions

#### Administrator
- Full system access and configuration
- User management and role assignment
- System settings and customization
- Department and category management
- Access to all reports and analytics

#### Manager
- Department-level task management
- Team member task assignment and oversight
- Department reporting and analytics
- Category management within department
- Approval workflows for sensitive tasks

#### Provider
- Personal task management and completion
- Collaboration within assigned teams
- Comment and file sharing capabilities
- Limited reporting (personal metrics)
- Task creation for own department

#### Staff
- Personal task completion and updates
- Basic collaboration features
- View department tasks (read-only)
- Personal dashboard and notifications
- Limited task creation capabilities

### 3.2 Permission Matrix

| Feature | Admin | Manager | Provider | Staff |
|---------|-------|---------|----------|-------|
| Create Tasks | ✅ All | ✅ Dept | ✅ Own | ⚠️ Limited |
| Assign Tasks | ✅ All | ✅ Dept | ❌ No | ❌ No |
| Edit All Tasks | ✅ Yes | ✅ Dept | ❌ No | ❌ No |
| View All Tasks | ✅ Yes | ✅ Dept | ⚠️ Assigned | ⚠️ Assigned |
| Manage Users | ✅ Yes | ⚠️ Dept | ❌ No | ❌ No |
| Reports | ✅ All | ✅ Dept | ⚠️ Personal | ⚠️ Personal |
| System Settings | ✅ Yes | ❌ No | ❌ No | ❌ No |

## 4. Workflow Requirements

### 4.1 Task Lifecycle
1. **Creation**: Task created with required fields and optional details
2. **Assignment**: Task assigned to user(s) with automatic notification
3. **Acceptance**: Assignee acknowledges task and begins work
4. **Progress**: Regular status updates and collaboration
5. **Review**: Optional review phase for critical tasks
6. **Completion**: Task marked complete with final documentation
7. **Archive**: Completed tasks archived but remain searchable

### 4.2 Escalation Workflow
- Automatic escalation for overdue tasks
- Manager notification for tasks stuck in progress
- Priority escalation based on task criticality
- Manual escalation capabilities for urgent issues

### 4.3 Approval Workflow
- Optional approval required for high-priority tasks
- Multi-level approval for cross-department tasks
- Automatic approval request notifications
- Approval history and decision tracking

## 5. Integration Requirements

### 5.1 Azure AD Integration
- Seamless SSO experience with existing credentials
- Automatic user provisioning and deprovisioning
- Group membership synchronization
- Profile information synchronization

### 5.2 API Requirements
- RESTful API for all core functionality
- OpenAPI/Swagger documentation
- Rate limiting and authentication
- Webhook support for external integrations
- Bulk operations support

### 5.3 Data Exchange
- Import tasks from CSV/Excel files
- Export functionality for reporting
- Integration with email systems for notifications
- Calendar integration for due dates and schedules

## 6. User Experience Requirements

### 6.1 Interface Design
- Clean, intuitive interface following modern design patterns
- Responsive design for desktop, tablet, and mobile
- Consistent navigation and user interactions
- Accessibility support for users with disabilities

### 6.2 Performance Expectations
- Fast page load times and responsive interactions
- Real-time updates for collaborative features
- Efficient handling of large task lists
- Smooth mobile experience with touch interactions

### 6.3 Customization
- Personalized dashboard layouts
- Customizable notification preferences
- Flexible task views and filtering options
- Theme and display preferences