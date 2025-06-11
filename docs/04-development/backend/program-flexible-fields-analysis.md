# Service Management Reference Implementation Analysis

## Overview

This document analyzes the service management reference implementation from the `well-ahead-but-not-deployable` project, focusing on how programs were modeled with flexible fields and the backend-driven form schema approach.

## Key Architectural Patterns

### 1. Flexible Field Implementation

The ServiceProgram model uses several techniques to provide flexibility:

#### JSON Fields for Dynamic Data
```python
enrolment_schema = models.JSONField(blank=True, null=True)  # Dynamic requirements
extra_data = models.JSONField(blank=True, null=True)        # Arbitrary additional data
```

#### Many-to-Many Relationships with OptionLists
```python
service_types = models.ManyToManyField(
    'optionlists.OptionListItem', 
    related_name='service_program_types',
    limit_choices_to={'option_list__slug': 'service_management-service_types'}
)
delivery_modes = models.ManyToManyField(
    'optionlists.OptionListItem',
    related_name='service_program_delivery_modes', 
    limit_choices_to={'option_list__slug': 'service_management-delivery_modes'}
)
```

### 2. Split Input/Output Pattern

The implementation uses a "split-field pattern" for handling complex nested relationships:

- **`staff_input`**: Write-only field for POST/PUT requests
- **`staff`**: Read-only field for GET responses

#### Input Example (POST/PUT):
```json
{
  "name": "Example Program",
  "staff_input": [
    {"staff_id": 1, "role": "manager", "fte": 1.0, "is_responsible": true}
  ]
}
```

#### Output Example (GET):
```json
{
  "id": "...",
  "staff": [
    {
      "id": "123",
      "staff_id": 1,
      "staff_first_name": "John",
      "staff_last_name": "Doe",
      "role": "manager",
      "fte": 1.0,
      "is_responsible": true
    }
  ]
}
```

### 3. Through Models for Complex Relationships

The implementation uses explicit through models for relationships that need additional metadata:

```python
class ServiceAssignedStaff(UUIDPKBaseModel):
    service_program = models.ForeignKey(ServiceProgram, on_delete=models.CASCADE)
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=64)
    fte = models.DecimalField(max_digits=3, decimal_places=2, default=1.0)
    is_responsible = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
```

### 4. Status-Based State Management

Instead of simple boolean flags, the implementation uses a status field with multiple states:

```python
STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('inactive', 'Inactive'),
    ('operational', 'Operational'),
    ('archived', 'Archived'),
]
status = models.CharField(
    max_length=20,
    choices=STATUS_CHOICES,
    default='draft',
    db_index=True
)
```

### 5. Batch Option Lists API

A dedicated endpoint provides all dropdown options in a single call:

```python
@router.get("/options/batch/", response=BatchOptionListsOut)
def get_batch_options_api(request):
    options = ServiceManagementOptionListService.get_batch_option_lists()
    return options
```

Response structure:
```json
{
  "service_types": [
    {"id": 1, "name": "Counselling", "slug": "counselling"}
  ],
  "delivery_modes": [
    {"id": 1, "name": "In-Person", "slug": "in-person"}
  ],
  "locations": [
    {"id": 1, "name": "Auckland", "slug": "auckland"}
  ]
}
```

## Backend-Driven Form Schema Pattern

While the reference implementation mentions a backend-driven form schema pattern in documentation, the actual implementation doesn't include a form schema endpoint. The documentation suggests:

### Proposed Schema Endpoint Structure:
```json
{
  "fields": [
    {
      "name": "name",
      "type": "string",
      "required": true,
      "label": "Service Program Name"
    },
    {
      "name": "status",
      "type": "choice",
      "required": true,
      "choices": [
        {"value": "draft", "display": "Draft"},
        {"value": "active", "display": "Active"},
        {"value": "inactive", "display": "Inactive"}
      ]
    },
    {
      "name": "service_types",
      "type": "optionlist",
      "required": true,
      "option_list_slug": "service_management-service-types"
    }
  ]
}
```

## Key Design Decisions

### 1. Soft Delete Pattern
All models inherit from `UUIDPKBaseModel` which includes soft delete functionality:
- `is_deleted` boolean flag
- `deleted_at` timestamp
- `deleted_by` user reference

### 2. Audit Trail
Models include comprehensive audit fields:
- `created_at` / `created_by`
- `updated_at` / `updated_by`
- `last_synced_at` for external system integration

### 3. Validation in Services Layer
Business logic validation is handled in the service layer:
```python
def validate(self, data):
    staff_data = data.get('staff_input', None)
    if staff_data is None or not staff_data:
        raise serializers.ValidationError({
            'staff': 'You must provide at least one staff assignment.'
        })
    if not any(s.get('is_responsible', False) for s in staff_data):
        raise serializers.ValidationError({
            'staff': 'At least one staff assignment must have is_responsible=true.'
        })
```

### 4. Transaction Safety
All create/update/delete operations use database transactions:
```python
@transaction.atomic
def create_service_program(data: ServiceProgramIn, user_id: Union[UUID, int]) -> ServiceProgram:
    # Implementation
```

## Recommendations for MTK Care Implementation

### 1. Adopt the Split Input/Output Pattern
This pattern provides clarity and flexibility for complex nested relationships.

### 2. Implement the Form Schema Endpoint
Create an endpoint that exposes field metadata to enable dynamic form generation:
- Field types and validation rules
- Required/optional status
- OptionList associations
- Help text and labels

### 3. Use Status Fields Over Boolean Flags
Status fields provide more flexibility than simple active/inactive booleans.

### 4. Leverage Through Models
For relationships that need additional metadata (like staff assignments with roles and FTE).

### 5. Implement Batch Option Lists
Reduce API calls by fetching all dropdown options in a single request.

### 6. Consider JSON Fields Carefully
While `extra_data` provides flexibility, ensure proper validation and documentation of expected structure.

## Implementation Considerations

### 1. Migration Strategy
- Start with core fields and relationships
- Add flexible fields incrementally
- Ensure proper indexes on status and foreign key fields

### 2. API Design
- Use consistent patterns for all CRUD operations
- Implement proper error handling with meaningful messages
- Use Django Ninja's schema validation

### 3. Frontend Integration
- Build generic form components that can render based on schema
- Cache option lists for performance
- Handle the split input/output pattern transparently

### 4. Testing
- Test all validation rules
- Verify transaction rollback on errors
- Test soft delete behavior
- Validate that overlapping enrolments are prevented

## Conclusion

The reference implementation provides a solid foundation for building flexible program management with:
- Clear separation of concerns
- Flexible field support through JSON and many-to-many relationships
- Comprehensive audit trails
- Transaction safety
- Well-structured API patterns

The key missing piece is the actual form schema endpoint, which should be implemented to fully realize the backend-driven form pattern.