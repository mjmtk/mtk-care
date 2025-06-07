# Architecture Documentation

This section contains system architecture, design patterns, technical requirements, and high-level design decisions.

## Overview

The MTK-Care system follows a modern, cloud-native architecture with clear separation between frontend and backend, API-first design, and microservices-ready patterns.

## Documentation Files

### Core Architecture
- [Design Patterns](./design-patterns.md) - Project architecture and design principles
- [Technical Requirements](./technical-requirements.md) - System and technical prerequisites

### API Design
- [API Versioning Standard](./api-design/api-versioning-standard.md) - API versioning conventions
- API endpoint conventions and standards

### Database
- [UUID Migration Guide](./database/uuid-migration-guide.md) - UUID implementation guide
- Database schema and design patterns

## Architecture Principles

### 1. API-First Design
- RESTful API design with OpenAPI specification
- Backend provides data, frontend consumes via API
- Clear contract between frontend and backend teams

### 2. Cloud-Native Patterns
- Stateless applications for horizontal scaling
- Environment-based configuration
- Health checks and monitoring endpoints

### 3. Security by Design
- Authentication and authorization at API level
- Role-based access control (RBAC)
- Secure handling of sensitive data

### 4. Maintainable Codebase
- Clear separation of concerns
- Consistent naming conventions
- Comprehensive testing strategies

## Technology Stack

### Backend
- **Framework**: Django 4.2+ with Django Ninja
- **Database**: PostgreSQL (production), SQLite (development)
- **Authentication**: Azure AD with JWT tokens
- **API Documentation**: OpenAPI/Swagger

### Frontend
- **Framework**: Next.js 14+ with TypeScript
- **UI Library**: ShadCN UI + Tailwind CSS
- **State Management**: React Context + SWR
- **Authentication**: NextAuth.js

### Infrastructure
- **Cloud Platform**: Microsoft Azure
- **Deployment**: Azure Web Apps
- **Storage**: Azure Blob Storage
- **Monitoring**: Azure Application Insights

## Design Decisions

### UUID Primary Keys
All database models use UUID primary keys instead of auto-incrementing integers for:
- Better security (no sequential ID guessing)
- Easier data migration between environments
- Support for distributed systems

### Django Ninja for APIs
Chosen over Django REST Framework for:
- Automatic OpenAPI schema generation
- Type hints and validation
- Better performance
- Modern Python async support

### Next.js App Router
Using the modern App Router instead of Pages Router for:
- Better performance with Server Components
- Improved developer experience
- Built-in loading and error states
- Simplified routing patterns