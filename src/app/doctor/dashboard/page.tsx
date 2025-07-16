
'use client'

import { useState } from "react";
import { FileDown, PlusCircle, MoreHorizontal } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const upcomingAppointments = [
  {
    patient: { name: "Liam Johnson", email: "liam@email.com", avatar: "https://placehold.co/32x32.png" },
    time: "09:00 AM",
    reason: "Follow-up",
  },
  {
    patient: { name: "Emma Brown", email: "emma@email.com", avatar: "https://placehold.co/32x32.png" },
    time: "10:30 AM",
    reason: "Annual Check-up",
  },
  {
    patient: { name: "Noah Williams", email: "noah@email.com", avatar: "https://placehold.co/32x32.png" },
    time: "11:15 AM",
    reason: "Consultation",
  },
];

const initialPatients = [
  {
    id: "PAT001",
    name: "Amelia Johnson",
    email: "amelia.j@email.com",
    avatar: "https://placehold.co/32x32.png",
    dob: "1985-04-12",
    lastVisit: "2023-06-15",
    status: "Active",
    bloodType: "A+",
    allergies: "Peanuts",
    dateOfAdmission: "2023-06-12",
    reasonForAdmission: "Routine Check-up",
    dateOfDischarge: null,
  },
  {
    id: "PAT002",
    name: "Benjamin Carter",
    email: "ben.c@email.com",
    avatar: "https://placehold.co/32x32.png",
    dob: "1992-08-25",
    lastVisit: "2023-06-10",
    status: "Active",
    bloodType: "O-",
    allergies: "None",
    dateOfAdmission: "2023-06-08",
    reasonForAdmission: "Fractured Arm",
    dateOfDischarge: null,
  },
  {
    id: "PAT003",
    name: "Charlotte Davis",
    email: "charlotte.d@email.com",
    avatar: "https://placehold.co/32x32.png",
    dob: "1978-11-02",
    lastVisit: "2023-05-20",
    status: "Discharged",
    bloodType: "B+",
    allergies: "Pollen",
    dateOfAdmission: "2023-05-15",
    reasonForAdmission: "Minor Surgery",
    dateOfDischarge: "2023-05-20",
  },
  {
    id: "PAT004",
    name: "Daniel Evans",
    email: "daniel.e@email.com",
    avatar: "https://placehold.co/32x32.png",
    dob: "2001-01-30",
    lastVisit: "2023-06-18",
    status: "Active",
    bloodType: "AB+",
    allergies: "Aspirin",
    dateOfAdmission: "2023-06-18",
    reasonForAdmission: "Allergic Reaction",
    dateOfDischarge: null,
  },
  {
    id: "PAT005",
    name: "Evelyn Foster",
    email: "evelyn.f@email.com",
    avatar: "https://placehold.co/32x32.png",
    dob: "1999-07-19",
    lastVisit: "2023-06-01",
    status: "Active",
    bloodType: "O+",
    allergies: "None",
    dateOfAdmission: "2023-05-28",
    reasonForAdmission: "Migraine Treatment",
    dateOfDischarge: null,
  },
];

type Patient = typeof initialPatients[0];

export default function DoctorDashboardPage() {
  const [patients, setPatients] = useState(initialPatients.filter(p => p.status === 'Active'));
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patients[0]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  return (
    <DashboardLayout role="doctor">
      <PageHeader
        title="Doctor's Dashboard"
        description="Manage your appointments and patient records."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                Your scheduled appointments for today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAppointments.map((appt) => (
                    <TableRow key={appt.patient.email}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={appt.patient.avatar} alt={appt.patient.name} data-ai-hint="patient avatar" />
                            <AvatarFallback>{appt.patient.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{appt.patient.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{appt.time}</TableCell>
                      <TableCell>{appt.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Active Patients</CardTitle>
              <CardDescription>
                List of your currently assigned active patients.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Last Visit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id} onClick={() => handlePatientSelect(patient)} className="cursor-pointer">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={patient.avatar} alt={patient.name} data-ai-hint="patient avatar" />
                            <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-sm text-muted-foreground">{patient.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{patient.lastVisit}</TableCell>
                      <TableCell>
                         <Badge variant={patient.status === 'Active' ? 'secondary' : 'outline'}>
                            {patient.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Details for the selected patient.</CardDescription>
            </CardHeader>
            {selectedPatient ? (
                <>
                    <CardContent className="space-y-4">
                        <div className="flex justify-center">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={selectedPatient.avatar} alt={selectedPatient.name} data-ai-hint="patient avatar" />
                                <AvatarFallback>{selectedPatient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={selectedPatient.name} readOnly />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" value={selectedPatient.dob} readOnly />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="gender">Blood Type</Label>
                                <Input id="gender" value={selectedPatient.bloodType} readOnly />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="contact">Contact</Label>
                            <Input id="contact" value={selectedPatient.email} readOnly />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="notes">Diagnosis Notes</Label>
                            <Textarea id="notes" placeholder="Enter diagnosis notes..."></Textarea>
                        </div>
                    </CardContent>
                    <CardFooter>
                    <Button className="w-full">Update Information</Button>
                    </CardFooter>
                </>
            ) : (
                <CardContent>
                    <p className="text-muted-foreground text-center">Select a patient to view their details.</p>
                </CardContent>
            )}

          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
