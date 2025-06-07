# Backend Documentation

This directory contains documentation specific to the Django backend implementation of MTK-Care.

## Overview

The backend is built with Django 4.2+ and uses Django Ninja for the REST API. It follows an API-first approach with automatic OpenAPI schema generation.

## Documentation Files

### [Django Ninja Best Practices](./django-ninja-best-practices.md)
Guidelines and conventions for developing APIs using Django Ninja in this project.

### [App Refactor Checklist](./app-refactor-checklist.md)
Guide for migrating Django apps and refactoring procedures.

**Key topics:**
- API endpoint structure
- Request/response schemas
- Error handling
- Authentication decorators
- Testing strategies

## Related Documentation

- [Backend Authentication](../authentication/backend-implementation.md) - Authentication implementation details
- [UUID Migration Guide](../../03-architecture/database/uuid-migration-guide.md) - UUID implementation
- [API Versioning Standard](../../03-architecture/api-design/api-versioning-standard.md) - API versioning conventions

## Key Concepts

### Project Structure
```
backend/
├── apps/              # Django applications
├── config/            # Project configuration
├── api/               # API endpoints and routers
└── tests/             # Test suites
```

### Core Technologies
- **Django 4.2+**: Web framework
- **Django Ninja**: REST API framework
- **PostgreSQL**: Production database
- **SQLite**: Development database

### API Design Principles
1. **RESTful conventions**: Standard HTTP methods and status codes
2. **UUID identifiers**: All models use UUIDs as primary keys
3. **Schema validation**: Pydantic schemas for request/response validation
4. **Consistent naming**: Kebab-case URLs, snake_case fields

### Development Guidelines
- Follow PEP 8 for Python code style
- Write comprehensive tests for all endpoints
- Document API endpoints with OpenAPI annotations
- Use type hints throughout the codebase