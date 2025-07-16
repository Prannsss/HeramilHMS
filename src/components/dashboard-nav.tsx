'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

interface DashboardNavProps {
  role: "admin" | "doctor";
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/schedule-adjustment", label: "Schedule AI" },
    { href: "/admin/patients", label: "Patients" },
    { href: "/admin/staff", label: "Staff" },
    { href: "/admin/inventory", label: "Inventory" },
    { href: "/admin/billing", label: "Billing" },
  ];

  const doctorNavItems = [
    { href: "/doctor/dashboard", label: "Dashboard" },
    { href: "/doctor/ai-diagnosis", label: "AI Diagnosis" },
    { href: "/doctor/patients", label: "Patients" },
  ];

  const navItems = role === "admin" ? adminNavItems : doctorNavItems;

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={pathname === item.href}
            className={cn(
              "w-full justify-start",
              pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
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
