# SharePoint Folder Structure

## Overview

The MTK Care system organizes documents in SharePoint using a simple, logical folder structure. Client-level documents are organized by category, while referral documents use Django metadata for organization rather than subfolders.

## Folder Structure

```
<client-id>/
├── general/                    # Client-level documents
│   ├── identification/         # ID documents, licenses, etc.
│   ├── medical-records/        # Health records, medical history
│   ├── legal/                  # Court orders, legal documents
│   ├── insurance/              # Insurance documents
│   └── other/                  # Miscellaneous client documents
│
└── referrals/                  # All referral-specific documents
    └── <referral-id>/          # All referral documents in one folder
        ├── consent-form.pdf    # Documents organized by metadata, not subfolders
        ├── assessment.pdf      
        ├── treatment-plan.pdf
        └── progress-note.pdf
```

## Document Type Mapping

### Client-Level Documents (stored in `general/`)

| Document Type | Folder | Description |
|---------------|---------|-------------|
| Identification | `identification/` | Driver's license, passport, birth certificate |
| Health Record | `medical-records/` | Medical history, health assessments |
| Legal Documents | `legal/` | Court orders, legal notices |
| Insurance | `insurance/` | Insurance cards, policies |
| Other | `other/` | Miscellaneous client documents |

### Referral-Specific Documents (stored in `referrals/{referral-id}/`)

| Document Type | Folder | Organization |
|---------------|---------|-------------|
| Consent Form | `referrals/{referral-id}/` | Organized by Django metadata |
| Referral | `referrals/{referral-id}/` | Organized by Django metadata |
| Assessment | `referrals/{referral-id}/` | Organized by Django metadata |
| Treatment Plan | `referrals/{referral-id}/` | Organized by Django metadata |
| Progress Note | `referrals/{referral-id}/` | Organized by Django metadata |
| Discharge Summary | `referrals/{referral-id}/` | Organized by Django metadata |
| Other | `referrals/{referral-id}/` | Organized by Django metadata |

**Note**: All referral documents are stored in the same folder. The system uses Django model fields (`type`, `folder_category`, `description`, `tags`, etc.) to organize and filter documents rather than creating subfolders.

## Automatic Folder Creation

### Client Creation
When a client is created, the system automatically creates:
- Base client folder
- All `general/` subfolders

### Referral Creation
When a referral is created, the system automatically creates:
- Referral base folder (`client-id/referrals/referral-id/`)
- No subfolders - documents organized by metadata

## Benefits of This Structure

1. **Logical Organization**: Clear separation between client-level and referral-specific documents
2. **Easy Navigation**: Staff can quickly find documents based on context
3. **Scalable**: Structure works for clients with multiple referrals
4. **Compliance Ready**: Organized structure supports audit and compliance requirements
5. **Workflow Aligned**: Matches the natural flow of case management

## Implementation Details

- **Folder creation**: Handled automatically by SharePoint service
- **Category mapping**: Frontend maps document types to appropriate folders
- **Context awareness**: System determines folder based on whether document is uploaded in client or referral context
- **URL generation**: SharePoint service generates proper URLs for document access

## Examples

### Client-Level Document Upload
```
Document Type: "Identification"
Context: Client profile
Result: client-123/general/identification/drivers-license.pdf
```

### Referral-Specific Document Upload
```
Document Type: "Consent Form"
Context: Referral ABC-456
Result: client-123/referrals/ABC-456/consent-form.pdf
```

### Progress Note Upload
```
Document Type: "Progress Note"
Context: Referral ABC-456
Result: client-123/referrals/ABC-456/session-notes-2025-01-15.pdf
```