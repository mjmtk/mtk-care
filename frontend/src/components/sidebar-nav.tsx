// frontend/src/components/sidebar-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Users } from "lucide-react";

// Define the structure for navigation items
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/clients", label: "Clients", icon: Users }, // Example, adjust as needed
  // Add more top-level navigation items here
  // Example for a settings page:
  // { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex flex-col space-y-1", className)}
      {...props}
    >
      {navItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <Button
            variant={pathname === item.href ? "secondary" : "ghost"}
            className="w-full justify-start"
            asChild
          >
            <div>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </div>
          </Button>
        </Link>
      ))}
    </nav>
  );
}
