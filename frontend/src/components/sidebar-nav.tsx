// frontend/src/components/sidebar-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Users, UserCog, FileText, Building, GitBranch, Shield } from "lucide-react";
import { useAuthBypassSession } from "@/hooks/useAuthBypass";
import { useRoles } from "@/hooks/useRoles";

// Define the structure for navigation items
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: string[]; // Optional: specify required roles for this nav item
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/referrals", label: "Referrals", icon: GitBranch },
  { href: "/dashboard/external-organisations", label: "External Organisations", icon: Building },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { 
    href: "/users", 
    label: "User Management", 
    icon: UserCog,
    requiredRoles: ["Administrator", "Superuser"] // Only show to admins
  },
  {
    href: "/dashboard/role-demo",
    label: "Role Demo",
    icon: Shield,
    requiredRoles: ["Administrator", "Superuser"] // Development/testing feature
  },
  // Add more top-level navigation items here
  // Example for a settings page:
  // { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

// Helper function to check if user has required roles
function hasRequiredRole(userRoles: string[] | undefined, requiredRoles: string[] | undefined): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true; // No role requirement
  if (!userRoles || userRoles.length === 0) return false; // User has no roles
  
  return requiredRoles.some(role => userRoles.includes(role));
}

export function SidebarNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  
  // Get user roles (respects role switcher)
  const userRoles = useRoles();
  
  
  // Filter nav items based on user roles
  const visibleNavItems = navItems.filter(item => 
    hasRequiredRole(userRoles, item.requiredRoles)
  );

  return (
    <nav
      className={cn("flex flex-col space-y-1", className)}
      {...props}
    >
      {visibleNavItems.map((item) => (
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
