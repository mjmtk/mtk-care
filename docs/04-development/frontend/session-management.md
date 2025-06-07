# Session Management for Healthcare Applications

## Overview

This document describes the custom session management implementation for MTK Care frontend application, designed to meet healthcare security requirements and provide optimal user experience.

> **Note**: This document covers the original healthcare-compliant session management system. For the new professional authentication UI components (AuthGuard and SessionManager), see [Frontend Session Management](../authentication/frontend-session-management.md).

## Architecture

### Core Components

1. **SessionManager** (`/src/services/session-manager.ts`)
   - Handles automatic token refresh
   - Monitors user activity and idle timeouts
   - Manages session lifecycle and warnings

2. **SessionWarning** (`/src/components/auth/SessionWarning.tsx`)
   - UI component for session expiration warnings
   - Countdown timer with visual urgency indicators
   - User options to extend session or logout securely

3. **AuthProvider Integration** (`/src/auth/hooks/auth-provider.tsx`)
   - Integrates session management with MSAL authentication
   - Coordinates between token refresh and session state
   - Handles graceful logout scenarios

## Configuration

### Healthcare-Compliant Defaults

```typescript
const healthcareSessionConfig = {
  refreshInterval: 5,        // Refresh tokens every 5 minutes
  warningBeforeExpiry: 5,    // Warn 5 minutes before expiry
  idleTimeout: 30,           // 30 minutes idle timeout (HIPAA consideration)
  maxSessionDuration: 480,   // 8 hours maximum session
};
```

### Configurable Parameters

| Parameter | Default | Purpose | Healthcare Rationale |
|-----------|---------|---------|---------------------|
| `refreshInterval` | 5 min | Token refresh frequency | Proactive security |
| `warningBeforeExpiry` | 5 min | Warning dialog timing | User awareness |
| `idleTimeout` | 30 min | Idle logout threshold | HIPAA compliance |
| `maxSessionDuration` | 8 hours | Maximum session length | Prevent indefinite access |

## Features

### 1. Automatic Token Refresh

```typescript
// Proactive token refresh every 5 minutes
sessionManager.start(getAccessToken);

// Background refresh without user interruption
const refreshToken = async (): Promise<boolean> => {
  const newToken = await refreshTokenFunction();
  if (newToken) {
    onTokenRefreshSuccess(newToken);
    return true;
  }
  handleTokenRefreshFailure();
  return false;
};
```

**Benefits:**
- Prevents "token expired" errors during active use
- Seamless user experience
- Reduces authentication interruptions

### 2. Session Warning Dialog

```typescript
<SessionWarning
  isOpen={showSessionWarning}
  minutesRemaining={sessionWarningMinutes}
  onExtendSession={handleExtendSession}
  onLogout={handleSessionWarningLogout}
  onExpired={handleSessionExpired}
/>
```

**Features:**
- Real-time countdown timer
- Visual urgency indicators (yellow → orange → red)
- Clear options: "Continue Session" or "Logout Securely"
- Healthcare-appropriate messaging

### 3. Activity Monitoring

```typescript
// Tracks user interaction events
const activityEvents = [
  'mousedown', 'mousemove', 'keypress', 
  'scroll', 'touchstart', 'click'
];

// Resets idle timer on activity
private handleActivity = () => {
  this.updateActivity();
};
```

**Security Benefits:**
- Automatic logout after 30 minutes of inactivity
- Prevents unauthorized access to unattended workstations
- Meets healthcare security requirements

### 4. Graceful Error Handling

```typescript
// Multiple fallback strategies
const sessionCallbacks = {
  onTokenRefreshFailed: () => {
    // Automatic logout when refresh fails
    handleForceLogout('Token refresh failed');
  },
  onSessionExpired: () => {
    // Clear session data and redirect
    handleForceLogout('Session expired');
  },
  onIdleTimeout: () => {
    // Security-compliant idle logout
    handleForceLogout('Idle timeout for security');
  }
};
```

## Implementation Details

### Session Lifecycle

1. **Authentication** → Start session management
2. **Active Use** → Automatic token refresh every 5 minutes
3. **Activity Monitoring** → Reset idle timer on user interaction
4. **Warning Phase** → Show countdown dialog 5 minutes before expiry
5. **Expiration/Timeout** → Graceful logout and cleanup

### Integration with MSAL

```typescript
// MSAL token acquisition
const getAccessToken = async (): Promise<string | null> => {
  const response = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account: account
  });
  return response.accessToken;
};

// Session manager integration
sessionManager.start(getAccessToken);
```

### Error Recovery

- **Silent Refresh Fails** → Interactive token acquisition
- **Interactive Fails** → Force logout with clear messaging
- **Network Issues** → Retry logic with exponential backoff
- **Session Limits** → Graceful expiration with warning

## Healthcare Compliance

### Security Features

- **Idle Timeout**: 30-minute inactivity logout
- **Session Limits**: 8-hour maximum session duration
- **Automatic Cleanup**: Secure token and session data removal
- **Audit Trail**: Comprehensive logging for session events

### User Experience

- **Proactive Warnings**: 5-minute advance notice
- **Clear Options**: Extend session or logout securely
- **Visual Feedback**: Countdown timers and urgency indicators
- **Minimal Disruption**: Background token refresh

## Usage

### Basic Setup

```typescript
import { AuthProvider } from '@/auth/hooks/auth-provider';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

### Custom Configuration

```typescript
const customConfig = {
  refreshInterval: 3,        // More frequent refresh
  idleTimeout: 15,          // Stricter idle timeout
  maxSessionDuration: 240,  // 4-hour sessions
};

const sessionManager = new SessionManager(customConfig, callbacks);
```

## Monitoring and Debugging

### Console Logging

Session management provides detailed console logging:

```
Starting session management for healthcare compliance
Scheduling next token refresh in 5 minutes
Automatic token refresh successful
Session warning: 5 minutes remaining
```

### Event Tracking

All session events are logged for audit purposes:
- Token refresh attempts (success/failure)
- User activity patterns
- Session warnings and user responses
- Logout reasons and timing

## Future Enhancements

### Potential Improvements

1. **Server-Side Session Validation**
   - Coordinate with backend session management
   - Cross-device session limits

2. **Progressive Warnings**
   - Multiple warning intervals (15min, 5min, 1min)
   - Different urgency levels

3. **Activity Analysis**
   - Distinguish between active work vs. idle scrolling
   - Smart timeout adjustments

4. **Integration with Professional Libraries**
   - Consider `react-idle-timer` for activity detection
   - Enhanced NextAuth.js session management
   - MSAL advanced features

## Testing

### Manual Testing Scenarios

1. **Token Refresh**: Wait 5+ minutes and verify background refresh
2. **Idle Timeout**: Leave browser idle for 30+ minutes
3. **Session Warning**: Simulate approaching expiration
4. **Network Issues**: Test offline/online scenarios
5. **Multiple Tabs**: Verify session coordination

### Automated Testing

```typescript
// Example test structure
describe('SessionManager', () => {
  it('should refresh tokens automatically', async () => {
    // Test token refresh logic
  });
  
  it('should detect idle timeout', async () => {
    // Test idle detection
  });
  
  it('should show warning before expiry', async () => {
    // Test warning dialog
  });
});
```

## Troubleshooting

### Common Issues

1. **Token Refresh Loops**
   - Check MSAL configuration
   - Verify Azure AD token lifetimes

2. **Premature Logouts**
   - Review idle timeout settings
   - Check activity event binding

3. **Warning Dialog Issues**
   - Verify React state management
   - Check timer cleanup

### Debug Commands

```typescript
// Check session state
sessionManager.isSessionValid()

// Force token refresh
sessionManager.refreshToken()

// Manual activity update
sessionManager.updateActivity()
```

## Related Documentation

- [Frontend Session Management](../authentication/frontend-session-management.md) - New AuthGuard and SessionManager components
- [Authentication Overview](../authentication/overview.md) - System architecture
- [Azure AD Integration](../authentication/azure-ad-role-integration.md) - Production configuration
- [Session Management Troubleshooting](../../06-troubleshooting/api-issues/session-management-issues.md) - Common issues and solutions