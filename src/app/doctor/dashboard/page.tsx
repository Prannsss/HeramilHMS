
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
import { useToast } from "@/hooks/use-toast";

const upcomingAppointments = [
  {
    patient: { name: "Liam Johnson", email: "liam@email.com" },
    time: "09:00 AM",
    reason: "Follow-up",
  },
  {
    patient: { name: "Emma Brown", email: "emma@email.com" },
    time: "10:30 AM",
    reason: "Annual Check-up",
  },
  {
    patient: { name: "Noah Williams", email: "noah@email.com" },
    time: "11:15 AM",
    reason: "Consultation",
  },
];

const initialPatients = [
  {
    id: "PAT001",
    name: "Amelia Johnson",
    email: "amelia.j@email.com",
    dob: "1985-04-12",
    lastVisit: "2023-06-15",
    status: "Active",
    bloodType: "A+",
    allergies: "Peanuts",
    dateOfAdmission: "2023-06-12",
    reasonForAdmission: "Routine Check-up",
    dateOfDischarge: null,
    diagnosisNotes: ["Routine check-up, vitals are stable. Discussed diet and exercise."],
  },
  {
    id: "PAT002",
    name: "Benjamin Carter",
    email: "ben.c@email.com",
    dob: "1992-08-25",
    lastVisit: "2023-06-10",
    status: "Active",
    bloodType: "O-",
    allergies: "None",
    dateOfAdmission: "2023-06-08",
    reasonForAdmission: "Fractured Arm",
    dateOfDischarge: null,
    diagnosisNotes: [],
  },
  {
    id: "PAT003",
    name: "Charlotte Davis",
    email: "charlotte.d@email.com",
    dob: "1978-11-02",
    lastVisit: "2023-05-20",
    status: "Discharged",
    bloodType: "B+",
    allergies: "Pollen",
    dateOfAdmission: "2023-05-15",
    reasonForAdmission: "Minor Surgery",
    dateOfDischarge: "2023-05-20",
    diagnosisNotes: [],
  },
  {
    id: "PAT004",
    name: "Daniel Evans",
    email: "daniel.e@email.com",
    dob: "2001-01-30",
    lastVisit: "2023-06-18",
    status: "Active",
    bloodType: "AB+",
    allergies: "Aspirin",
    dateOfAdmission: "2023-06-18",
    reasonForAdmission: "Allergic Reaction",
    dateOfDischarge: null,
    diagnosisNotes: [],
  },
  {
    id: "PAT005",
    name: "Evelyn Foster",
    email: "evelyn.f@email.com",
    dob: "1999-07-19",
    lastVisit: "2023-06-01",
    status: "Active",
    bloodType: "O+",
    allergies: "None",
    dateOfAdmission: "2023-05-28",
    reasonForAdmission: "Migraine Treatment",
    dateOfDischarge: null,
    diagnosisNotes: [],
  },
];

type Patient = typeof initialPatients[0];

const getInitials = (name: string) => {
    const names = name.split(' ');
    const firstName = names[0] ?? '';
    const lastName = names.length > 1 ? names[names.length - 1] : '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export default function DoctorDashboardPage() {
  const [patients, setPatients] = useState(initialPatients.filter(p => p.status === 'Active'));
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(patients[0] || null);
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const { toast } = useToast();

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setDiagnosisNotes(""); // Clear notes when switching patients
  };

  const handleSaveNotes = () => {
    if (!selectedPatient) {
        toast({
            variant: "destructive",
            title: "No Patient Selected",
            description: "Please select a patient before saving notes.",
        });
        return;
    }
    if (!diagnosisNotes.trim()) {
        toast({
            variant: "destructive",
            title: "Empty Note",
            description: "Please enter a diagnosis note before saving.",
        });
        return;
    }

    setPatients(prevPatients =>
        prevPatients.map(p =>
            p.id === selectedPatient.id
                ? { ...p, diagnosisNotes: [...p.diagnosisNotes, diagnosisNotes] }
                : p
        )
    );

    toast({
        title: "Notes Saved",
        description: `Diagnosis notes for ${selectedPatient.name} have been saved.`,
    });
    setDiagnosisNotes(""); // Clear the textarea after saving
  };

  return (
    <DashboardLayout role="doctor">
      <PageHeader
        title="Doctor's Dashboard"
        description="Manage your appointments and patient records."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
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
                        <span className="font-medium">{appt.patient.name}</span>
                      </TableCell>
                      <TableCell>{appt.time}</TableCell>
                      <TableCell>{appt.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
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
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-muted-foreground">{patient.email}</div>
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
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Details for the selected patient.</CardDescription>
            </CardHeader>
            {selectedPatient ? (
                <>
                    <CardContent className="flex-1 flex flex-col space-y-4">
                        <div className="flex justify-center">
                            <Avatar className="h-24 w-24">
                                <AvatarFallback>{getInitials(selectedPatient.name)}</AvatarFallback>
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
                        <div className="space-y-1 flex-1 flex flex-col">
                            <Label htmlFor="notes">Diagnosis Notes</Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Enter diagnosis notes..." 
                                className="flex-1"
                                value={diagnosisNotes}
                                onChange={(e) => setDiagnosisNotes(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                    <Button className="w-full" onClick={handleSaveNotes}>Save Notes</Button>
                    </CardFooter>
                </>
            ) : (
                <CardContent className="flex flex-1 items-center justify-center">
                    <p className="text-muted-foreground text-center">Select a patient to view their details.</p>
                </CardContent>
            )}

          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
