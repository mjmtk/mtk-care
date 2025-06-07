import * as React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { PublicClientApplication, EventType, type EventMessage, type AuthenticationResult, type AccountInfo } from '@azure/msal-browser';
import { msalConfig, loginRequest } from '../auth-config';

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
      await msalInstance.logout();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const getAccessToken = async (): Promise<string | null> => {
    try {
      const account = msalInstance.getActiveAccount();
      if (!account) return null;

      const response = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: account
      });

      return response.accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
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
    </AuthContext.Provider>
  );
};

export default AuthProvider;