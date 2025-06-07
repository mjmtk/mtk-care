# Backend UUID Migration & API Setup

## Overview
This document describes the migration of primary keys to UUIDs for all major models in the Django backend, the process for resetting the database, and the required steps to ensure the API is working and compatible with the Next.js frontend.

---

## UUID Migration Steps

1. **Model Updates:**
   - All major models (`Role`, `UserProfile`, `GroupRoleMapping`, etc.) now use `UUIDField` as their primary key.
   - All ForeignKey and ManyToMany relationships reference UUIDs.
   - All Pydantic schemas and API serialization logic expect UUIDs for IDs.

2. **Resetting the Database:**
   - All old migration files were deleted (except `__init__.py`).
   - The database was dropped and recreated to allow for a clean migration.

3. **Migration Commands:**
   ```bash
   # Connect to Postgres and recreate the database
   psql -U <DB_USER> -h <DB_HOST> -d postgres
   DROP DATABASE IF EXISTS <DB_NAME>;
   CREATE DATABASE <DB_NAME>;
   \q

   # Back in your backend directory
   python manage.py makemigrations users
   python manage.py migrate
   ```
   - Replace `<DB_USER>`, `<DB_HOST>`, and `<DB_NAME>` with your actual credentials (see `.env`).

4. **Verification:**
   - Run the Django server and test endpoints (e.g., `/api/v1/users/`).
   - All returned IDs should be UUIDs.
   - Manual API tests should work without schema validation errors.

---

## Role and Group-Role Mapping Seeding: Best-Practice Workflow

### 1. **Automatic Role Seeding**
- **Core roles** (e.g., Superuser, Manager, Provider, Staff) are seeded automatically during initial setup.
- This may be done via a Django data migration or a management command that is always run after `migrate`.
- This ensures every environment (development, staging, production) always has the correct roles immediately after database setup.

### 2. **Manual/Scripted Group-Role Mapping Seeding (Environment-Specific)**
- **Azure AD group-role mappings** are *not* seeded automatically, because group IDs and names are unique to each client or environment.
- Instead, use the provided management command (`python manage.py seed_roles`) with the `GROUP_ROLE_MAPPINGS` section filled out for your environment. (Uncomment and edit as needed.)
- This should be a documented, required post-deployment step for each environment.
- **Security best practice:** Never commit client-specific Azure AD group IDs/names to source control.

#### **Example Post-Deployment Steps for a New Environment**
1. Deploy code and run migrations:
   ```bash
   python manage.py migrate
   ```
2. (Optional) Run the management command to seed roles if not handled by migration:
   ```bash
   python manage.py seed_roles
   ```
3. Edit the `GROUP_ROLE_MAPPINGS` section in `seed_roles.py` to match your Azure AD group IDs/names for this environment, then run:
   ```bash
   python manage.py seed_roles
   ```

---

## Rationale
- **Roles** are universal and should be present in all environments, so they are seeded automatically.
- **Group-role mappings** are environment-specific and must be set up by an admin or ops engineer after deployment, using environment-appropriate values.
- This approach ensures security, flexibility, and avoids leaking client-specific configuration.

---

## Next.js Frontend Requirements

### 1. API Endpoint Updates
- Update all API calls in the frontend to use the new versioned endpoints (e.g., `/api/v1/users/`, `/api/v1/roles/`).

### 2. TypeScript Type Generation
- **Strongly recommended:** Generate TypeScript types from the backend OpenAPI schema to keep frontend and backend in sync.
- Tools:
  - [`openapi-typescript`](https://github.com/drwpow/openapi-typescript) (recommended for Next.js projects)
  - [`django-ninja-typescript-generator`](https://django-ninja.dev/guides/typescript/)
- Example command:
  ```bash
  npx openapi-typescript http://localhost:8000/api/openapi.json -o frontend/src/types/api.d.ts
  ```
- Run this command whenever backend schemas change.
- Update imports in your frontend code to use the generated types.

### 3. .env.local Configuration
- Ensure your `frontend/.env.local` points to the correct backend API URL (e.g., `API_URL=http://localhost:8000/api`)

---

## Summary
- All backend IDs (except optionlists/items) are now UUIDs.
- The database and migrations are reset for a clean start.
- The frontend should use generated TypeScript types from the backend OpenAPI schema for type safety.

---

**For questions or issues, see this doc or contact the backend maintainer.**
