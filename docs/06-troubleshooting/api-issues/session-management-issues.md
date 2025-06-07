# Session Management and Authentication UI Issues

## Problem: Users See "Please Sign In" Message with Visible UI Shell

### Symptoms
- Dashboard/client layout components (sidebar, header) are visible
- Main content area shows "Please sign in to access the dashboard"
- User appears to be authenticated but content won't load
- Session may have expired but UI doesn't reflect this properly

### Root Cause
This occurs when:
1. Session tokens have expired but UI layouts don't check authentication state
2. AuthGuard component is not properly wrapping protected routes
3. Session management is only checked at the page level, not layout level

### Solution

1. **Ensure AuthGuard is wrapping layouts (not just pages)**:
   ```typescript
   // src/app/dashboard/layout.tsx
   import { AuthGuard } from '@/components/auth/AuthGuard';
   
   export default function DashboardLayout({ children }) {
     return (
       <AuthGuard>
         <div className="dashboard-layout">
           {/* Layout content */}
         </div>
       </AuthGuard>
     );
   }
   ```

2. **Add SessionManager for proactive warnings**:
   ```typescript
   import { SessionManager } from '@/components/auth/SessionManager';
   
   // Inside your layout
   <SessionManager warningThresholdMinutes={5} />
   ```

3. **Verify SessionProvider is properly configured**:
   ```typescript
   // src/app/layout.tsx
   import { Providers } from '@/components/providers/session-provider';
   
   export default function RootLayout({ children }) {
     return (
       <html lang="en">
         <body>
           <Providers>
             {children}
           </Providers>
         </body>
       </html>
     );
   }
   ```

### Prevention
- Always wrap protected layouts with AuthGuard, not just individual pages
- Include SessionManager in all authenticated layouts
- Test session expiry scenarios during development

---

## Problem: Session Warnings Not Appearing

### Symptoms
- Sessions expire without warning
- Users lose work due to unexpected logouts
- No proactive session extension prompts

### Root Cause
- SessionManager component not included in layout
- NextAuth session configuration issues
- Incorrect warning threshold configuration

### Solution

1. **Add SessionManager to protected layouts**:
   ```typescript
   <SessionManager warningThresholdMinutes={5} />
   ```

2. **Verify NextAuth session configuration**:
   ```typescript
   // Check pages/api/auth/[...nextauth].ts or app/api/auth/[...nextauth]/route.ts
   export default NextAuth({
     session: {
       maxAge: 30 * 60, // 30 minutes
     },
     // ... other config
   });
   ```

3. **Check Azure AD token lifetimes**:
   - Ensure Azure AD access token lifetime allows for warnings
   - Verify refresh token configuration

### Prevention
- Include SessionManager in all authenticated layouts
- Test session expiry timing in development
- Monitor Azure AD token lifetime settings

---

## Problem: AuthGuard Shows Loading State Indefinitely

### Symptoms
- Authentication pages show loading spinner forever
- Application never progresses past "Verifying your session..."
- No error messages displayed

### Root Cause
- SessionProvider not properly configured
- NextAuth initialization issues
- Network connectivity problems

### Solution

1. **Verify SessionProvider wrapper**:
   ```typescript
   // Ensure your app is wrapped properly
   <SessionProvider>
     <App />
   </SessionProvider>
   ```

2. **Check NextAuth configuration**:
   ```typescript
   // Verify environment variables
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key
   ```

3. **Debug session state**:
   ```typescript
   import { useSession } from 'next-auth/react';
   
   const { data: session, status } = useSession();
   console.log('Session status:', status);
   console.log('Session data:', session);
   ```

### Prevention
- Test authentication flow in different browsers
- Verify environment variables in all environments
- Include debug logging during development

---

## Problem: Session Extension Not Working

### Symptoms
- "Extend Session" button doesn't refresh session
- Users still get logged out after trying to extend
- Session warnings reappear immediately

### Root Cause
- NextAuth session refresh endpoint not working
- Azure AD refresh token issues
- Network or CORS problems

### Solution

1. **Verify session refresh endpoint**:
   ```bash
   # Test manually
   curl http://localhost:3000/api/auth/session
   ```

2. **Check browser network tab**:
   - Look for failed requests to `/api/auth/session`
   - Check for CORS errors
   - Verify response contains updated session data

3. **Test Azure AD token refresh**:
   - Ensure refresh tokens are properly configured
   - Check Azure AD application permissions

### Prevention
- Test session extension functionality regularly
- Monitor Azure AD token refresh logs
- Include error handling for session extension failures

---

## Problem: Inconsistent Authentication State

### Symptoms
- Authentication state differs between components
- Some parts of app show authenticated, others don't
- Unexpected redirects to sign-in

### Root Cause
- Multiple authentication state sources
- React state not properly synchronized
- Browser storage inconsistencies

### Solution

1. **Use consistent session hook**:
   ```typescript
   // Always use the same hook
   import { useSession } from 'next-auth/react';
   
   const { data: session, status } = useSession();
   ```

2. **Clear browser storage**:
   ```javascript
   // Clear all authentication-related storage
   localStorage.clear();
   sessionStorage.clear();
   // Clear cookies (manually or programmatically)
   ```

3. **Verify auth provider hierarchy**:
   ```typescript
   // Ensure providers are in correct order
   <AuthBypassProvider>
     <SessionProvider>
       <AuthGuard>
         <App />
       </AuthGuard>
     </SessionProvider>
   </AuthBypassProvider>
   ```

### Prevention
- Use single source of truth for authentication state
- Avoid mixing authentication libraries
- Test authentication flow thoroughly

---

## Debug Commands

### Check Current Session State
```typescript
import { getSession } from 'next-auth/react';

// In browser console or component
const session = await getSession();
console.log('Current session:', session);
```

### Force Session Refresh
```typescript
// Manually trigger session refresh
window.location.href = '/api/auth/session';
```

### Clear All Authentication Data
```typescript
// Clear browser storage
localStorage.clear();
sessionStorage.clear();

// Sign out and clear NextAuth data
import { signOut } from 'next-auth/react';
await signOut({ callbackUrl: '/' });
```

### Verify AuthGuard Integration
```typescript
// Check if AuthGuard is protecting your route
console.log('AuthGuard active:', document.querySelector('[data-auth-guard]'));
```

## Related Documentation

- [Frontend Session Management](../04-development/authentication/frontend-session-management.md) - Complete implementation guide
- [Authentication Overview](../04-development/authentication/overview.md) - System architecture
- [Auth Bypass Mode](../04-development/authentication/auth-bypass-mode.md) - Development setup

## Common Environment Issues

### Development vs Production
- Ensure auth configuration works in both environments
- Test with actual Azure AD credentials (not just bypass mode)
- Verify environment variable configuration

### Browser Compatibility
- Test in different browsers (Chrome, Firefox, Safari, Edge)
- Check for browser-specific session storage issues
- Verify cookie settings and HTTPS requirements

### Network Configuration
- Ensure NextAuth callback URLs are accessible
- Check firewall and proxy settings
- Verify CORS configuration for API endpoints