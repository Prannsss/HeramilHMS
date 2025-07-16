import DashboardLayout from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";

export default function AdminInventoryPage() {
  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Inventory"
        description="Manage hospital inventory."
      />
       <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h3 className="text-2xl font-bold tracking-tight">
            Inventory Management
          </h3>
          <p className="text-sm text-muted-foreground">
            This page is under construction.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
