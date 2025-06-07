// frontend/src/app/clients/layout.tsx
import { SidebarNav } from "@/components/sidebar-nav";
import { UserNav } from "@/components/user-nav";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SessionManager } from "@/components/auth/SessionManager";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ClientsLayoutProps {
  children: React.ReactNode;
}

export default function ClientsLayout({ children }: ClientsLayoutProps) {
  return (
    <AuthGuard>
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
        <header className="flex items-center justify-between h-16 px-4 border-b">
          {/* Mobile Nav Trigger */}
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

          {/* Back Button - visible on both mobile and desktop */}
          <div className="flex items-center gap-2">
            <Link href="/dashboard/clients">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Clients</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>

          <UserNav />
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      
      {/* Session Management */}
      <SessionManager warningThresholdMinutes={5} />
    </div>
    </AuthGuard>
  );
}