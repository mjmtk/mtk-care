# Frontend Session Management

## Overview

MTK Care implements professional session management with comprehensive authentication guards and user-friendly session timeout handling. This system ensures secure access while providing excellent user experience during authentication issues.

## Architecture Components

### AuthGuard Component (`/src/components/auth/AuthGuard.tsx`)

The AuthGuard provides layout-level route protection with professional authentication UI states:

```typescript
<AuthGuard>
  <DashboardLayout>
    {children}
  </DashboardLayout>
</AuthGuard>
```

**Features:**
- **Loading State**: Professional spinner with MTK Care branding
- **Session Expired State**: Clean timeout UI with refresh/sign-in options
- **Unauthenticated State**: Branded sign-in prompt with clear messaging
- **Smart Detection**: Distinguishes between session expiry vs. never authenticated
- **Auth Bypass Support**: Seamless development mode integration

### SessionManager Component (`/src/components/auth/SessionManager.tsx`)

Proactive session timeout management with user-friendly warnings:

```typescript
<SessionManager warningThresholdMinutes={5} />
```

**Features:**
- **Proactive Warnings**: Shows dismissible alerts 5 minutes before expiry
- **Real-time Countdown**: Displays exact time remaining
- **One-click Extension**: Simple session refresh capability
- **Auto-detection**: Monitors NextAuth session expiration
- **Professional UI**: Consistent with application design system

## Implementation Guide

### 1. Layout Protection

Add AuthGuard to protect entire application sections:

```typescript
// src/app/dashboard/layout.tsx
import { AuthGuard } from '@/components/auth/AuthGuard';
import { SessionManager } from '@/components/auth/SessionManager';

export default function DashboardLayout({ children }) {
  return (
    <AuthGuard>
      <div className="dashboard-layout">
        {/* Your layout content */}
        {children}
      </div>
      
      {/* Session Management */}
      <SessionManager warningThresholdMinutes={5} />
    </AuthGuard>
  );
}
```

### 2. Custom Loading States

Override default loading behavior:

```typescript
<AuthGuard 
  fallback={<CustomLoadingComponent />}
>
  {children}
</AuthGuard>
```

### 3. Session Configuration

Customize warning thresholds:

```typescript
<SessionManager 
  warningThresholdMinutes={3}  // Warn 3 minutes before expiry
/>
```

## UI States and Behavior

### Loading State
- **Trigger**: `useSession()` returns `status: 'loading'`
- **Display**: Centered card with spinner and "Verifying your session..." message
- **Branding**: MTK Care identity with professional styling

### Session Expired State
- **Trigger**: Session was previously valid but now expired
- **Display**: Warning card with clock icon and "Session Expired" title
- **Actions**: 
  - "Sign In Again" (primary button)
  - "Refresh Page" (secondary button)
- **Context**: Clear explanation about security timeout

### Unauthenticated State
- **Trigger**: No previous session detected
- **Display**: Welcome card with login icon and "Authentication Required" title
- **Actions**: "Sign In to Continue" button
- **Context**: Professional welcome message for MTK Care access

### Session Warning Toast
- **Trigger**: 5 minutes (configurable) before session expires
- **Display**: Top-right dismissible alert with countdown
- **Actions**:
  - "Extend Session" (refresh tokens)
  - "Dismiss" (hide warning)
- **Auto-refresh**: Attempts session extension on user action

## Technical Details

### Session Detection Logic

```typescript
// Determines authentication state
const { data: session, status } = useSession();

if (status === 'loading') {
  return <LoadingState />;
}

if (status === 'unauthenticated' || !session) {
  // Check if user was previously authenticated
  const wasAuthenticated = hasStoredSessionTokens();
  
  if (wasAuthenticated) {
    return <SessionExpiredState />;
  } else {
    return <UnauthenticatedState />;
  }
}

// Authenticated - render protected content
return <>{children}</>;
```

### Session Extension Mechanism

```typescript
const handleExtendSession = () => {
  // Refresh session via NextAuth endpoint
  fetch('/api/auth/session', { method: 'GET' })
    .then(() => {
      window.location.reload();
    })
    .catch(() => {
      router.push('/api/auth/signin');
    });
};
```

### Timer Management

```typescript
useEffect(() => {
  if (!session?.expires) return;

  const checkSessionExpiry = () => {
    const expiryTime = new Date(session.expires).getTime();
    const remaining = expiryTime - Date.now();
    const remainingMinutes = Math.floor(remaining / (1000 * 60));

    if (remainingMinutes <= warningThresholdMinutes && remainingMinutes > 0) {
      setShowWarning(true);
      setTimeRemaining(remainingMinutes);
    }
  };

  const interval = setInterval(checkSessionExpiry, 60000);
  return () => clearInterval(interval);
}, [session, warningThresholdMinutes]);
```

## Security Features

### Automatic Cleanup
- Clears session storage on expiry
- Removes authentication tokens
- Redirects to sign-in flow

### Professional Error Handling
- Graceful degradation for network issues
- Clear error messages for users
- Fallback to sign-in flow on failures

### Development Support
- Auth bypass mode integration
- Debug-friendly logging
- Consistent behavior across environments

## Configuration Options

### AuthGuard Props
```typescript
interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;  // Custom loading component
}
```

### SessionManager Props
```typescript
interface SessionManagerProps {
  warningThresholdMinutes?: number;  // Default: 5 minutes
}
```

## Integration with Existing Auth

### NextAuth.js Compatibility
- Works with existing `useSession()` hooks
- Respects NextAuth session configuration
- Integrates with Azure AD provider setup

### Auth Bypass Mode
- Automatically detects development bypass
- Bypasses session checks in development
- Maintains consistent UI patterns

## Best Practices

### Layout Integration
1. **Add AuthGuard at layout level** - Protects entire sections
2. **Include SessionManager** - Provides proactive warnings
3. **Consistent placement** - Use in all protected layouts

### Error Handling
1. **Graceful degradation** - Always provide fallback UI
2. **Clear messaging** - Explain what happened and next steps
3. **Professional appearance** - Maintain brand consistency

### Performance
1. **Minimal re-renders** - Efficient session state management
2. **Background operations** - Non-blocking session refresh
3. **Cleanup on unmount** - Prevent memory leaks

## Troubleshooting

### Common Issues

**Issue**: AuthGuard shows loading indefinitely
- **Cause**: NextAuth session provider not configured
- **Solution**: Ensure `<SessionProvider>` wraps application

**Issue**: Session warnings not appearing
- **Cause**: Session expiry not properly configured
- **Solution**: Check NextAuth session maxAge and Azure AD token lifetimes

**Issue**: Redirect loops after sign-in
- **Cause**: Auth state inconsistency
- **Solution**: Clear browser storage and verify NextAuth configuration

### Debug Information

Enable detailed logging:
```typescript
// Check session state
console.log('Session status:', status);
console.log('Session data:', session);

// Force session refresh
await getSession();
```

## Related Documentation

- [Authentication Overview](./overview.md) - System architecture
- [Auth Bypass Mode](./auth-bypass-mode.md) - Development setup
- [Azure AD Integration](./azure-ad-role-integration.md) - Production configuration
- [Frontend Session Management](../frontend/session-management.md) - Original healthcare-compliant implementation

## Migration Notes

### From Previous Implementation
The new AuthGuard/SessionManager system replaces manual session checks in individual pages:

**Before:**
```typescript
// In each page component
if (!session) {
  return <div>Please sign in</div>;
}
```

**After:**
```typescript
// In layout component
<AuthGuard>
  {/* All child pages automatically protected */}
</AuthGuard>
```

This provides:
- Consistent authentication UI across the application
- Professional session timeout handling
- Reduced code duplication
- Better user experience during authentication issues