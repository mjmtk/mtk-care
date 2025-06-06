import { ReactNode } from "react";
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { PublicClientApplication, EventType, InteractionStatus } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "../auth-config";

// Initialize MSAL instance
const msalInstance = new PublicClientApplication(msalConfig);

export const MsalProviderWrapper = ({ children }: { children: ReactNode }) => {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
};

// Expose hooks for MSAL state if needed
export type { AuthenticationResult } from "@azure/msal-browser";
export { useMsal, useIsAuthenticated, InteractionStatus, EventType, loginRequest, msalInstance };
