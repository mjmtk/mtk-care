import { createContext } from "react";
import { AppAbility } from "./ability";

// Create ability context with default empty ability
export const AbilityContext = createContext<AppAbility | undefined>(undefined);