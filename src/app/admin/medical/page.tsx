
'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Search, Eye, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const medicalRecords = [
  {
    id: 'REC001',
    patient: { name: 'Amelia Johnson' },
    doctor: 'Dr. Evelyn Reed',
    date: '2023-06-15',
    dateOfAdmission: '2023-06-12',
    type: 'Prescription',
    details: 'Lisinopril 10mg for hypertension.',
    bill: {
        invoiceId: 'INV-2023-001',
        status: 'Paid',
        items: [
            { description: 'Consultation Fee', amount: '$150.00' },
            { description: 'Medication - Lisinopril', amount: '$25.00' },
        ],
    },
  },
  {
    id: 'REC002',
    patient: { name: 'Benjamin Carter' },
    doctor: 'Dr. Kenji Tanaka',
    date: '2023-06-18',
    dateOfAdmission: '2023-06-08',
    type: 'Test Result',
    details: 'Blood Panel: All levels normal.',
    bill: {
        invoiceId: 'INV-2023-002',
        status: 'Unpaid',
        items: [{ description: 'Lab Test - Blood Panel', amount: '$100.75' }],
    },
  },
  {
    id: 'REC003',
    patient: { name: 'Charlotte Davis' },
    doctor: 'Dr. Mark O\'Connell',
    date: '2023-06-20',
    dateOfAdmission: '2023-05-15',
    type: 'Diagnosis',
    details: 'Diagnosed with seasonal allergies.',
     bill: {
        invoiceId: 'INV-2023-003',
        status: 'Paid',
        items: [{ description: 'Consultation', amount: '$100.00' }],
    },
  },
  {
    id: 'REC004',
    patient: { name: 'Daniel Evans' },
    doctor: 'Dr. Evelyn Reed',
    date: '2023-06-22',
    dateOfAdmission: '2023-06-18',
    type: 'Prescription',
    details: 'Amoxicillin 500mg for infection.',
     bill: {
        invoiceId: 'INV-2023-004',
        status: 'Pending',
        items: [
            { description: 'Follow-up Visit', amount: '$50.00' },
            { description: 'Medication - Amoxicillin', amount: '$25.50' },
        ],
    },
  },
  {
    id: 'REC005',
    patient: { name: 'Evelyn Foster' },
    doctor: 'Dr. Kenji Tanaka',
    date: '2023-06-25',
    dateOfAdmission: '2023-05-28',
    type: 'Test Result',
    details: 'X-Ray: No fractures detected.',
     bill: {
        invoiceId: 'INV-2023-005',
        status: 'Unpaid',
        items: [{ description: 'X-Ray', amount: '$180.00' }],
    },
  },
];

type MedicalRecord = typeof medicalRecords[0];

function MedicalRecordModal({ record }: { record: MedicalRecord }) {
  const totalAmount = record.bill.items.reduce((total, item) => total + parseFloat(item.amount.replace('$', '')), 0).toFixed(2);
  
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Medical Record Details</DialogTitle>
        <DialogDescription>
          Record ID: {record.id}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <p className="font-medium text-muted-foreground">Patient</p>
                <p>{record.patient.name}</p>
            </div>
             <div>
                <p className="font-medium text-muted-foreground">Doctor</p>
                <p>{record.doctor}</p>
            </div>
            <div>
                <p className="font-medium text-muted-foreground">Date of Admission</p>
                <p>{record.dateOfAdmission}</p>
            </div>
             <div>
                <p className="font-medium text-muted-foreground">Record Date</p>
                <p>{record.date}</p>
            </div>
             <div>
                <p className="font-medium text-muted-foreground">Record Type</p>
                <p>{record.type}</p>
            </div>
             <div className="col-span-2">
                <p className="font-medium text-muted-foreground">Details</p>
                <p>{record.details}</p>
            </div>
        </div>
        <div className="border-t pt-4">
            <h4 className="font-semibold mb-2 text-base">Billing Information</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                    <p className="font-medium text-muted-foreground">Invoice ID</p>
                    <p>{record.bill.invoiceId}</p>
                </div>
                 <div>
                    <p className="font-medium text-muted-foreground">Bill Status</p>
                    <p>{record.bill.status}</p>
                </div>
            </div>
            <div className="border-t pt-2 mt-4">
                <h5 className="font-semibold mb-2">Invoice Items</h5>
                {record.bill.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                        <span>{item.description}</span>
                        <span>{item.amount}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-4">
                <span>Total Amount</span>
                <span>${totalAmount}</span>
            </div>
        </div>
      </div>
      <DialogFooter className="mt-4 h-8">
      </DialogFooter>
    </DialogContent>
  );
}


export default function AdminMedicalPage() {
  const [records, setRecords] = useState<MedicalRecord[]>(medicalRecords);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records.filter(record =>
    record.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'Prescription':
        return 'default';
      case 'Test Result':
        return 'secondary';
      case 'Diagnosis':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handlePrint = (record: MedicalRecord) => {
    const recordContent = `
                        Heramil Hospital

---------------------------------------------------------

Record ID: ${record.id}
Patient: ${record.patient.name}
Doctor: ${record.doctor}
Date of Admission: ${record.dateOfAdmission}
Date: ${record.date}
Type: ${record.type}

---------------------------------------------------------

Details:
${record.details}

`;
    const blob = new Blob([recordContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-record-${record.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <DashboardLayout role="admin">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>All Records</CardTitle>
          <CardDescription>
            A comprehensive list of all patient medical records.
          </CardDescription>
           <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient, doctor, or type..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>
                    <span>{record.patient.name}</span>
                  </TableCell>
                  <TableCell>{record.doctor}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(record.type)}>{record.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{record.details}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Record
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DropdownMenuItem onClick={() => handlePrint(record)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <MedicalRecordModal record={record} />
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-{filteredRecords.length}</strong> of <strong>{records.length}</strong> records
            </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}

    
