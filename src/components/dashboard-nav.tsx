
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  role: "admin" | "doctor";
  isLogout?: boolean;
}

export function DashboardNav({ role, isLogout = false }: DashboardNavProps) {
  const pathname = usePathname();

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/reports", label: "Report" },
    { href: "/admin/patients", label: "Patients" },
    { href: "/admin/medical", label: "Medical" },
    { href: "/admin/staff", label: "Staff" },
    { href: "/admin/inventory", label: "Inventory" },
    { href: "/admin/billing", label: "Billing" },
  ];

  const doctorNavItems = [
    { href: "/doctor/dashboard", label: "Dashboard" },
    { href: "/doctor/ai-diagnosis", label: "AI Diagnosis" },
    { href: "/doctor/patients", label: "Patients" },
    { href: "/doctor/medical", label: "Medical" },
  ];

  const navItems = role === "admin" ? adminNavItems : doctorNavItems;

  if (isLogout) {
    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    size="lg"
                    className={cn(
                        "w-full justify-start text-lg bg-destructive text-destructive-foreground hover:bg-red-700 hover:text-destructive-foreground"
                    )}
                >
                    <Link href="/">
                        <LogOut className="mr-2 h-5 w-5" />
                        Logout
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            size="lg"
            isActive={pathname.startsWith(item.href) && (item.href !== '/admin/dashboard' && item.href !== '/doctor/dashboard' ? pathname.length > item.href.length : pathname === item.href)}
            className={cn(
              "w-full justify-start text-lg",
              pathname.startsWith(item.href) && (item.href !== '/admin/dashboard' && item.href !== '/doctor/dashboard' ? pathname.length > item.href.length : pathname === item.href) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
              "hover:bg-primary/90 hover:text-primary-foreground"
            )}
          >
            <Link href={item.href}>
              {item.label}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
