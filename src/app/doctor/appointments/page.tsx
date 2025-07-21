
'use client';

import { useState, useEffect } from 'react';
import { Check, X, Undo2, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Current logged-in doctor (in real app, this would come from authentication)
const CURRENT_DOCTOR_ID = 1; // Dr. Jayson Ado

type AppointmentStatus = 'Upcoming' | 'Done' | 'Rejected';

type Appointment = {
  id: string;
  patient: {
    name: string;
    email: string;
  };
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  appointment_id?: number;
};

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function AppointmentTable({
  appointments,
  onStatusChange,
  onFinalize,
}: {
  appointments: Appointment[];
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onFinalize: (id: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.length > 0 ? (
          appointments.map((appt) => (
            <TableRow key={appt.id}>
              <TableCell>
                <div className="font-medium">{appt.patient.name}</div>
                <div className="text-sm text-muted-foreground">
                  {appt.patient.email}
                </div>
              </TableCell>
              <TableCell>{appt.date}</TableCell>
              <TableCell>{appt.time}</TableCell>
              <TableCell className="max-w-xs truncate">{appt.reason}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    appt.status === 'Done'
                      ? 'secondary'
                      : appt.status === 'Rejected'
                        ? 'destructive'
                        : 'default'
                  }
                >
                  {appt.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {appt.status === 'Upcoming' ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700"
                      onClick={() => onStatusChange(appt.id, 'Done')}
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Mark as Done</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700"
                      onClick={() => onStatusChange(appt.id, 'Rejected')}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cancel</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onStatusChange(appt.id, 'Upcoming')}
                    >
                      <Undo2 className="h-4 w-4" />
                      <span className="sr-only">Undo</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700"
                      onClick={() => onFinalize(appt.id)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              No appointments found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch appointments on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost/HeramilHMS/public/backend/api/doc-appointments.php?doctor_id=${CURRENT_DOCTOR_ID}`);
      const data = await response.json();
      
      if (data.success === true) {
        setAppointments(data.data);
      } else {
        setError(data.error || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: AppointmentStatus) => {
    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-appointments.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_id: appointmentId,
          status: newStatus
        }),
      });

      const data = await response.json();
      
      if (data.success === true) {
        // Update appointment in local state
        setAppointments(prev => 
          prev.map(appt => 
            appt.id === appointmentId 
              ? { ...appt, status: newStatus }
              : appt
          )
        );
        
        toast({
          title: "Status Updated",
          description: `Appointment status changed to ${newStatus}`,
        });
      } else {
        throw new Error(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating appointment status:', err);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const handleFinalize = async (appointmentId: string) => {
    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-appointments.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_id: appointmentId
        }),
      });

      const data = await response.json();
      
      if (data.success === true) {
        // Remove appointment from local state
        setAppointments(prev => 
          prev.filter(appt => appt.id !== appointmentId)
        );
        
        toast({
          title: "Appointment Removed",
          description: "The appointment has been permanently removed",
        });
      } else {
        throw new Error(data.error || 'Failed to remove appointment');
      }
    } catch (err) {
      console.error('Error removing appointment:', err);
      toast({
        title: "Error",
        description: "Failed to remove appointment",
        variant: "destructive",
      });
    }
  };

  const upcomingAppointments = appointments.filter((a) => a.status === 'Upcoming');
  const doneAppointments = appointments.filter((a) => a.status === 'Done' || a.status === 'Rejected');

  if (loading) {
    return (
      <DashboardLayout role="doctor">
        <LoadingSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="doctor">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error loading appointments
              </h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={fetchAppointments}
                className="mt-3 text-sm font-medium text-red-800 underline hover:text-red-600"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="doctor">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Appointments</CardTitle>
          <CardDescription>
            Manage your upcoming and completed appointments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="done">
                Done ({doneAppointments.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              <AppointmentTable
                appointments={upcomingAppointments}
                onStatusChange={handleStatusChange}
                onFinalize={handleFinalize}
              />
            </TabsContent>
            <TabsContent value="done">
              <AppointmentTable
                appointments={doneAppointments}
                onStatusChange={handleStatusChange}
                onFinalize={handleFinalize}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
