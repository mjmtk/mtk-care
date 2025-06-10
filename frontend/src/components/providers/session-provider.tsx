"use client";

import { SessionProvider } from "next-auth/react";
import { AuthBypassProvider, useAuthBypass } from "./auth-bypass-provider";
import { RoleSwitcherProvider } from "./role-switcher-provider";
import { DynamicRoleProvider } from "@/contexts/DynamicRoleProvider";
import { AbilityProvider } from "@/auth/ability-context";

function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthBypassMode, mockSession } = useAuthBypass();
  
  if (isAuthBypassMode) {
    // In bypass mode, provide mock session directly without NextAuth
    return <SessionProvider session={mockSession}>{children}</SessionProvider>;
  }
  
  // Normal mode - let NextAuth handle session
  return <SessionProvider>{children}</SessionProvider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthBypassProvider>
      <SessionProviderWrapper>
        <DynamicRoleProvider>
          <RoleSwitcherProvider>
            <AbilityProvider>
              {children}
            </AbilityProvider>
          </RoleSwitcherProvider>
        </DynamicRoleProvider>
      </SessionProviderWrapper>
    </AuthBypassProvider>
  );
}
