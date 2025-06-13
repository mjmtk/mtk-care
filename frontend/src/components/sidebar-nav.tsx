// frontend/src/components/sidebar-nav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Home, Users, UserCog, FileText, Building, GitBranch, Shield } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";

// Define the structure for navigation items
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  // CASL-based permissions (recommended)
  action?: string;
  subject?: string;
  // Legacy role-based (for migration)
  requiredRoles?: string[];
}

const navItems: NavItem[] = [
  { 
    href: "/dashboard", 
    label: "Overview", 
    icon: Home,
    action: "access",
    subject: "Dashboard"
  },
  { 
    href: "/dashboard/clients", 
    label: "Clients", 
    icon: Users,
    action: "read",
    subject: "Client"
  },
  { 
    href: "/dashboard/referrals", 
    label: "Referrals", 
    icon: GitBranch,
    action: "read",
    subject: "Referral"
  },
  { 
    href: "/dashboard/external-organisations", 
    label: "External Organisations", 
    icon: Building,
    action: "read",
    subject: "ExternalOrg"
  },
  { 
    href: "/users", 
    label: "User Management", 
    icon: UserCog,
    action: "access",
    subject: "UserManagement"
  },
  {
    href: "/dashboard/role-demo",
    label: "Role Demo",
    icon: Shield,
    action: "impersonate",
    subject: "User" // Role switching capability
  },
  // Future analytics navigation items:
  // { 
  //   href: "/dashboard/analytics", 
  //   label: "Analytics", 
  //   icon: BarChart,
  //   action: "view",
  //   subject: "Analytics"
  // },
  // { 
  //   href: "/dashboard/reports", 
  //   label: "Reports", 
  //   icon: FileBarChart,
  //   action: "view",
  //   subject: "Report"
  // },
];

// Helper function to check if user has permission for nav item
function hasNavPermission(
  permissions: ReturnType<typeof usePermissions>, 
  item: NavItem
): boolean {
  // CASL-based permission check (preferred)
  if (item.action && item.subject) {
    return permissions.can(item.action as any, item.subject as any);
  }
  
  // Legacy role-based check (for migration)
  if (item.requiredRoles && item.requiredRoles.length > 0) {
    return item.requiredRoles.some(role => permissions.hasRole(role));
  }
  
  // No permission specified - allow access
  return true;
}

export function SidebarNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  
  // Get user permissions (respects role switcher)
  const permissions = usePermissions();
  
  // Filter nav items based on user permissions
  const visibleNavItems = navItems.filter(item => 
    hasNavPermission(permissions, item)
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
