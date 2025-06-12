# Cultural Identity Persistence - Debugging Guide

**Created**: December 12, 2025  
**Context**: Debugging session fixing cultural identity fields (iwi_hapu, spiritual_needs) not persisting across referral workflow and client details pages.

## Problem Summary

Cultural identity fields (Iwi/Hapū Affiliation, Spiritual Needs) were not persisting properly when:
- Saved during referral creation workflow (step 2)
- Viewed in referral edit mode (reloading step 2)
- Displayed in client details Personal Info section

## Root Causes Identified

### 1. **Clean Architecture Implementation Required**
**Issue**: Emergency contacts and cultural identity data were being handled through referral workflow instead of directly on client records.

**Solution**: Separated concerns by creating dedicated client API endpoints:
- `/api/v1/clients/{id}/emergency-contacts` (GET, POST, PUT, DELETE)
- `/api/v1/clients/{id}/cultural-identity` (PATCH)

**Key Learning**: Related data should be managed through the appropriate domain service, not proxied through other workflows.

### 2. **Django Ninja API Response Schema Conflicts**
**Issue**: API endpoints with `response=SchemaClass` force Pydantic validation, preventing custom serializers from working.

**Symptoms**:
```python
@router.patch("/{client_id}/cultural-identity", response=ClientDetailSchema)  # ❌ Breaks custom serialization
@router.get("/{client_id}", response=ClientDetailSchema)  # ❌ Forces Pydantic validation
```

**Solution**: Remove response schema to allow custom serializers:
```python
@router.patch("/{client_id}/cultural-identity")  # ✅ Uses custom serializer
@router.get("/{client_id}")  # ✅ Uses custom serializer
```

**Key Learning**: When using custom serializers, avoid Django Ninja response schema declarations.

### 3. **JSON Serialization of Django Model Objects**
**Issue**: Django model objects aren't JSON serializable when returned directly.

**Error**: `TypeError: Object of type OptionListItem is not JSON serializable`

**Solution**: Convert Django models to dictionaries in custom serializers:
```python
# ❌ Wrong - returns Django objects
'iwi_hapu': client.iwi_hapu,

# ✅ Correct - returns JSON-safe dict
'iwi_hapu': {
    'id': client.iwi_hapu.id,
    'label': client.iwi_hapu.label,
    'slug': client.iwi_hapu.slug
} if client.iwi_hapu else None,
```

**Key Learning**: Always serialize Django model relationships to dictionaries for API responses.

### 4. **Form Field ID Requirements**
**Issue**: Frontend forms need both the related object AND the field ID for proper display/editing.

**Frontend Pattern**:
```typescript
// Form needs ID for selection
setValue('iwi_hapu_id', data.iwi_hapu_id);

// Display needs label for showing
<span>{data.iwi_hapu?.label}</span>
```

**Backend Solution**: Include both in serializer:
```python
# Related object for display
'iwi_hapu': {
    'id': client.iwi_hapu.id,
    'label': client.iwi_hapu.label,
    'slug': client.iwi_hapu.slug
} if client.iwi_hapu else None,

# Field ID for form editing
'iwi_hapu_id': client.iwi_hapu.id if client.iwi_hapu else None,
```

**Key Learning**: API responses for form data should include both related objects (for display) and field IDs (for editing).

### 5. **Date Field Validation Issues**
**Issue**: Empty date strings caused 422 validation errors: "Input should be a valid date or datetime, input is too short"

**Solution**: Clean date values before API submission:
```typescript
const cleanDateValue = (value: any) => {
  if (!value || value === '' || value === undefined) return null;
  if (typeof value === 'string' && value.length < 10) return null;
  return value;
};
```

**Key Learning**: Always validate and clean date fields on the frontend before sending to API.

### 6. **Database Constraint Violations - Consent Records**
**Issue**: Duplicate key constraint violations when creating consent records.

**Error**: `duplicate key value violates unique constraint "referral_management_consentrecord_referral_id_consent_type_id_key"`

**Solution**: Use atomic `get_or_create` operations:
```python
consent_record, created = ConsentRecord.objects.get_or_create(
    referral=updated_referral,
    consent_type_id=consent_type_id,
    defaults=defaults
)
```

**Key Learning**: Use Django's `get_or_create` for records with unique constraints to prevent race conditions.

### 7. **Database Refresh After Model Updates**
**Issue**: Related objects weren't properly loaded after saving changes.

**Solution**: Refresh model from database after save:
```python
client.save()
client.refresh_from_db()  # Ensures related objects are loaded
```

**Key Learning**: Use `refresh_from_db()` after saving models when you need to access updated related objects.

## Debugging Methodology

### 1. **Add Comprehensive Logging**
```typescript
// Frontend - trace data flow
console.log('=== Step Entry Point ===');
console.log('Form data received:', formData);
console.log('API response:', result);
console.log('Field IDs returned:', result.iwi_hapu_id, result.spiritual_needs_id);
```

```python
# Backend - trace business logic
logger.info(f"Processing cultural identity for client {client_id}")
logger.info(f"Received data: {cultural_data}")
logger.info(f"Final state: iwi_hapu={client.iwi_hapu} (ID: {client.iwi_hapu.id if client.iwi_hapu else None})")
```

### 2. **Verify API Response Structure**
```typescript
console.log('Full result object keys:', Object.keys(result));
```

Use this to check if expected fields are present in API responses.

### 3. **Test Data Flow End-to-End**
1. Save data in referral workflow
2. Check backend logs for save confirmation
3. Reload referral edit page - verify form population
4. Check client details page - verify display
5. Verify API responses contain required fields

### 4. **Check Django Ninja Response Types**
Look for endpoints with `response=Schema` that might be interfering with custom serializers.

## Prevention Checklist

### Before Implementing Related Data Features:
- [ ] Identify the correct domain service for data management
- [ ] Design API endpoints following clean architecture principles
- [ ] Plan for both display data and form editing requirements

### When Creating Django Ninja API Endpoints:
- [ ] Avoid `response=Schema` if using custom serializers
- [ ] Ensure all Django model objects are converted to dicts
- [ ] Include both related objects and field IDs in responses
- [ ] Add proper error handling and logging

### When Implementing Frontend Forms:
- [ ] Clean and validate data before API calls
- [ ] Handle both initial load and edit scenarios
- [ ] Add comprehensive logging for debugging
- [ ] Test data persistence across page reloads

### When Working with Database Relationships:
- [ ] Use `get_or_create` for unique constraint scenarios
- [ ] Add `refresh_from_db()` after saves when accessing related data
- [ ] Consider atomic transactions for multi-step operations

## Testing Strategy

### Manual Testing Steps:
1. **Create new referral** - enter cultural identity data on step 2
2. **Continue to step 3** - verify data persists
3. **Navigate back to step 2** - verify form shows selected values
4. **Complete referral** - save and exit workflow
5. **Reload referral edit page** - verify step 2 shows saved data
6. **Open client details page** - verify Personal Info section displays data
7. **Edit cultural identity** - change values and verify they persist

### API Testing:
```bash
# Test cultural identity save
curl -X PATCH /api/v1/clients/{id}/cultural-identity \
  -H "Content-Type: application/json" \
  -d '{"iwi_hapu_id": 2009, "spiritual_needs_id": 2104}'

# Verify response includes field IDs
# Should return: {"iwi_hapu_id": 2009, "spiritual_needs_id": 2104, ...}
```

## Common Error Patterns

### 1. "Field required" Pydantic Errors
- **Cause**: Django Ninja response schema conflicts
- **Fix**: Remove `response=Schema` from endpoint decorator

### 2. "Object not JSON serializable"
- **Cause**: Returning Django model objects directly
- **Fix**: Convert to dictionaries in serializer

### 3. Form fields showing "undefined"
- **Cause**: Missing field IDs in API response
- **Fix**: Add explicit field IDs to serializer

### 4. Data not persisting across page reloads
- **Cause**: Data saved to wrong domain or not saved at all
- **Fix**: Verify data flows to correct API endpoints and verify backend logging

### 5. Database constraint violations
- **Cause**: Race conditions or duplicate creation attempts
- **Fix**: Use atomic operations like `get_or_create`

## Related Documentation

- [API Design Standards](../03-architecture/api-design/django-ninja-api-standards.md)
- [Database Migration Guide](../03-architecture/database/uuid-migration-guide.md)
- [Frontend Session Management](../04-development/frontend/session-management.md)
- [Permissions Architecture](../03-architecture/permissions-architecture.md)

---

**Key Takeaway**: Always implement clean separation of concerns, use proper Django Ninja patterns, and include comprehensive logging for future debugging. The combination of custom serializers + removed response schemas + comprehensive field inclusion solved this complex persistence issue.