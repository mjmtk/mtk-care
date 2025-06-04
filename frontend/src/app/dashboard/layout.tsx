// frontend/src/app/dashboard/layout.tsx
import { SidebarNav } from "@/components/sidebar-nav";
import { UserNav } from "@/components/user-nav";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar: Hidden on mobile (md:flex) */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r">
        <div className="p-4 border-b h-16 flex items-center">
          <h1 className="text-xl font-semibold tracking-tight">
            MTK Care
          </h1>
        </div>
        <div className="flex-grow p-4 overflow-y-auto">
          <SidebarNav />
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-4 border-b md:justify-end">
          {/* Mobile Nav Trigger (Placeholder for Subtask 11.4) */}
          <div className="md:hidden">
              <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0">
                {/* Mobile Sidebar Header */}
                <div className="p-4 border-b h-16 flex items-center">
                  <h1 className="text-xl font-semibold tracking-tight">
                    MTK Care
                  </h1>
                </div>
                {/* Mobile Sidebar Navigation */}
                <div className="flex-grow p-4 overflow-y-auto">
                  <SidebarNav />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <UserNav />
        </header>
        
        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
