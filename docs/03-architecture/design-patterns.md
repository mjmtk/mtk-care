# CRUD Design Pattern for Django Ninja + Next.js (ShadCN, CASL, Zod)

## Overview
This pattern provides a reusable, scalable approach for CRUD (Create, Read, Update, Delete/Archive) management of entities in a Django Ninja backend and a Next.js (TypeScript) frontend. It enables fast development of admin and management pages with consistent UX, type safety, and auditability.

---

## Backend (Django + Ninja)

### 1. Abstract Base Models
- **TimeStampedModel**: Adds `created_at`, `updated_at` fields.
- **SoftDeleteModel**: Adds `is_active` or `is_archived` for soft deletion/archiving.
- **AuditModel**: Integrate with `django-simple-history` or `django-reversion` for change history.

### 2. Service/Repository Pattern (Recommended for Large/Complex Apps)
- Use Python classes (optionally with `typing.Protocol`) to define service/repository interfaces for CRUD operations and business logic.
- Services encapsulate business rules, validation, and orchestration.
- Repositories abstract data access (ORM or otherwise), making it easier to test and refactor.
- Benefits: decouples logic from views/routers, improves testability, enables interface-based programming.

### 3. Generic CRUD Routers (Ninja)
- Use Django Ninja routers to define generic CRUD endpoints for entities.
- Support search, sort, and filter via query parameters.
- Use Pydantic schemas for request/response validation.
- Uniqueness checks on create/update; return validation errors.
- Expose `/history/` endpoint for change logs if using audit logging.
- Use permission classes for RBAC.

### 4. OpenAPI/TypeScript Sync
- Ninja auto-generates OpenAPI schema at `/api/openapi.json`.
- Use [openapi-typescript](https://github.com/drwpow/openapi-typescript) to generate TypeScript types for frontend.

---

## Frontend (Next.js + TypeScript + ShadCN + CASL + Zod)

### 1. Data Access Layer (DAL)
- Implement a data-access-layer (DAL) in the frontend: a set of reusable hooks or service classes for interacting with backend APIs (e.g., `useCrudResource`, `UserService`).
- DAL handles API calls, error handling, and data transformation.
- Use generated TypeScript types from OpenAPI for all DAL methods.
- Benefits: centralizes API logic, improves maintainability, enables easy swapping of API implementations or mocking in tests.
- Next.js does not provide a DAL by default—this is an app-level pattern.

### 2. Generic CRUD Page Components
- Table/List view (ShadCN Table) with search, sort, filter.
- Modal forms (ShadCN Dialog) for create/edit, using Zod for validation.
- Archive (soft delete) action instead of hard delete.
- Show change history (if backend exposes it).
- Use CASL for RBAC in UI.
- Use TypeScript types generated from OpenAPI for all API calls and forms.

### 3. Data Fetching/Mutations
- Use React Query, SWR, or TanStack Query for CRUD operations.
- Use DAL hooks/services for all resource access.

### 4. Error Handling
- Show uniqueness and permission errors inline.
- Use Zod for runtime validation.

---

## Example: User & Role Admin
- Backend: Expose `/api/users/` and `/api/roles/` with full CRUD, audit, and RBAC, using service/repository pattern for logic.
- Frontend: Use generic admin page for managing users/roles, with type-safe forms, DAL hooks/services, and permission-aware UI.

---

## Summary
- **Backend**: Abstract models, service/repository pattern, generic routers, audit logging, OpenAPI, (optional) Protocols for advanced type safety.
- **Frontend**: Data-access-layer, generic CRUD components, ShadCN UI, Zod validation, CASL RBAC, OpenAPI-generated types.

This pattern ensures rapid, robust, and maintainable CRUD admin development across your stack.
