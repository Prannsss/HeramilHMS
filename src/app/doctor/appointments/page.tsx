
'use client';

import { useState } from 'react';
import { Check, X, Undo2 } from 'lucide-react';
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
};

const initialAppointments: Appointment[] = [
  {
    id: 'APP001',
    patient: { name: 'Liam Johnson', email: 'liam@email.com' },
    date: '2024-08-15',
    time: '09:00 AM',
    reason: 'Follow-up',
    status: 'Upcoming',
  },
  {
    id: 'APP002',
    patient: { name: 'Emma Brown', email: 'emma@email.com' },
    date: '2024-08-15',
    time: '10:30 AM',
    reason: 'Annual Check-up',
    status: 'Upcoming',
  },
  {
    id: 'APP003',
    patient: { name: 'Noah Williams', email: 'noah@email.com' },
    date: '2024-08-14',
    time: '11:15 AM',
    reason: 'Consultation',
    status: 'Done',
  },
  {
    id: 'APP004',
    patient: { name: 'Olivia Jones', email: 'olivia@email.com' },
    date: '2024-08-16',
    time: '02:00 PM',
    reason: 'Pre-op assessment',
    status: 'Upcoming',
  },
  {
    id: 'APP005',
    patient: { name: 'James Garcia', email: 'james@email.com' },
    date: '2024-08-14',
    time: '03:30 PM',
    reason: 'Post-op check',
    status: 'Done',
  },
  {
    id: 'APP006',
    patient: { name: 'Sophia Miller', email: 'sophia@email.com' },
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
        {appointments.map((appt) => (
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
                    <span className="sr-only">Approve</span>
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
                    onClick={() => onStatusChange(appt.id, 'Upcoming')}
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

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] =
    useState<Appointment[]>(initialAppointments);

  const handleStatusChange = (id: string, status: AppointmentStatus) => {
    setAppointments(
      appointments.map((appt) =>
        appt.id === id ? { ...appt, status } : appt
      )
    );
  };
  
  const handleFinalize = (id: string) => {
    setAppointments(appointments.filter(appt => appt.id !== id));
  }

  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'Upcoming'
  );
  const doneAppointments = appointments.filter(
    (a) => a.status === 'Done' || a.status === 'Rejected'
  );

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
