# MTK-Care Documentation

Welcome to the MTK-Care project documentation. This documentation is organized by audience and purpose to help you find what you need quickly.

## 🗂️ Documentation Structure

```
docs/
├── 01-getting-started/           # New user onboarding
├── 02-business/                  # Business requirements & processes
├── 03-architecture/              # System design & technical specs
│   ├── api-design/               # API conventions & standards
│   └── database/                 # Database design & migrations
├── 04-development/               # Implementation guides
│   ├── backend/                  # Django & API development
│   ├── frontend/                 # Next.js & React development
│   └── authentication/          # Auth implementation
├── 05-deployment/                # Production deployment & ops
├── 06-troubleshooting/           # Problem solving guides
│   ├── api-issues/               # API & backend problems
│   └── deployment-issues/       # Deployment problems
└── 99-archive/                   # Historical docs & decisions
    ├── changelog/                # Release history
    └── decisions/                # Architecture decisions
```

## 🚀 Quick Start Paths

### For New Team Members
👉 **Start Here**: [Getting Started Guide](./01-getting-started/) → [Business Overview](./02-business/) → [Architecture Concepts](./03-architecture/)

### For Developers
👉 **Development**: [Development Guides](./04-development/) → [Backend](./04-development/backend/) or [Frontend](./04-development/frontend/)

### For Business Stakeholders
👉 **Business**: [Functional Requirements](./02-business/functional-requirements.md) → [Business Documentation](./02-business/)

### For DevOps/Deployment
👉 **Deployment**: [Azure Deployment Guide](./05-deployment/azure-deployment-guide.md) → [Deployment Documentation](./05-deployment/)

### For Troubleshooting
👉 **Help**: [Troubleshooting Guide](./06-troubleshooting/) → Specific issue category

## 📚 Key Documentation by Category

### 🎯 Getting Started
- [New User Guide](./01-getting-started/) - Complete onboarding for new team members
- [Local Development Setup](./01-getting-started/) - Environment configuration

### 💼 Business & Requirements  
- [Project Overview](./02-business/project-overview.md) - Complete business case and project definition
- [Functional Requirements](./02-business/functional-requirements.md) - Detailed system specifications
- [Business Processes](./02-business/) - User roles, workflows, and business logic

### 🏗️ Architecture & Design
- [Technical Requirements](./03-architecture/technical-requirements.md) - System specifications
- [Design Patterns](./03-architecture/design-patterns.md) - Architectural patterns and principles
- [API Versioning Standard](./03-architecture/api-design/api-versioning-standard.md) - API design conventions
- [UUID Migration Guide](./03-architecture/database/uuid-migration-guide.md) - Database design patterns

### 💻 Development Guides
- **Backend**: [Django Ninja Best Practices](./04-development/backend/django-ninja-best-practices.md) | [App Refactor Checklist](./04-development/backend/app-refactor-checklist.md)
- **Frontend**: [Next.js Conventions](./04-development/frontend/nextjs-conventions.md) | [ShadCN UI Guide](./04-development/frontend/ShadCN-context.md) | [OpenAPI Types](./04-development/frontend/openapi-type-generation.md)
- **Authentication**: [Overview](./04-development/authentication/overview.md) | [Backend Implementation](./04-development/authentication/backend-implementation.md) | [Frontend Session Management](./04-development/authentication/frontend-session-management.md) | [Auth Bypass Mode](./04-development/authentication/auth-bypass-mode.md) | [Azure AD Integration](./04-development/authentication/azure-ad-role-integration.md)

### 🚀 Deployment & Operations
- [Azure Deployment Guide](./05-deployment/azure-deployment-guide.md) - Complete Azure setup
- [Post Deployment Tasks](./05-deployment/post-deployment-tasks.md) - Essential post-deployment steps

### 🔧 Troubleshooting
- **API Issues**: [Router Setup](./06-troubleshooting/api-issues/router-setup.md) | [Redirect Loops](./06-troubleshooting/api-issues/redirect-loops.md)
- **Deployment**: [Azure Issues](./06-troubleshooting/deployment-issues/azure-issues.md)

### 📜 Historical & Decisions
- [Changelog](./99-archive/changelog/) - Version history and release notes  
- [Architecture Decisions](./99-archive/decisions/) - ADRs and design decisions

## 📖 Contributing to Documentation

### Adding New Documentation
1. **Choose the right section**: Use the numbered structure (01-06, 99)
2. **Follow naming conventions**: Use kebab-case filenames (e.g., `user-management-guide.md`)
3. **Update relevant READMEs**: Add links in section and main README
4. **Use consistent formatting**: Follow existing markdown patterns

### Documentation Guidelines
- **Audience-focused**: Write for specific user types
- **Actionable**: Include step-by-step instructions where appropriate
- **Cross-referenced**: Link to related documentation
- **Maintained**: Keep information current and accurate

### Organizational Principles
- **01-06**: Ordered by typical user journey
- **99-archive**: Historical and reference materials
- **Numbered folders**: Maintain logical reading order
- **Subfolders**: Group related content by domain

## 🔗 Quick Reference

### Key Technologies
- **Backend**: Django 4.2+ with Django Ninja API
- **Frontend**: Next.js 14+ with TypeScript
- **Authentication**: Azure AD with professional session management
- **Database**: PostgreSQL (production), SQLite (development)
- **Deployment**: Azure Web Apps
- **Monitoring**: Azure Application Insights

### 🆕 Recent Enhancements

#### Professional Session Management
- **AuthGuard Component**: Layout-level route protection with branded authentication UI
- **SessionManager**: Proactive session timeout warnings with one-click extension
- **Smart State Detection**: Distinguishes between session expiry vs. unauthenticated states
- **Professional UX**: No more "Please sign in" text with visible UI shell
- **Healthcare-Compliant**: Secure session handling with graceful timeout management

**Documentation**: [Frontend Session Management](./04-development/authentication/frontend-session-management.md)

### Core Architectural Patterns
- **API-First**: Backend provides data via REST APIs
- **UUID Identifiers**: All models use UUIDs as primary keys
- **Role-Based Access Control**: Permissions tied to Azure AD groups
- **Stateless Authentication**: JWT tokens for API access
- **Professional Session Management**: AuthGuard route protection with proactive timeout warnings
- **Component-Based Frontend**: Reusable React components with TypeScript

### Development Workflow
1. **Setup**: [Getting Started](./01-getting-started/) → Local environment
2. **Understanding**: [Business Requirements](./02-business/) → [Architecture](./03-architecture/)  
3. **Implementation**: [Development Guides](./04-development/) → Feature development
4. **Deployment**: [Deployment Guide](./05-deployment/) → Production release
5. **Maintenance**: [Troubleshooting](./06-troubleshooting/) → Issue resolution

---

**Need help?** Start with the [Getting Started Guide](./01-getting-started/) or find your specific topic using the structure above.
