import React, { createContext, useContext, useState, useEffect } from "react";
import { useMsal, useIsAuthenticated } from "./msal-provider";
import { loginRequest } from "@/auth/auth-config";
// import { UserService } from "../../services/user-service";
// import { AuthService } from "../../services/auth-service";
import { AuthDebugService } from "../../services/auth-debug-service";
import { CurrentUser } from "@/types/user";
import { AppRoles } from "../auth-config";
import { AbilityContext } from "../ability-context";
import { defineRulesForUser, AppAbility } from "../ability";

interface AuthContextProps {
  currentUser: CurrentUser | null;
  groups: { id: number; name: string }[];
  permissions: string[];
  userRoles: AppRoles[];
  impersonatedRole: AppRoles | null;
  ability: AppAbility;
  isLoading: boolean;
  error: Error | null;
  setImpersonatedRole: (role: AppRoles | null) => void;
  refreshCurrentUser: () => Promise<void>;
  isAccessUnavailable: boolean;
  getEffectiveRoles: () => AppRoles[];
  getAccessToken: () => Promise<string>; // For MS Graph or other external APIs
  getMsalIdToken: () => Promise<string>; // For Django session establishment
  getSharePointAccessToken: () => Promise<string>;
  isDjangoSessionEstablished: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthContextProvider");
  return context;
};

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
  const { instance, accounts } = useMsal(); 
  const isAuthenticated = useIsAuthenticated();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userRoles, setUserRoles] = useState<AppRoles[]>([]);
  const [impersonatedRole, setImpersonatedRole] = useState<AppRoles | null>(null);
  const [ability, setAbility] = useState<AppAbility>(defineRulesForUser({ roles: [] }));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAccessUnavailable, setIsAccessUnavailable] = useState<boolean>(false);
  const [isDjangoSessionEstablished, setIsDjangoSessionEstablished] = useState<boolean>(false);

  // Fetch and update current user (now relies on Django session being established)
  const refreshCurrentUser = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // MSAL token acquisition is now handled before this function is called.
      // This function assumes Django session is established.
      // const user = await UserService.getCurrentUser();
      const user = {} as CurrentUser; // Placeholder since this auth provider is not used 
      console.log("[AuthContextProvider] refreshCurrentUser: user fetched", user);
      setCurrentUser(user);
      setGroups(user.groups || []);
      setPermissions(user.permissions || []);
      // Optionally, map Django groups to AppRoles if needed for legacy code:
      const backendRoles = (user.groups || []).map(g => g.name as AppRoles).filter(Boolean);
      setUserRoles(backendRoles);

      // Ensure id is string for ability context
      const userIdStr = user.id !== undefined && user.id !== null ? String(user.id) : undefined;
      setAbility(defineRulesForUser({
        roles: backendRoles,
        id: userIdStr,
        // If you need programIds or practiceId, add here
      }));
    } catch (err) {
      console.error("[AuthContextProvider] refreshCurrentUser error:", err);
      setError(err as Error);
      setCurrentUser(null);
      setGroups([]);
      setPermissions([]);
      setUserRoles([]);
      setIsAccessUnavailable(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Update ability when roles/groups/permissions change
  useEffect(() => {
    setAbility(
      defineRulesForUser({
        roles: userRoles,
        id: currentUser?.id ? String(currentUser.id) : undefined,
        // If you need programIds or practiceId, add them here
      })
    );
  }, [userRoles, impersonatedRole, currentUser]);

  // Fetch user on login/account change
  useEffect(() => {
    const establishSessionAndFetchUser = async () => {
      if (isAuthenticated && accounts[0]) {
        setIsLoading(true);
        setError(null);
        setIsDjangoSessionEstablished(false);
        try {
          const account = accounts[0];
          
          // Log current auth state for debugging
          AuthDebugService.logAuthState();
          
          const msalResponse = await instance.acquireTokenSilent({ ...loginRequest, account });
          if (!msalResponse.idToken) {
            throw new Error('MSAL ID token not found in response.');
          }
          
          console.log('[AuthContextProvider] Acquired MSAL ID Token. Attempting to establish Django session.');
          
          // Use debug service for better error reporting
          const sessionResult = await AuthDebugService.testDjangoSessionEstablishment(msalResponse.idToken);
          
          if (!sessionResult.success) {
            throw new Error(`Django session establishment failed: ${sessionResult.error.data || sessionResult.error.message}`);
          }
          
          console.log('[AuthContextProvider] Django session established successfully.');
          setIsDjangoSessionEstablished(true);
          await refreshCurrentUser(); // Now fetch user details using session
        } catch (sessionError: any) {
          console.error('[AuthContextProvider] Failed to establish Django session or fetch user:', sessionError);
          setError(sessionError);
          setCurrentUser(null);
          setGroups([]);
          setPermissions([]);
          setUserRoles([]);
          setIsDjangoSessionEstablished(false);
          
          // Additional debugging
          console.log('[AuthContextProvider] Full error details:', {
            message: sessionError.message,
            response: sessionError.response,
            stack: sessionError.stack
          });
          
          // Optional: Clear MSAL tokens or trigger re-login if session establishment is critical
          // instance.logoutPopup() or instance.logoutRedirect();
        } finally {
          setIsLoading(false);
        }
      } else {
        setCurrentUser(null);
        setGroups([]);
        setPermissions([]);
        setUserRoles([]);
        setIsDjangoSessionEstablished(false);
      }
    };

    establishSessionAndFetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accounts, instance]); 

  const getEffectiveRoles = () => {
    return impersonatedRole ? [impersonatedRole] : userRoles;
  };

  // Returns a valid MSAL ACCESS token (e.g., for MS Graph API calls)
  const getAccessToken = async (): Promise<string> => {
    const account = accounts[0];
    if (!account) throw new Error("No active account");
    const response = await instance.acquireTokenSilent({ ...loginRequest, account });
    return response.accessToken;
  };

  // Returns a valid MSAL ID token (primarily for Django session establishment)
  const getMsalIdToken = async (): Promise<string> => {
    const account = accounts[0];
    if (!account) throw new Error("No active MSAL account");
    const response = await instance.acquireTokenSilent({ ...loginRequest, account });
    if (!response.idToken) {
      throw new Error('MSAL ID token not found in response after acquiring token.');
    }
    return response.idToken;
  };

  // Returns a valid access token for SharePoint REST API calls ONLY
  const getSharePointAccessToken = async (): Promise<string> => {
    const account = accounts[0];
    if (!account) throw new Error("No active account");
    const response = await instance.acquireTokenSilent({
      scopes: ["https://manaakitech.sharepoint.com/.default"],
      account,
    });
    return response.accessToken;
  };

  const contextValue: AuthContextProps = {
    currentUser,
    groups,
    permissions,
    userRoles,
    impersonatedRole,
    ability,
    isLoading,
    error,
    setImpersonatedRole,
    refreshCurrentUser,
    isAccessUnavailable,
    getEffectiveRoles,
    getAccessToken,
    getMsalIdToken,
    getSharePointAccessToken,
    isDjangoSessionEstablished,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <AbilityContext.Provider value={ability}>
        {children}
      </AbilityContext.Provider>
    </AuthContext.Provider>
  );
};
