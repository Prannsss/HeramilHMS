import { type ReactNode } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
} from "@/components/ui/sidebar";
import Logo from "@/components/logo";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserNav } from "@/components/user-nav";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "doctor";
}

export default function DashboardLayout({
  children,
  role,
}: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarRail />
        <div className="flex h-full flex-col p-4">
          <SidebarHeader>
            <Logo />
          </SidebarHeader>
          <SidebarContent className="p-0">
            <DashboardNav role={role} />
          </SidebarContent>
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <SidebarTrigger className="sm:hidden" />
          <div className="ml-auto flex items-center">
            <UserNav />
          </div>
        </header>
        <main className="p-4 sm:px-6 sm:py-0">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
