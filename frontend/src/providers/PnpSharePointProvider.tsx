import React, { createContext, useContext } from "react";

// Simplified SharePoint provider - returns null until proper implementation
type SPFI = any; // Placeholder type

// Custom fetch client for PnPjs that uses the foundation axiosInstance
const PnpContext = createContext<SPFI | null>(null);

export const PnpSharePointProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // SharePoint integration placeholder - always returns null until properly implemented
  // TODO: Implement SharePoint authentication (either server-side via Django or client-side via NextAuth)
  const sp = null;

  return (
    <PnpContext.Provider value={sp}>
      {children}
    </PnpContext.Provider>
  );
};

export function usePnP() {
  return useContext(PnpContext);
}
