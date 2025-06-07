import React, { createContext, useContext, useMemo } from "react";
import "@pnp/sp/webs";
import "@pnp/sp/folders";
import "@pnp/sp/files";

import { useAuth } from "../auth/hooks/auth-context-provider";
import { spfi, SPFI } from "@pnp/sp";
import { SPBrowser } from "@pnp/sp";

// Custom fetch client for PnPjs that uses the foundation axiosInstance
const PnpContext = createContext<SPFI | null>(null);

export const PnpSharePointProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getSharePointAccessToken } = useAuth();
  const isAuthBypassMode = process.env.NEXT_PUBLIC_AUTH_BYPASS_MODE === 'true';

  // Memoize the PnPjs SPFI instance with a fetchBehavior that injects the SharePoint token
  const tokenInjectingBehavior = (instance: any) => {
    // In bypass mode, we don't inject tokens
    if (isAuthBypassMode) return instance;
    
    instance.on.pre(async (url: string, init: RequestInit) => {
      try {
        const token = await getSharePointAccessToken();
        init.headers = {
          ...(init.headers || {}),
          Authorization: `Bearer ${token}`,
          Accept: "application/json;odata=verbose",
        } as HeadersInit;
      } catch (error) {
        console.error("Failed to get SharePoint token:", error);
        // Continue without token in case of error
      }
      return [url, init];
    });
    return instance;
  };

  const sp = useMemo(() => {
    // In bypass mode, we'll mock the SharePoint functionality
    if (isAuthBypassMode) {
      console.log("[PnP] Using SharePoint in auth bypass mode");
      return null;
    }
    
    return spfi("https://manaakitech.sharepoint.com/sites/client_docs")
      .using(SPBrowser())
      .using(tokenInjectingBehavior);
  }, [getSharePointAccessToken, isAuthBypassMode]);

  return (
    <PnpContext.Provider value={sp}>
      {children}
    </PnpContext.Provider>
  );
};

export function usePnP() {
  return useContext(PnpContext);
}
