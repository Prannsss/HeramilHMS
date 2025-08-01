"use client";

import dynamic from 'next/dynamic';
import DashboardLayout from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, User, Users, Calendar as CalendarIcon } from "lucide-react";

// Dynamically import the dashboard client to prevent hydration issues
const AdminDashboardClient = dynamic(() => import('@/components/admin-dashboard-client'), {
  ssr: false,
  loading: () => (
    <DashboardLayout role="admin">
      <PageHeader
        title="Admin Dashboard"
        description="Oversee and manage hospital operations."
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Patients", icon: Users },
          { title: "Appointments Today", icon: CalendarIcon },
          { title: "Doctors on Duty", icon: User },
          { title: "Occupancy Rate", icon: Activity }
        ].map((item, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              <p className="text-xs text-muted-foreground mt-1">Loading...</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-lg animate-pulse">Loading appointments...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
});

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
