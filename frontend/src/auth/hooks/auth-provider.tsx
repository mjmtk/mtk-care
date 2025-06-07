import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { PublicClientApplication, EventType, type EventMessage, type AuthenticationResult, type AccountInfo } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../auth-config';
import { setTokenRefreshFunction } from '@/services/axios-client';
import { tokenManager } from '@/services/token-manager';
import SessionManager, { healthcareSessionConfig } from '@/services/session-manager';
import SessionWarning from '@/components/auth/SessionWarning';
import { useRouter } from 'next/navigation';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: AccountInfo | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  isMsalInitialized: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [msalInstance] = useState<PublicClientApplication>(new PublicClientApplication(msalConfig));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<AccountInfo | null>(null);
  const [isMsalInitialized, setIsMsalInitialized] = useState<boolean>(false);
  const [sessionManager] = useState<SessionManager>(() => new SessionManager(healthcareSessionConfig));
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionWarningMinutes, setSessionWarningMinutes] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await msalInstance.initialize();
        setIsMsalInitialized(true);
        console.log('MSAL initialized successfully in AuthProvider');
        
        // Now that MSAL is initialized, we can safely handle redirects
        try {
          await msalInstance.handleRedirectPromise();
          console.log("Initial redirect handled successfully");
          
          // Set active account if available
          if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
            msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
            console.log("Active account set to", msalInstance.getAllAccounts()[0].name);
          }
        } catch (redirectError) {
          console.error("Error handling initial redirect:", redirectError);
        }

        // Handle redirect response
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          setUser(accounts[0]);
          setIsAuthenticated(true);
        }

        // Event callback for account changes
        const callbackId = msalInstance.addEventCallback((message: EventMessage) => {
          if (message.eventType === EventType.LOGIN_SUCCESS && message.payload) {
            const payload = message.payload as AuthenticationResult;
            const account = payload.account;
            setUser(account);
            setIsAuthenticated(true);
          } else if (message.eventType === EventType.LOGOUT_SUCCESS) {
            setUser(null);
            setIsAuthenticated(false);
          }
        });

        return () => {
          if (callbackId) {
            msalInstance.removeEventCallback(callbackId);
          }
        };
      } catch (error) {
        console.error('Failed to initialize MSAL in AuthProvider:', error);
      }
    };

    initializeAuth();
  }, [msalInstance]);

  // Set up the token refresh function for axios interceptor and token manager
  useEffect(() => {
    setTokenRefreshFunction(getAccessToken);
    tokenManager.setRefreshFunction(getAccessToken);
    
    // Cleanup on unmount
    return () => {
      tokenManager.clear();
      sessionManager.stop();
    };
  }, [sessionManager]);

  // Initialize session management when authenticated
  useEffect(() => {
    if (isAuthenticated && isMsalInitialized) {
      console.log('Starting session management for healthcare compliance');
      
      // Configure session manager callbacks
      const sessionCallbacks = {
        onTokenRefreshSuccess: (newToken: string) => {
          console.log('Automatic token refresh successful');
        },
        onTokenRefreshFailed: () => {
          console.warn('Automatic token refresh failed - user will need to re-authenticate');
        },
        onSessionWarning: (minutesRemaining: number) => {
          console.log(`Session warning: ${minutesRemaining} minutes remaining`);
          setSessionWarningMinutes(minutesRemaining);
          setShowSessionWarning(true);
        },
        onSessionExpired: () => {
          console.log('Session expired - forcing logout');
          handleForceLogout('Session expired');
        },
        onIdleTimeout: () => {
          console.log('Idle timeout reached - forcing logout');
          handleForceLogout('Idle timeout for security');
        },
        onForceLogout: (reason: string) => {
          console.log(`Force logout triggered: ${reason}`);
          handleForceLogout(reason);
        }
      };

      // Create new session manager with callbacks
      const newSessionManager = new SessionManager(healthcareSessionConfig, sessionCallbacks);
      newSessionManager.start(getAccessToken);
      
      return () => {
        newSessionManager.stop();
      };
    }
  }, [isAuthenticated, isMsalInitialized]);

  const login = async () => {
    try {
      await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      sessionManager.stop();
      await msalInstance.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const handleForceLogout = async (reason: string) => {
    console.log(`Handling force logout: ${reason}`);
    setShowSessionWarning(false);
    setIsAuthenticated(false);
    setUser(null);
    sessionManager.stop();
    
    // Redirect to login page
    router.push('/');
    
    // Clear MSAL cache
    try {
      await msalInstance.logout();
    } catch (error) {
      console.error('Error during force logout:', error);
    }
  };

  const handleExtendSession = async () => {
    console.log('User requested session extension');
    try {
      const newToken = await getAccessToken();
      if (newToken) {
        setShowSessionWarning(false);
        console.log('Session extended successfully');
      } else {
        console.warn('Failed to extend session - token refresh returned null');
        await handleForceLogout('Session extension failed');
      }
    } catch (error) {
      console.error('Error extending session:', error);
      await handleForceLogout('Session extension error');
    }
  };

  const handleSessionWarningLogout = async () => {
    console.log('User chose to logout from session warning');
    await handleForceLogout('User initiated logout from session warning');
  };

  const handleSessionExpired = async () => {
    console.log('Session warning countdown expired');
    await handleForceLogout('Session timeout');
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const account = msalInstance.getActiveAccount();
      if (!account) {
        console.warn('No active account found for token acquisition');
        return null;
      }

      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account
      });

      // Store token in token manager for proactive refresh
      if (response.accessToken) {
        tokenManager.setToken(response.accessToken, response.expiresOn ? Math.floor((response.expiresOn.getTime() - Date.now()) / 1000) : undefined);
      }

      return response.accessToken;
    } catch (error: any) {
      console.error('Failed to get access token:', error);
      
      // Handle specific MSAL errors
      if (error.name === 'InteractionRequiredAuthError') {
        console.log('Interaction required - attempting interactive token acquisition');
        try {
          // Attempt interactive token acquisition as fallback
          const response = await msalInstance.acquireTokenRedirect({
            ...loginRequest,
            account: msalInstance.getActiveAccount() || undefined
          });
          // This will cause a redirect, so we won't reach here
          return null;
        } catch (interactiveError) {
          console.error('Interactive token acquisition failed:', interactiveError);
          return null;
        }
      } else if (error.name === 'BrowserAuthError' && error.errorCode === 'no_account_error') {
        console.warn('No account available for token acquisition');
        return null;
      } else if (error.name === 'ServerError' || error.errorCode === 'token_renewal_error') {
        console.error('Server error during token renewal:', error);
        return null;
      }
      
      return null;
    }
  };

  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    getAccessToken,
    isMsalInitialized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionWarning
        isOpen={showSessionWarning}
        minutesRemaining={sessionWarningMinutes}
        onExtendSession={handleExtendSession}
        onLogout={handleSessionWarningLogout}
        onExpired={handleSessionExpired}
      />
    </AuthContext.Provider>
  );
};

export default AuthProvider;