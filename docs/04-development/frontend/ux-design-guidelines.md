# UX Design Guidelines for MTK-Care

## Overview

This document establishes the core UX principles and design patterns for MTK-Care frontend development. These guidelines ensure consistency, usability, and efficiency across all features and pages.

## 🎯 Core UX Principles

### 1. **Progressive Disclosure**
- **Summary → Detail → Edit**: Show information in layers of increasing detail
- **Collapsed by Default**: Complex information starts collapsed, expands on demand
- **Context-Aware Expansion**: Show details relevant to current user task
- **Examples**: 
  - Organization cards → Organization detail → Edit organization
  - Contact summary → Contact details → Edit contact

### 2. **Contextual Information**
- **Status Indicators**: Visual cues for item state (active/inactive, urgent/normal)
- **Temporal Context**: Show when things were last updated, created, or accessed
- **Relationship Context**: Display connections between entities (referrals, contacts, etc.)
- **User Context**: Adapt interface based on user role and permissions

### 3. **Efficient Data Entry**
- **Inline Editing**: Edit simple fields directly in place
- **Smart Defaults**: Auto-detect and suggest appropriate values
- **Bulk Operations**: Enable batch actions for repetitive tasks
- **Auto-Save**: Persist changes automatically to prevent data loss
- **Validation**: Real-time feedback with clear error messages

### 4. **Mobile-First Interactions**
- **Touch Targets**: Minimum 44px for interactive elements
- **Swipe Gestures**: Quick actions via swipe (call, email, archive)
- **Adaptive Layouts**: Responsive design that works on all screen sizes
- **Offline Capability**: Core functionality available without network

## 📱 Responsive Layout Patterns

### Split-View Pattern
```
Desktop: [Sidebar List | Main Content | Detail Panel]
Tablet:  [Collapsible List | Main Content + Overlay]
Mobile:  [Stack: Search → List → Details]
```

### Card-Based Layouts
- **Summary Cards**: Key information at a glance
- **Expandable Details**: Additional information on demand
- **Action Buttons**: Quick actions prominently displayed
- **Status Indicators**: Visual cues for item state

### Navigation Patterns
- **Tab Navigation**: For related content areas
- **Breadcrumbs**: For hierarchical navigation
- **Back Buttons**: Clear exit paths on mobile
- **Contextual Actions**: Floating action buttons where appropriate

## 🎨 Visual Design Language

### Color System
```scss
// Semantic Colors
$primary: #3B82F6;     // Primary actions
$success: #10B981;     // Active status, success
$warning: #F59E0B;     // Attention needed
$danger: #EF4444;      // Errors, deletion
$neutral: #6B7280;     // Inactive, secondary

// Context Colors (Organization Types)
$service-provider: #3B82F6;
$funder: #10B981;
$government: #8B5CF6;
$peak-body: #F59E0B;
```

### Typography
```scss
$heading-font: 'Inter', sans-serif;
$body-font: 'Inter', sans-serif;

// Fluid Typography
$h1: clamp(1.5rem, 4vw, 2.5rem);
$h2: clamp(1.25rem, 3vw, 2rem);
$body: clamp(0.875rem, 2vw, 1rem);
```

### Spacing
```scss
// Fluid Spacing System
$spacing-xs: clamp(0.25rem, 1vw, 0.5rem);
$spacing-sm: clamp(0.5rem, 2vw, 1rem);
$spacing-md: clamp(1rem, 3vw, 1.5rem);
$spacing-lg: clamp(1.5rem, 4vw, 2.5rem);
$spacing-xl: clamp(2rem, 5vw, 4rem);
```

### Interactive Elements
```scss
$button-height: 44px;        // Touch-friendly
$input-height: 48px;         // Easy to tap
$border-radius: 8px;         // Modern, friendly
$focus-ring: 0 0 0 3px rgba(59, 130, 246, 0.1);
```

## 🔍 Search & Filter Patterns

### Global Search
- **Unified Search Bar**: Search across all content types
- **Smart Suggestions**: Auto-complete based on user history
- **Scoped Results**: Filter by content type (organizations, contacts, etc.)
- **Recent Searches**: Quick access to previous searches

### Filter Chips
- **Visual Filters**: Chip-based interface for active filters
- **Quick Toggles**: Common filters as clickable chips
- **Clear All**: Easy way to reset all filters
- **Filter Count**: Show number of results for each filter

### Advanced Filtering
- **Progressive Disclosure**: Basic → Advanced filters
- **Filter Persistence**: Remember user's preferred filters
- **Save Filters**: Allow saving complex filter combinations

## 📋 Data Display Patterns

### List Views
- **Card-Based**: Information-rich cards over simple lists
- **Virtual Scrolling**: Performance for large datasets
- **Skeleton Loading**: Show structure while loading
- **Empty States**: Helpful messaging when no data

### Detail Views
- **Information Hierarchy**: Most important info first
- **Sectioned Content**: Logical grouping with clear headers
- **Quick Actions**: Prominent placement of common actions
- **Edit in Place**: Minimize mode switching

### Form Patterns
- **Inline Validation**: Real-time feedback
- **Smart Defaults**: Reduce data entry burden
- **Error Prevention**: Guide users to valid inputs
- **Progress Indication**: Show completion status for multi-step forms

## ⚡ Performance Guidelines

### Loading Patterns
- **Skeleton UI**: Show structure while content loads
- **Progressive Loading**: Load critical content first
- **Lazy Loading**: Load content as needed
- **Optimistic Updates**: Show changes immediately

### Caching Strategy
- **Search Results**: Cache frequently accessed queries
- **User Preferences**: Persist UI state locally
- **Offline Support**: Core functionality without network

## ♿ Accessibility Requirements

### Keyboard Navigation
- **Tab Order**: Logical navigation sequence
- **Focus Management**: Clear focus indicators
- **Keyboard Shortcuts**: Power user efficiency
- **Skip Links**: Quick navigation for screen readers

### Screen Reader Support
- **ARIA Labels**: Descriptive labels for all controls
- **Landmark Roles**: Proper page structure
- **Live Regions**: Announce dynamic content changes
- **Alternative Text**: Meaningful descriptions for images

### Visual Accessibility
- **Color Contrast**: WCAG AA compliance minimum
- **Focus Indicators**: High-contrast focus rings
- **Text Scaling**: Support up to 200% zoom
- **Motion Preferences**: Respect reduced motion settings

## 🎯 User Flow Patterns

### Task-Oriented Design
- **Primary Actions**: Make most common tasks prominent
- **Quick Actions**: One-click access to frequent operations
- **Contextual Actions**: Show relevant options based on current context
- **Undo Capability**: Allow reversal of destructive actions

### Error Handling
- **Prevention**: Guide users away from errors
- **Clear Messaging**: Explain what went wrong and how to fix it
- **Recovery Options**: Provide paths to successful completion
- **Graceful Degradation**: Maintain functionality when possible

### Feedback Patterns
- **Immediate Feedback**: Acknowledge user actions instantly
- **Progress Indication**: Show completion status for long operations
- **Success Confirmation**: Clearly indicate successful completion
- **System Status**: Keep users informed of system state

## 📝 Content Guidelines

### Microcopy
- **Action-Oriented**: Use verbs that describe the action
- **User-Focused**: Write from the user's perspective
- **Consistent Terminology**: Use the same terms throughout
- **Helpful Guidance**: Provide context and examples

### Error Messages
- **Specific**: Explain exactly what went wrong
- **Actionable**: Tell users how to fix the problem
- **Friendly Tone**: Maintain helpful, non-technical language
- **Context-Aware**: Reference the specific field or action

### Empty States
- **Explain the Benefit**: Why this feature is valuable
- **Guide Next Steps**: Clear call-to-action
- **Provide Examples**: Show what populated state looks like
- **Reduce Friction**: Make it easy to get started

## 🔄 Implementation Guidelines

### Component Development
- **Reusable Components**: Build once, use everywhere
- **Prop-Driven**: Flexible configuration through props
- **Accessibility Built-In**: Include ARIA attributes by default
- **Performance Optimized**: Efficient rendering and updates

### State Management
- **Local First**: Use local state when possible
- **Optimistic Updates**: Update UI immediately, sync in background
- **Error Boundaries**: Graceful handling of component failures
- **Loading States**: Clear indication of asynchronous operations

### Testing Strategy
- **User Journey Testing**: Test complete workflows
- **Accessibility Testing**: Automated and manual accessibility checks
- **Performance Testing**: Monitor and optimize rendering performance
- **Cross-Device Testing**: Ensure consistency across platforms

## 📚 Resources

### Design System
- **Component Library**: ShadCN UI + custom components
- **Icon Library**: Consistent icon usage patterns
- **Color Palette**: Semantic color system
- **Typography Scale**: Responsive text sizing

### Tools
- **Figma**: Design files and prototypes
- **Storybook**: Component documentation and testing
- **Browser DevTools**: Accessibility and performance auditing
- **User Testing**: Regular validation with actual users

---

**Note**: These guidelines are living documents that evolve with the product. All team members should contribute to improvements and clarifications based on user feedback and development experience.