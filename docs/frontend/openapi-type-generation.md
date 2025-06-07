# Frontend TypeScript Type Generation from Backend OpenAPI (Django Ninja)

This guide documents the workflow for keeping your frontend TypeScript types in sync with your backend Django Ninja API using OpenAPI schema generation.

---

## Why This Matters
- Ensures type safety and consistency between backend and frontend.
- Prevents manual drift and reduces bugs.
- Enables rapid frontend development with auto-complete and type checking.

---

## Prerequisites
- Backend Django Ninja API is running and exposes OpenAPI at `/api/openapi.json` (or similar).
- `openapi-typescript` is installed (globally or as a dev dependency).

---

## Manual Type Generation
1. **Start your backend server** (ensure `/api/openapi.json` is accessible).
2. **Run the following command:**
   ```
   npx openapi-typescript http://localhost:8000/api/openapi.json -o frontend/src/types/openapi.d.ts
   ```
   Or, if installed globally:
   ```
   openapi-typescript http://localhost:8000/api/openapi.json -o frontend/src/types/openapi.d.ts
   ```
3. **Import and use the generated types** in your frontend components (e.g., `import { paths } from '@/types/openapi'`).

---

## Automating with a Git Hook
1. **Install Husky** (if not already):
   ```
   npx husky-init && npm install
   ```
2. **Create a pre-commit hook:**
   - Add the following to `.husky/pre-commit`:
   ```sh
   #!/bin/sh
   . "$(dirname "$0")/_/husky.sh"
   npx openapi-typescript http://localhost:8000/api/openapi.json -o frontend/src/types/openapi.d.ts
   git add frontend/src/types/openapi.d.ts
   ```
3. **Now, every commit will regenerate types** and ensure the latest types are committed.

---

## Troubleshooting
- If types for a new API (e.g., `/documents/`) are missing:
  - Ensure the router is registered with the main NinjaAPI instance.
  - Check that all models and dependencies are migrated and error-free.
  - Restart the backend server after making changes.

---

_Last updated: 2025-06-07_
