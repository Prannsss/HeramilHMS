import { type ReactNode } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Logo from "@/components/logo";
import { DashboardNav } from "@/components/dashboard-nav";
import { UserNav } from "@/components/user-nav";
import { SimpleThemeToggle } from "@/components/theme-toggle";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import Link from "next/link";

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
        <div className="flex h-full flex-col">
          <SidebarHeader className="items-center p-4">
            <Logo />
          </SidebarHeader>
          <SidebarContent className="flex-1 p-4 pt-4">
            <DashboardNav role={role} />
          </SidebarContent>
          <SidebarFooter className="p-4">
             <DashboardNav role={role} isLogout />
          </SidebarFooter>
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 py-1 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-2">
          <SidebarTrigger className="sm:hidden" />
          <div className="ml-auto flex items-center gap-2">
            <SimpleThemeToggle />
            <UserNav />
          </div>
        </header>
        <main className="p-4 sm:px-6 sm:py-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
