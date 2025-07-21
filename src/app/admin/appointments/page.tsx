
'use client';

import { useState, useEffect } from 'react';
import { Check, X, Undo2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard-layout';
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

type AppointmentStatus = 'Requests' | 'Verified' | 'Rejected';

type Appointment = {
  id: string;
  patient: {
    name: string;
    email: string;
    mobile: string;
    address: string;
  };
  doctor: string;
  date: string;
  time: string;
  reason: string;
  status: AppointmentStatus;
  db_status?: string;
  appointment_id?: number;
};

// Fallback data in case API fails
const fallbackAppointments: Appointment[] = [
    {
        id: 'APP001',
        patient: { name: 'Liam Johnson', email: 'liam@email.com', mobile: '555-0101', address: "123 Maple St, Springfield, IL" },
        doctor: 'Dr. Evelyn Reed',
        date: '2024-08-15',
        time: '09:00 AM',
        reason: 'Follow-up',
        status: 'Requests',
    },
    {
        id: 'APP002',
        patient: { name: 'Emma Brown', email: 'emma@email.com', mobile: '555-0102', address: "456 Oak Ave, Metropolis, CA" },
        doctor: 'Dr. Kenji Tanaka',
        date: '2024-08-15',
        time: '10:30 AM',
        reason: 'Annual Check-up',
        status: 'Requests',
    },
    {
        id: 'APP003',
        patient: { name: 'Noah Williams', email: 'noah@email.com', mobile: '555-0103', address: "789 Pine Ln, Gotham, NY" },
        doctor: 'Dr. Evelyn Reed',
        date: '2024-08-14',
        time: '11:15 AM',
        reason: 'Consultation',
        status: 'Verified',
    },
    {
        id: 'APP004',
        patient: { name: 'Olivia Jones', email: 'olivia@email.com', mobile: '555-0104', address: "101 Birch Rd, Star City, TX" },
        doctor: 'Dr. Mark O\'Connell',
        date: '2024-08-16',
        time: '02:00 PM',
        reason: 'Pre-op assessment',
        status: 'Requests',
    },
    {
        id: 'APP005',
        patient: { name: 'James Garcia', email: 'james@email.com', mobile: '555-0105', address: "212 Cedar Blvd, Central City, MO" },
        doctor: 'Dr. Kenji Tanaka',
        date: '2024-08-14',
        time: '03:30 PM',
        reason: 'Post-op check',
        status: 'Verified',
    },
    {
        id: 'APP006',
        patient: { name: 'Sophia Miller', email: 'sophia@email.com', mobile: '555-0106', address: "313 Spruce Way, Coast City, FL" },
        doctor: 'Dr. Evelyn Reed',
        date: '2024-08-13',
        time: '01:00 PM',
        reason: 'Vaccination',
        status: 'Rejected',
    },
];

function AppointmentTable({
  appointments,
  onStatusChange,
  onFinalize,
  loading,
}: {
  appointments: Appointment[];
  onStatusChange: (id: string, status: AppointmentStatus) => void;
  onFinalize: (id: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Loading appointments...</div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No appointments found in this category
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Doctor</TableHead>
          <TableHead>Date & Time</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appointments.map((appt) => (
          <TableRow key={appt.id}>
            <TableCell>
              <div className="font-medium">{appt.patient.name}</div>
              <div className="text-sm text-muted-foreground">
                {appt.patient.email}
              </div>
               <div className="text-sm text-muted-foreground">
                {appt.patient.mobile}
              </div>
            </TableCell>
            <TableCell>{appt.doctor}</TableCell>
            <TableCell>
                <div>{appt.date}</div>
                <div className="text-sm text-muted-foreground">{appt.time}</div>
            </TableCell>
            <TableCell className="max-w-xs truncate">{appt.reason}</TableCell>
            <TableCell>
              <Badge
                variant={
                  appt.status === 'Verified'
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
              {appt.status === 'Requests' ? (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700"
                    onClick={() => onStatusChange(appt.id, 'Verified')}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Verify</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-100 hover:text-red-700"
                    onClick={() => onStatusChange(appt.id, 'Rejected')}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Reject</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onStatusChange(appt.id, 'Requests')}
                  >
                    <Undo2 className="h-4 w-4" />
                    <span className="sr-only">Undo</span>
                  </Button>
                   <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:bg-green-100 hover:text-green-700"
                    onClick={() => onFinalize(appt.id)}
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Finalize</span>
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>(fallbackAppointments);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/appointments.php');
      const result = await response.json();
      
      if (result.status === 'success') {
        setAppointments(result.data);
      } else {
        setError(result.message || 'Failed to fetch appointments');
      }
    } catch (err) {
      setError('Error connecting to server - using fallback data');
      console.error('Appointments API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    const appointment = appointments.find(appt => appt.id === id);
    if (!appointment?.appointment_id) {
      // Fallback to local state change if no appointment_id (fallback data)
      setAppointments(
        appointments.map((appt) =>
          appt.id === id ? { ...appt, status } : appt
        )
      );
      return;
    }

    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/appointments.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_id: appointment.appointment_id,
          status: status
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // Update local state
        setAppointments(
          appointments.map((appt) =>
            appt.id === id ? { ...appt, status } : appt
          )
        );
      } else {
        console.error('Failed to update appointment:', result.message);
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      // Fallback to local state change
      setAppointments(
        appointments.map((appt) =>
          appt.id === id ? { ...appt, status } : appt
        )
      );
    }
  };
  
  const handleFinalize = async (id: string) => {
    const appointment = appointments.find(appt => appt.id === id);
    if (!appointment?.appointment_id) {
      // Fallback to local state change if no appointment_id (fallback data)
      setAppointments(appointments.filter((appt) => appt.id !== id));
      return;
    }

    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/appointments.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointment_id: appointment.appointment_id
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // Remove from local state
        setAppointments(appointments.filter((appt) => appt.id !== id));
      } else {
        console.error('Failed to delete appointment:', result.message);
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      // Fallback to local state change
      setAppointments(appointments.filter((appt) => appt.id !== id));
    }
  };

  const requestAppointments = appointments.filter(
    (a) => a.status === 'Requests'
  );
  const verifiedAppointments = appointments.filter(
    (a) => a.status === 'Verified'
  );
  const rejectedAppointments = appointments.filter(
    (a) => a.status === 'Rejected'
  );

  return (
    <DashboardLayout role="admin">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Appointment Management</CardTitle>
          <CardDescription>
            Verify or reject incoming appointment requests.
            {error && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                <strong>Note:</strong> {error}
              </div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests">
            <TabsList>
              <TabsTrigger value="requests">
                Requests ({requestAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="verified">
                Verified ({verifiedAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedAppointments.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="requests">
              <AppointmentTable
                appointments={requestAppointments}
                onStatusChange={handleStatusChange}
                onFinalize={handleFinalize}
                loading={loading}
              />
            </TabsContent>
            <TabsContent value="verified">
              <AppointmentTable
                appointments={verifiedAppointments}
                onStatusChange={handleStatusChange}
                onFinalize={handleFinalize}
                loading={loading}
              />
            </TabsContent>
             <TabsContent value="rejected">
              <AppointmentTable
                appointments={rejectedAppointments}
                onStatusChange={handleStatusChange}
                onFinalize={handleFinalize}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
