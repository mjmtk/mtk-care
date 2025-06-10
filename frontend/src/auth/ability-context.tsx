import { createContext, ReactNode, useEffect, useState } from "react";
import { AppAbility, createAbilityForUser } from "./ability";
import { useAuthBypassSession } from "@/hooks/useAuthBypass";
import { useRoleSwitcher } from "@/components/providers/role-switcher-provider";

// Create ability context
export const AbilityContext = createContext<AppAbility | undefined>(undefined);

// Ability provider component
export function AbilityProvider({ children }: { children: ReactNode }) {
  const { data: session } = useAuthBypassSession();
  const { currentRoles, isRoleSwitching } = useRoleSwitcher();
  const [ability, setAbility] = useState<AppAbility | undefined>(undefined);

  useEffect(() => {
    // Use role switcher roles if active, otherwise use session roles
    const effectiveRoles = isRoleSwitching ? currentRoles : (session?.user?.roles || []);
    
    const newAbility = createAbilityForUser({
      roles: effectiveRoles,
      id: session?.user?.id ? String(session.user.id) : undefined,
      programIds: (session?.user as any)?.programIds || undefined,
      practiceId: (session?.user as any)?.practiceId || undefined,
    });
    
    setAbility(newAbility);
  }, [session, currentRoles, isRoleSwitching]);

  return (
    <AbilityContext.Provider value={ability}>
      {children}
    </AbilityContext.Provider>
  );
}