
'use client';

import { useState } from "react";
import { Eye, PlusCircle, Search, MoreHorizontal, LogOut } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

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

function PatientTable({ patients, onPatientSelect, onDischarge }: { patients: Patient[], onPatientSelect: (patient: Patient) => void, onDischarge: (patientId: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Patient ID</TableHead>
          <TableHead>Date of Birth</TableHead>
          <TableHead>Last Visit</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={patient.avatar} alt={patient.name} data-ai-hint="patient avatar" />
                  <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{patient.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {patient.email}
                  </div>
                </div>
              </div>
            </TableCell>
            <TableCell>{patient.id}</TableCell>
            <TableCell>{patient.dob}</TableCell>
            <TableCell>{patient.lastVisit}</TableCell>
            <TableCell>
              <Badge variant={patient.status === 'Active' ? 'secondary' : 'outline'}>
                  {patient.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onPatientSelect(patient)}>
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    {patient.status === 'Active' && (
                        <DropdownMenuItem onClick={() => onDischarge(patient.id)}>
                            <LogOut className="mr-2 h-4 w-4" /> Discharge Patient
                        </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function PatientInfoModal({ patient, isOpen, onOpenChange }: { patient: Patient | null, isOpen: boolean, onOpenChange: (isOpen: boolean) => void }) {
  if (!patient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Patient Information</DialogTitle>
          <DialogDescription>Details for {patient.name}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={patient.avatar} alt={patient.name} data-ai-hint="patient avatar" />
                    <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="text-xl font-semibold">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                    <p className="text-sm text-muted-foreground">{patient.id}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                    <p className="font-medium text-muted-foreground">Date of Birth</p>
                    <p>{patient.dob}</p>
                </div>
                 <div>
                    <p className="font-medium text-muted-foreground">Blood Type</p>
                    <p>{patient.bloodType}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">Allergies</p>
                    <p>{patient.allergies}</p>
                </div>
                 <div>
                    <p className="font-medium text-muted-foreground">Status</p>
                    <p>{patient.status}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">Date of Admission</p>
                    <p>{patient.dateOfAdmission}</p>
                </div>
                {patient.status === 'Discharged' && patient.dateOfDischarge && (
                    <div>
                        <p className="font-medium text-muted-foreground">Date of Discharge</p>
                        <p>{patient.dateOfDischarge}</p>
                    </div>
                )}
                 <div className="col-span-2">
                    <p className="font-medium text-muted-foreground">Reason for Admission</p>
                    <p>{patient.reasonForAdmission}</p>
                </div>
            </div>
        </div>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState(initialPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  }

  const handleDischarge = (patientId: string) => {
    setPatients(patients.map(p => {
        if (p.id === patientId) {
            return {
                ...p,
                status: 'Discharged',
                dateOfDischarge: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            };
        }
        return p;
    }));
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePatients = filteredPatients.filter(p => p.status === 'Active');
  const dischargedPatients = filteredPatients.filter(p => p.status === 'Discharged');

  return (
    <DashboardLayout role="admin">
      <PageHeader title="Patients" description="Manage patient records." />
      <Card>
        <CardHeader>
          <CardTitle>Patient Records</CardTitle>
          <CardDescription>
            A comprehensive list of all patients.
          </CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name or email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button className="ml-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Patient
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">Active ({activePatients.length})</TabsTrigger>
              <TabsTrigger value="discharged">Discharged ({dischargedPatients.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
              <PatientTable patients={activePatients} onPatientSelect={handlePatientSelect} onDischarge={handleDischarge} />
            </TabsContent>
            <TabsContent value="discharged">
               <PatientTable patients={dischargedPatients} onPatientSelect={handlePatientSelect} onDischarge={handleDischarge} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{filteredPatients.length}</strong> of <strong>{patients.length}</strong> patients
            </div>
        </CardFooter>
      </Card>
      <PatientInfoModal patient={selectedPatient} isOpen={isModalOpen} onOpenChange={setIsModalOpen} />
    </DashboardLayout>
  );
}
