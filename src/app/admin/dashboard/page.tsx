import {
  Activity,
  User,
  Users,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const appointments = [
  {
    patient: { name: "Olivia Martin", email: "olivia.martin@email.com" },
    doctor: "Dr. Lee",
    date: "2023-06-23",
    time: "02:00 PM",
    status: "Completed",
  },
  {
    patient: { name: "Jackson Lee", email: "jackson.lee@email.com" },
    doctor: "Dr. Davis",
    date: "2023-06-24",
    time: "03:00 PM",
    status: "Scheduled",
  },
  {
    patient: { name: "Isabella Nguyen", email: "isabella.nguyen@email.com" },
    doctor: "Dr. Wilson",
    date: "2023-06-25",
    time: "11:00 AM",
    status: "Scheduled",
  },
  {
    patient: { name: "William Kim", email: "will@email.com" },
    doctor: "Dr. Miller",
    date: "2023-06-26",
    time: "09:30 AM",
    status: "Canceled",
  },
  {
    patient: { name: "Sofia Davis", email: "sofia.davis@email.com" },
    doctor: "Dr. Garcia",
    date: "2023-06-27",
    time: "01:00 PM",
    status: "Scheduled",
  },
];

export default function AdminDashboardPage() {
  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Admin Dashboard"
        description="Oversee and manage hospital operations."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,254</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Appointments Today
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+82</div>
            <p className="text-xs text-muted-foreground">+15 from yesterday</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors on Duty</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Active now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">+2% since last hour</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Appointments</CardTitle>
            <CardDescription>
              A list of the most recent appointments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.patient.email}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{appointment.patient.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{appointment.patient.name}</div>
                          <div className="text-sm text-muted-foreground">{appointment.patient.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{appointment.doctor}</TableCell>
                    <TableCell>
                      <Badge variant={appointment.status === 'Completed' ? 'default' : appointment.status === 'Scheduled' ? 'secondary' : 'destructive'}>
                        {appointment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{appointment.date}</TableCell>
                    <TableCell className="text-right">{appointment.time}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
