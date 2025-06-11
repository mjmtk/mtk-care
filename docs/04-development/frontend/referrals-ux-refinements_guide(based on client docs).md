# UX Design Refinements for Referrals & Intake

## Overview
Refined screen designs for the referrals and intake flow, incorporating UX best practices for community services workflows. These designs prioritize efficiency, error prevention, and accessibility while maintaining the core three-screen structure.

---

## Screen 1: Referral Source & Basic Details (Enhanced)

```
┌─────────────────────────────────────────────────────────┐
│ [1●]─────[2○]─────[3○]  New Referral           [Draft] │
│                                                         │
│ 📋 Referral Information                                │
│                                                         │
│ Referral Source *                                       │
│ ○ External Agency    ○ School                          │
│ ○ Self-Referral      ○ Internal Transfer               │
│                                                         │
│ ┌─ If External Agency ─────────────────────────────┐   │
│ │ Agency Name *  [Oranga Tamariki        ▼]       │   │
│ │ Contact Person [Sarah Wilson           ]        │   │
│ │ Reference #    [OT-2025-1234          ]        │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Service Program *                                       │
│ [Social Workers in Schools    ▼]                       │
│                                                         │
│ Urgency Level *                                         │
│ ○ 🟢 Routine (1 week)    ○ 🟡 Priority (3 days)       │
│ ○ 🔴 Urgent (24 hours)   ○ ⚫ Crisis (immediate)       │
│                                                         │
│                           [Continue →]                 │
└─────────────────────────────────────────────────────────┘
```

### Design Rationale
- **Progressive disclosure**: Conditional fields reduce cognitive load
- **Visual urgency indicators**: Color-coded urgency with time expectations
- **Smart defaults**: Common agencies pre-populated in dropdown
- **Clear progress**: Step indicator shows journey progress

---

## Screen 2: Client Identification (Smart Resolution Enhanced)

```
┌─────────────────────────────────────────────────────────┐
│ [1●]─────[2●]─────[3○]  Client Information     [Draft] │
│                                                         │
│ 👤 Who is this referral for?                          │
│                                                         │
│ Search existing clients first                           │
│ [Type name, phone, or email...        ] 🔍             │
│                                                         │
│ ┌─ Search Results ─────────────────────────────────┐   │
│ │ ● Sarah Johnson (DOB: 15/03/2010)               │   │
│ │   📍 Auckland Grammar School  Year 9            │   │
│ │   ✅ Consent valid until 20/12/2025             │   │
│ │   [Select This Client]                          │   │
│ │                                                 │   │
│ │ ● Sarah Johnston (DOB: 12/03/2010)              │   │
│ │   📍 Western Springs College  Year 9            │   │
│ │   ⚠️ Consent expires 25/06/2025                 │   │
│ │   [Select This Client]                          │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ○ None of these match - create new client              │
│                                                         │
│ ┌─ New Client (shows when selected) ──────────────┐   │
│ │ First Name * [                    ]            │   │
│ │ Last Name *  [                    ]            │   │
│ │ Date of Birth * [  /  /    ] 📅              │   │
│ │ School      [Auckland Grammar     ▼]          │   │
│ │ Year Level  [Year 9              ▼]          │   │
│ └───────────────────────────────────────────────────┘   │
│                                                         │
│                     [← Back]    [Continue →]           │
└─────────────────────────────────────────────────────────┘
```

### Design Rationale
- **Search-first approach**: Prevents duplicate client creation
- **Confidence indicators**: Visual cues for match quality and consent status
- **Contextual information**: School and year level help with identification
- **Progressive client creation**: Only show new client fields when needed
- **Smart suggestions**: Fuzzy matching handles common name variations

---

## Screen 3: Referral Details & Consent (Enhanced)

```
┌─────────────────────────────────────────────────────────┐
│ [1●]─────[2●]─────[3●]  Complete Referral     [Draft] │
│                                                         │
│ 📝 Referral Details                                    │
│                                                         │
│ Presenting Concern / Reason for Referral *             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Describe the main concerns, behaviors, or           │ │
│ │ situations that led to this referral...             │ │
│ │                                                     │ │
│ │ Focus on specific examples and any safety           │ │
│ │ considerations.                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ 👨‍👩‍👧‍👦 Family & Consent Information                      │
│                                                         │
│ Primary Contact (Parent/Guardian) *                     │
│ Name     [Maria Johnson           ]                     │
│ Phone    [021 555 0123           ] 📱                  │
│ Email    [maria.j@email.com      ] ✉️                  │
│ Relationship [Mother              ▼]                   │
│                                                         │
│ Additional Contact (Optional)                           │
│ Name     [David Johnson          ]                     │
│ Phone    [09 555 0456           ] 📱                   │
│ Relationship [Father              ▼]                   │
│                                                         │
│ Consent Status *                                        │
│ ○ ✅ Consent obtained - ready to proceed               │
│ ○ 📞 Will contact family to obtain consent             │
│ ○ ⚠️ Family aware but consent pending                  │
│                                                         │
│ 🌏 Cultural Considerations                             │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Any cultural factors, accessibility needs,          │ │
│ │ language preferences, or specific family            │ │
│ │ circumstances to consider...                        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ Additional Files (Optional)                             │
│ [📎 Attach Files] Current: assessment-report.pdf       │
│                                                         │
│           [← Back]    [Save Draft]    [Submit Referral] │
└─────────────────────────────────────────────────────────┘
```

### Design Rationale
- **Guided text entry**: Placeholder text provides specific guidance for SWiS context
- **Contact hierarchy**: Clear primary/secondary contact structure
- **Visual consent tracking**: Icons make consent status immediately scannable
- **Cultural responsiveness**: Dedicated section for cultural considerations
- **Multiple save options**: Draft vs. submit gives users control over completion timing
- **File attachment**: Visual indicator for uploaded documents

---

## Key UX Improvements Summary

### 1. **Visual Information Hierarchy**
- **Step indicators** show progress and allow navigation
- **Color-coded status** for urgency, consent, and priority
- **Icons** reinforce meaning and improve scannability
- **Grouped sections** with clear headings and visual separation

### 2. **Smart Form Behavior**
- **Conditional fields** appear only when relevant
- **Auto-complete** for common values (schools, agencies)
- **Format assistance** for phones and dates
- **Draft saving** prevents data loss

### 3. **Error Prevention**
- **Search before create** prevents duplicate clients
- **Clear field requirements** with visual indicators
- **Helpful placeholder text** guides proper completion
- **Validation feedback** appears contextually

### 4. **Mobile-Optimized Design**
- **Single column** layout works on all screen sizes
- **Large touch targets** for mobile interaction
- **Simplified navigation** with clear back/forward flow
- **Thumb-friendly** button placement

### 5. **Accessibility Features**
- **High contrast** status indicators
- **Clear focus states** for keyboard navigation
- **Descriptive labels** for screen readers
- **Logical tab order** through form elements

### 6. **Contextual Guidance**
- **Program-specific prompts** (SWiS vs. other services)
- **Role-based visibility** of certain fields
- **Smart defaults** based on referral source
- **Helpful examples** in placeholder text

---

**Implementation Notes**: Ready for frontend development with focus on progressive enhancement and mobile-first responsive design.