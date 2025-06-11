'use client';

import { useRoleSwitcher } from '@/components/providers/role-switcher-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldOff, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RoleSwitcher() {
  const {
    availableRoles,
    currentRoles,
    switchToRole,
    switchToMultipleRoles,
    resetToOriginalRoles,
    isRoleSwitching,
    canSwitchRoles,
  } = useRoleSwitcher();

  if (!canSwitchRoles) {
    return null;
  }

  // Define role colors and icons for better UX
  const getRoleConfig = (role: string) => {
    const roleMap: Record<string, { color: string; icon?: any }> = {
      'Superuser': { color: 'destructive' },
      'Administrator': { color: 'destructive' },
      'Supervisor': { color: 'purple' },
      'Manager': { color: 'blue' },
      'Practitioner': { color: 'green' },
      'Staff': { color: 'default' },
      'ReadOnlyUser': { color: 'secondary' },
      'RestrictedUser': { color: 'outline' },
    };
    return roleMap[role] || { color: 'default' };
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current Role Display */}
      <div className="flex items-center gap-1">
        {currentRoles.map((role) => (
          <Badge 
            key={role} 
            variant={getRoleConfig(role).color as any}
            className="text-xs"
          >
            {role}
          </Badge>
        ))}
      </div>

      {/* Role Switcher Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={isRoleSwitching ? "destructive" : "outline"}
            size="sm"
            className="h-8"
          >
            {isRoleSwitching ? (
              <>
                <ShieldOff className="mr-2 h-3 w-3" />
                {currentRoles.length === 1 ? currentRoles[0] : `${currentRoles.length} roles`}
              </>
            ) : (
              <>
                <Shield className="mr-2 h-3 w-3" />
                {currentRoles.length === 1 ? currentRoles[0] : `${currentRoles.length} roles`}
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Test Role Views
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Quick Role Switches */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Single Role Testing
          </DropdownMenuLabel>
          {availableRoles.map((role) => (
            <DropdownMenuItem
              key={role}
              onClick={() => switchToRole(role)}
              className={cn(
                "cursor-pointer",
                currentRoles.length === 1 && currentRoles[0] === role && "bg-accent"
              )}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              {role}
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator />
          
          {/* Common Role Combinations */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Common Combinations
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => switchToMultipleRoles(['Supervisor', 'Practitioner'])}
            className="cursor-pointer"
          >
            Supervisor + Practitioner
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => switchToMultipleRoles(['Manager', 'Staff'])}
            className="cursor-pointer"
          >
            Manager + Staff
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {/* Reset Option */}
          {isRoleSwitching && (
            <DropdownMenuItem
              onClick={resetToOriginalRoles}
              className="cursor-pointer text-destructive"
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Reset to Original Roles
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Visual Indicator */}
      {isRoleSwitching && (
        <Badge variant="destructive" className="text-xs animate-pulse">
          TESTING MODE
        </Badge>
      )}
    </div>
  );
}