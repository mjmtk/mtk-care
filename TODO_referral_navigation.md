# TODO: Referral Step Navigation Enhancement

## 📋 Task: Implement Clickable Step Navigation

**Priority:** Medium  
**Status:** Planned  
**Target:** Referral creation workflow (steps 1-4)

---

## 🎯 Implementation Plan: Permissive Navigation (Recommended)

### Visual Indicator System:
```
✓ Client Info → ⚠ Referral Details → ● Consent → ○ Review
```

**Step Status Legend:**
- `✓` **Completed** - Step finished, data saved
- `⚠` **Warning** - Step has validation issues or missing required data
- `●` **Current** - Currently active step
- `○` **Pending** - Not yet visited or incomplete

---

## 🔧 Technical Requirements

### 1. **Allow Jumping to Any Step**
- [ ] Make all breadcrumb steps clickable
- [ ] No restrictions on forward/backward navigation
- [ ] Users can jump to any step at any time

### 2. **Auto-save Current Step Before Navigation**
- [ ] Automatically save form data when user clicks another step
- [ ] Prevent data loss during navigation
- [ ] Show save status/confirmation

### 3. **Show Validation Status on Each Step**
- [ ] Display step completion status in breadcrumbs
- [ ] Show warnings for steps with validation issues
- [ ] Visual indicators for required vs. optional fields

### 4. **Final Validation at Submission**
- [ ] Comprehensive validation only when submitting final referral
- [ ] Allow saving drafts with incomplete/invalid data
- [ ] Clear error messaging for submission blockers

---

## 🎨 UX Implementation Details

### **Step Status Components:**
```typescript
interface StepInfo {
  id: number;
  title: string;
  status: 'pending' | 'current' | 'completed';
  warning?: boolean; // For validation issues
  onClick?: () => void; // Make clickable
  icon?: React.ComponentType<{ className?: string }>;
}
```

### **Auto-save Behavior:**
- Trigger save on step click (before navigation)
- Show loading state during save
- Display save confirmation/errors
- Graceful handling of save failures

### **Validation Strategy:**
- **Per-step validation**: Check for missing required fields
- **Cross-step validation**: Dependencies between steps
- **Final validation**: Complete referral validation before submission

---

## 📝 Implementation Steps

### Phase 1: Basic Navigation
- [ ] Update `EnhancedHeader` component to handle click events
- [ ] Modify step rendering to be clickable
- [ ] Add navigation handlers to referral workflow

### Phase 2: Auto-save Integration
- [ ] Implement auto-save before navigation
- [ ] Add save status indicators
- [ ] Handle save errors gracefully

### Phase 3: Validation Status
- [ ] Add validation checking per step
- [ ] Display warning indicators for incomplete steps
- [ ] Update step status based on validation

### Phase 4: Enhanced UX
- [ ] Add confirmation dialogs for unsaved changes (if needed)
- [ ] Implement keyboard navigation (arrows/enter)
- [ ] Add accessibility improvements

---

## 🚨 Considerations & Edge Cases

### **Data Integrity:**
- Ensure no data loss during navigation
- Handle network failures during auto-save
- Provide recovery options for failed saves

### **User Experience:**
- Clear visual feedback for all actions
- Consistent behavior across all steps
- Accessible navigation for screen readers

### **Performance:**
- Avoid excessive API calls during navigation
- Debounce rapid step switching
- Optimize form state management

---

## 📋 Acceptance Criteria

### ✅ **Must Have:**
- [ ] All breadcrumb steps are clickable
- [ ] Auto-save works before navigation
- [ ] Step status accurately reflects completion/issues
- [ ] No data loss during navigation
- [ ] Final validation prevents invalid submissions

### 🎯 **Should Have:**
- [ ] Smooth animations between steps
- [ ] Loading states for save operations
- [ ] Keyboard navigation support
- [ ] Mobile-friendly navigation

### ⭐ **Nice to Have:**
- [ ] Progress percentage indicator
- [ ] Estimated completion time
- [ ] Navigation history/breadcrumb trail
- [ ] Draft auto-save with timestamps

---

## 🔗 Related Files

### **Components to Modify:**
- `src/components/ui/enhanced-header.tsx` - Step display and navigation
- `src/app/dashboard/referrals/new/page.tsx` - Main referral workflow
- `src/components/referrals/steps/` - All step components

### **New Components Needed:**
- Step navigation handler
- Auto-save service/hook
- Validation status manager

---

## 📚 References

- [UX Research: Step Navigation Patterns](https://example.com)
- [Accessibility Guidelines for Form Navigation](https://example.com)
- [Auto-save Best Practices](https://example.com)

---

**Created:** December 2024  
**Last Updated:** December 2024  
**Estimated Effort:** 2-3 sprints  
**Dependencies:** Form state management, API auto-save endpoints