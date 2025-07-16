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
    { href: "#", label: "Patients", icon: User },
    { href: "#", label: "Staff", icon: Users },
    { href: "#", label: "Inventory", icon: Warehouse },
  ];

  const doctorNavItems = [
    { href: "/doctor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/doctor/ai-diagnosis", label: "AI Diagnosis", icon: BrainCircuit },
    { href: "#", label: "Patients", icon: User },
  ];

  const navItems = role === "admin" ? adminNavItems : doctorNavItems;

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} legacyBehavior passHref>
            <SidebarMenuButton
              isActive={pathname === item.href}
              className={cn(
                "w-full justify-start",
                pathname === item.href && "bg-primary/10 text-primary"
              )}
              asChild
            >
              <>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
