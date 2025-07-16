
'use client';

import { useState } from "react";
import { Eye, PlusCircle, Search, MoreHorizontal, LogOut } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const initialPatients = [
  {
    id: "PAT001",
    name: "Amelia Johnson",
    email: "amelia.j@email.com",
    dob: "1985-04-12",
    lastVisit: "2023-06-15",
    status: "Active",
    doctor: "Dr. Evelyn Reed",
    bloodType: "A+",
    allergies: "Peanuts",
    dateOfAdmission: "2023-06-12",
    reasonForAdmission: "Routine Check-up",
    dateOfDischarge: null,
    prescriptions: ["Lisinopril 10mg for hypertension."],
    usedItems: [],
    billItems: [
        { description: "Consultation Fee", amount: "$150.00" },
        { description: "Medication - Lisinopril", amount: "$25.00" },
    ],
  },
  {
    id: "PAT002",
    name: "Benjamin Carter",
    email: "ben.c@email.com",
    dob: "1992-08-25",
    lastVisit: "2023-06-10",
    status: "Active",
    doctor: "Dr. Kenji Tanaka",
    bloodType: "O-",
    allergies: "None",
    dateOfAdmission: "2023-06-08",
    reasonForAdmission: "Fractured Arm",
    dateOfDischarge: null,
    prescriptions: [],
    usedItems: [],
    billItems: [{ description: "Lab Test - Blood Panel", amount: "$100.00" }],
  },
  {
    id: "PAT003",
    name: "Charlotte Davis",
    email: "charlotte.d@email.com",
    dob: "1978-11-02",
    lastVisit: "2023-05-20",
    status: "Discharged",
    doctor: "Dr. Evelyn Reed",
    bloodType: "B+",
    allergies: "Pollen",
    dateOfAdmission: "2023-05-15",
    reasonForAdmission: "Minor Surgery",
    dateOfDischarge: "2023-05-20",
    prescriptions: [],
    usedItems: [],
    billItems: [{ description: "Emergency Room Visit", amount: "$200.00" }, {description: "Medication", amount: "$100.00"}],
  },
  {
    id: "PAT004",
    name: "Daniel Evans",
    email: "daniel.e@email.com",
    dob: "2001-01-30",
    lastVisit: "2023-06-18",
    status: "Active",
    doctor: "Dr. Evelyn Reed",
    bloodType: "AB+",
    allergies: "Aspirin",
    dateOfAdmission: "2023-06-18",
    reasonForAdmission: "Allergic Reaction",
    dateOfDischarge: null,
    prescriptions: [],
    usedItems: [],
    billItems: [{ description: "Follow-up Visit", amount: "$75.50" }],
  },
  {
    id: "PAT005",
    name: "Evelyn Foster",
    email: "evelyn.f@email.com",
    dob: "1999-07-19",
    lastVisit: "2023-06-01",
    status: "Active",
    doctor: "Dr. Mark O'Connell",
    bloodType: "O+",
    allergies: "None",
    dateOfAdmission: "2023-05-28",
    reasonForAdmission: "Migraine Treatment",
    dateOfDischarge: null,
    prescriptions: [],
    usedItems: [],
    billItems: [{ description: "Surgical Procedure", amount: "$450.00" }, { description: "Anesthesia", amount: "$50.20" }],
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
          <TableHead>Date of Admission</TableHead>
          <TableHead>Last Visit</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell>
              <div>
                <div className="font-medium">{patient.name}</div>
                <div className="text-sm text-muted-foreground">
                  {patient.email}
                </div>
              </div>
            </TableCell>
            <TableCell>{patient.id}</TableCell>
            <TableCell>{patient.dateOfAdmission}</TableCell>
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

  const totalBill = patient.billItems.reduce((acc, item) => acc + parseFloat(item.amount.replace('$', '')), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Patient Information</DialogTitle>
          <DialogDescription>Details for {patient.name}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="flex items-center gap-4">
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
             {(patient.prescriptions && patient.prescriptions.length > 0) && (
                <div className="space-y-4">
                    <Separator />
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Prescription History</h4>
                        <ul className="mt-2 space-y-2 text-sm list-disc list-inside">
                            {patient.prescriptions.map((p, index) => <li key={index}>{p}</li>)}
                        </ul>
                    </div>
                </div>
            )}
            <div className="space-y-4">
                <Separator />
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Billing Summary</h4>
                     <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Total Bill</span>
                        <span>${totalBill.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
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
      <Card className="mt-8">
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
