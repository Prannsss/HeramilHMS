
'use client';

import { useState } from "react";
import { Eye, PlusCircle, Search, MoreHorizontal, LogOut, FileText } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mocking a logged-in doctor
const LOGGED_IN_DOCTOR = "Dr. Evelyn Reed";

const initialInventory = [
  { id: "INV001", name: "Surgical Masks", price: 2.50 },
  { id: "INV002", name: "Amoxicillin 500mg", price: 15.00 },
  { id: "INV003", name: "IV Drip Bags", price: 25.00 },
  { id: "INV006", name: "Gauze Pads", price: 5.75 },
  { id: "INV007", name: "Syringes (10ml)", price: 1.25 },
];
type InventoryItem = typeof initialInventory[0];

type BillItem = {
    description: string;
    amount: string;
};

type UsedItem = {
    itemId: string;
    name: string;
    quantity: number;
    price: number;
};

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
    billItems: [{ description: "Consultation Fee", amount: "$150.00" }],
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
    billItems: [{ description: "Consultation Fee", amount: "$150.00" }],
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
    billItems: [{ description: "Consultation Fee", amount: "$150.00" }],
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
    billItems: [{ description: "Consultation Fee", amount: "$150.00" }],
  },
];

type Patient = Omit<typeof initialPatients[0], 'avatar'>;


function PatientTable({ patients, onPatientSelect, onPrescribeSelect }: { patients: Patient[], onPatientSelect: (patient: Patient) => void, onPrescribeSelect: (patient: Patient) => void }) {
  const isAllDischarged = patients.every(p => p.status === 'Discharged');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Patient ID</TableHead>
          <TableHead>Reason for Admission</TableHead>
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
            <TableCell className="max-w-xs truncate">{patient.reasonForAdmission}</TableCell>
            <TableCell>{patient.lastVisit}</TableCell>
            <TableCell>
              <Badge variant={patient.status === 'Active' ? 'secondary' : 'outline'}>
                  {patient.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {isAllDischarged ? (
                 <Button variant="ghost" size="sm" onClick={() => onPatientSelect(patient)}>
                    <Eye className="mr-2 h-4 w-4" /> View
                </Button>
              ) : (
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
                    <DropdownMenuItem onClick={() => onPrescribeSelect(patient)}>
                      <FileText className="mr-2 h-4 w-4" /> Prescribe
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
            {(patient.usedItems && patient.usedItems.length > 0) && (
                <div className="space-y-4">
                    <Separator />
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Used Items</h4>
                        <ul className="mt-2 space-y-2 text-sm">
                            {patient.usedItems.map((item, index) => (
                                <li key={index} className="flex justify-between">
                                    <span>{item.name} (x{item.quantity})</span>
                                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                                </li>
                            ))}
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

function PrescriptionModal({ patient, isOpen, onOpenChange, onSave }: { patient: Patient | null, isOpen: boolean, onOpenChange: (isOpen: boolean) => void, onSave: (patientId: string, prescription: string, usedItems: UsedItem[]) => void }) {
    const [prescription, setPrescription] = useState('');
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

    const handleItemCheck = (itemId: string, checked: boolean) => {
        const newSelectedItems = { ...selectedItems };
        if (checked) {
            newSelectedItems[itemId] = 1;
        } else {
            delete newSelectedItems[itemId];
        }
        setSelectedItems(newSelectedItems);
    };

    const handleQuantityChange = (itemId: string, quantity: number) => {
        setSelectedItems({
            ...selectedItems,
            [itemId]: Math.max(1, quantity),
        });
    };

    const handleSave = () => {
        if (!patient) return;
        const usedItems: UsedItem[] = Object.entries(selectedItems).map(([itemId, quantity]) => {
            const item = initialInventory.find(i => i.id === itemId)!;
            return {
                itemId: item.id,
                name: item.name,
                price: item.price,
                quantity,
            };
        });
        
        onSave(patient.id, prescription, usedItems);
        onOpenChange(false);
        setPrescription('');
        setSelectedItems({});
    };

    const resetState = () => {
        setPrescription('');
        setSelectedItems({});
    };
    
    if (!patient) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) resetState()}}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>New Prescription for {patient.name}</DialogTitle>
                    <DialogDescription>
                        Enter prescription details and log any used inventory items.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div>
                        <Label htmlFor="prescription">Prescription</Label>
                        <Textarea
                            id="prescription"
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                            placeholder="e.g., Amoxicillin 500mg, 1 tablet every 8 hours for 7 days."
                            className="min-h-[100px] mt-2"
                        />
                    </div>
                    <Separator />
                     <div>
                        <Label>Used Inventory Items</Label>
                        <ScrollArea className="h-40 mt-2 rounded-md border p-2">
                           <div className="space-y-2">
                                {initialInventory.map(item => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id={`item-${item.id}`}
                                                checked={!!selectedItems[item.id]}
                                                onCheckedChange={(checked) => handleItemCheck(item.id, !!checked)}
                                            />
                                            <label htmlFor={`item-${item.id}`}>{item.name}</label>
                                        </div>
                                        {selectedItems[item.id] && (
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`qty-${item.id}`} className="text-xs">Qty:</Label>
                                                <Input
                                                    id={`qty-${item.id}`}
                                                    type="number"
                                                    min="1"
                                                    value={selectedItems[item.id]}
                                                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))}
                                                    className="h-7 w-16"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Prescription</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState(initialPatients.filter(p => p.doctor === LOGGED_IN_DOCTOR));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isPrescribeModalOpen, setIsPrescribeModalOpen] = useState(false);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsInfoModalOpen(true);
  }

  const handlePrescribeSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsPrescribeModalOpen(true);
  }

  const handleSavePrescription = (patientId: string, prescription: string, usedItems: UsedItem[]) => {
    setPatients(currentPatients => currentPatients.map(p => {
        if (p.id === patientId) {
            const newBillItems = usedItems.map(item => ({
                description: `Used Item: ${item.name} (x${item.quantity})`,
                amount: `$${(item.quantity * item.price).toFixed(2)}`
            }));

            const updatedPatient = {
                ...p,
                prescriptions: prescription ? [...p.prescriptions, prescription] : p.prescriptions,
                usedItems: [...p.usedItems, ...usedItems],
                billItems: [...p.billItems, ...newBillItems],
            };
            return updatedPatient;
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
    <DashboardLayout role="doctor">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Patients</CardTitle>
          <CardDescription>
            A list of your currently assigned patients.
          </CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search your patients..."
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
              <PatientTable patients={activePatients} onPatientSelect={handlePatientSelect} onPrescribeSelect={handlePrescribeSelect} />
            </TabsContent>
            <TabsContent value="discharged">
               <PatientTable patients={dischargedPatients} onPatientSelect={handlePatientSelect} onPrescribeSelect={handlePrescribeSelect} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{filteredPatients.length}</strong> of <strong>{patients.length}</strong> patients
            </div>
        </CardFooter>
      </Card>
      <PatientInfoModal patient={selectedPatient} isOpen={isInfoModalOpen} onOpenChange={setIsInfoModalOpen} />
      <PrescriptionModal patient={selectedPatient} isOpen={isPrescribeModalOpen} onOpenChange={setIsPrescribeModalOpen} onSave={handleSavePrescription} />
    </DashboardLayout>
  );
}
