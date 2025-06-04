// frontend/src/components/user-nav.tsx
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { SignOutButton } from "@/components/auth/sign-out-button";

export function UserNav() {
  const { data: session } = useSession();

  if (!session?.user) return null; // Don't render if no session or user

  // Attempt to get initials from name, then email, fallback to 'U'
  let initials = 'U';
  if (session.user.name) {
    const nameParts = session.user.name.split(' ');
    if (nameParts.length > 1) {
      initials = `${nameParts[0][0]}${nameParts[1][0]}`;
    } else {
      initials = nameParts[0].substring(0, 2);
    }
  } else if (session.user.email) {
    initials = session.user.email.substring(0, 2);
  }
  initials = initials.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            {/* Ensure AvatarImage src is string or undefined, not null */}
            <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? "User Avatar"} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {session.user.name ?? "User"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {session.user.email ?? "No email"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled> {/* Placeholder */}
            Profile
            {/* <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut> */}
          </DropdownMenuItem>
          <DropdownMenuItem disabled> {/* Placeholder */}
            Settings
            {/* <DropdownMenuShortcut>⌘S</DropdownMenuShortcut> */}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <SignOutButton 
            variant="ghost" 
            className="w-full justify-start px-2 h-8"
            text="Log out"
          />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
