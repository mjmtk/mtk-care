# Django App Refactor & Migration Checklist (Reference → Modular, DRF → Ninja)

This checklist is for copying a Django app from a reference project into your modular backend, refactoring it for modern best practices, and replacing Django REST Framework (DRF) with Django Ninja.

---

## 1. Preparation
- [ ] Identify the reference app directory and target location in `backend/apps/`.
- [ ] Review the reference app's dependencies (models, OptionLists, etc.).

## 2. Copy & Initial Setup
- [ ] Copy the app directory into `backend/apps/` with the desired new name.
- [ ] Rename the app folder and all references (e.g., `service_management` → `programs`).
- [ ] Create/update `apps.py` with a proper `AppConfig`.
- [ ] Add `default_app_config` to `__init__.py`.

## 3. Refactor Models
- [ ] Rename all models, fields, and related names to fit the new app context.
- [ ] Update all ForeignKey/M2M relationships to point to correct models.
- [ ] Update OptionList slugs to match the new app prefix.
- [ ] Remove or update any legacy/unused fields.

## 4. Remove DRF and Add Ninja
- [ ] Delete all DRF serializers, viewsets, routers, APIViews, and DRF imports.
- [ ] Replace DRF serializers with Pydantic schemas (in `schemas.py`).
- [ ] Replace DRF views/viewsets with Django Ninja routers and API functions (in `api.py`).
- [ ] Update URLs to use Ninja's router includes.
- [ ] Remove DRF permissions and use Ninja's authentication/permissions if needed.

## 5. Update Admin & Tests
- [ ] Refactor admin registration to match new models.
- [ ] Update or create tests to cover model, schema, and API functionality (prefer small, focused test files).

## 6. App Integration
- [ ] Add the app to `INSTALLED_APPS` in Django settings **only when all dependencies are ready**.
- [ ] Run `makemigrations` and `migrate` to set up the database.
- [ ] Test API endpoints and admin functionality.

## 7. Documentation
- [ ] Document any changes, new endpoints, or OptionList slugs in `/docs`.

---

**Tip:** If the app grows beyond 250 lines per file, split models, schemas, and API into smaller files for maintainability.

_Last updated: 2025-06-07_
