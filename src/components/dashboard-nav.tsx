'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  CalendarClock,
  User,
  Warehouse,
  BrainCircuit,
  Users
} from "lucide-react";
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
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/reports", label: "Reports", icon: FileText },
    { href: "/admin/schedule-adjustment", label: "Schedule AI", icon: CalendarClock },
    { href: "/admin/patients", label: "Patients", icon: User },
    { href: "/admin/staff", label: "Staff", icon: Users },
    { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  ];

  const doctorNavItems = [
    { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/doctor/ai-diagnosis", label: "AI Diagnosis", icon: BrainCircuit },
    { href: "/doctor/patients", label: "Patients", icon: User },
  ];

  const navItems = role === "admin" ? adminNavItems : doctorNavItems;

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} passHref legacyBehavior>
             <SidebarMenuButton
              as="a"
              isActive={pathname === item.href}
              className={cn(
                "w-full justify-start",
                pathname === item.href && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                "hover:bg-primary/90 hover:text-primary-foreground"
              )}
            >
              {item.label}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
