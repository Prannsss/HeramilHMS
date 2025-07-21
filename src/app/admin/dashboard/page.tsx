"use client";

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
import { useEffect, useState } from "react";

interface Patient {
  name: string;
  email: string;
}

interface Appointment {
  id: number;
  patient: Patient;
  doctor: string;
  date: string;
  time: string;
  status: string;
  reason: string;
}

interface DashboardData {
  total_patients: number;
  appointments_today: number;
  total_doctors: number;
  occupancy_rate: number;
  recent_appointments: Appointment[];
}

// Fallback data in case API fails
const fallbackAppointments = [
  {
    id: 1,
    patient: { name: "Olivia Martin", email: "olivia.martin@email.com" },
    doctor: "Dr. Lee",
    date: "2023-06-23",
    time: "02:00 PM",
    status: "Completed",
    reason: "Regular checkup"
  },
  {
    id: 2,
    patient: { name: "Jackson Lee", email: "jackson.lee@email.com" },
    doctor: "Dr. Davis",
    date: "2023-06-24",
    time: "03:00 PM",
    status: "Scheduled",
    reason: "Follow-up"
  },
  {
    id: 3,
    patient: { name: "Isabella Nguyen", email: "isabella.nguyen@email.com" },
    doctor: "Dr. Wilson",
    date: "2023-06-25",
    time: "11:00 AM",
    status: "Scheduled",
    reason: "Consultation"
  },
  {
    id: 4,
    patient: { name: "William Kim", email: "will@email.com" },
    doctor: "Dr. Miller",
    date: "2023-06-26",
    time: "09:30 AM",
    status: "Canceled",
    reason: "Annual physical"
  },
  {
    id: 5,
    patient: { name: "Sofia Davis", email: "sofia.davis@email.com" },
    doctor: "Dr. Garcia",
    date: "2023-06-27",
    time: "01:00 PM",
    status: "Scheduled",
    reason: "Routine checkup"
  },
];

export default function AdminDashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    total_patients: 1254,
    appointments_today: 82,
    total_doctors: 12,
    occupancy_rate: 78,
    recent_appointments: fallbackAppointments
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost/HeramilHMS/public/backend/api/dashboard.php');
        const result = await response.json();
        
        if (result.status === 'success') {
          // Transform the API data to match our UI expectations
          const transformedAppointments = result.data.recent_appointments.map((apt: any) => ({
            id: apt.id,
            patient: {
              name: apt.patient.name,
              email: apt.patient.email || `${apt.patient.name.toLowerCase().replace(' ', '.')}@email.com`
            },
            doctor: apt.doctor,
            date: apt.date,
            time: apt.time,
            status: apt.status,
            reason: apt.reason
          }));

          setDashboardData({
            total_patients: parseInt(result.data.total_patients),
            appointments_today: parseInt(result.data.appointments_today),
            total_doctors: parseInt(result.data.total_doctors),
            occupancy_rate: parseFloat(result.data.occupancy_rate),
            recent_appointments: transformedAppointments
          });
        } else {
          setError(result.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        setError('Error connecting to server - using fallback data');
        console.error('Dashboard API Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'scheduled':
        return 'secondary';
      case 'cancelled':
      case 'canceled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Admin Dashboard"
        description="Oversee and manage hospital operations."
      />
      
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> {error}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : dashboardData.total_patients.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {error ? "Showing fallback data" : "+20.1% from last month"}
            </p>
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
            <div className="text-2xl font-bold">
              {loading ? "..." : `+${dashboardData.appointments_today}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {error ? "Showing fallback data" : "+15 from yesterday"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctors on Duty</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : dashboardData.total_doctors}
            </div>
            <p className="text-xs text-muted-foreground">
              {error ? "Showing fallback data" : "Active now"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : `${dashboardData.occupancy_rate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {error ? "Showing fallback data" : "+2% since last hour"}
            </p>
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
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-lg">Loading appointments...</div>
              </div>
            ) : dashboardData.recent_appointments.length > 0 ? (
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
                  {dashboardData.recent_appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{appointment.patient.name}</div>
                          <div className="text-sm text-muted-foreground">{appointment.patient.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{appointment.doctor}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{appointment.date}</TableCell>
                      <TableCell className="text-right">{appointment.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent appointments found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
