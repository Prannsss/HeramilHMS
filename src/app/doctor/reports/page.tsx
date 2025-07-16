
import DashboardLayout from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";

export default function DoctorReportsPage() {
  return (
    <DashboardLayout role="doctor">
      
       <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-8">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Page Not Available
          </h3>
          <p className="text-sm text-muted-foreground">
            This page is no longer available.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
