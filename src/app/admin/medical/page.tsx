
'use client';

import { useState, useEffect } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
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

// Updated interfaces for grouped patient records
interface PatientRecord {
  id: string;
  date: string;
  type: string;
  details: string;
  doctor: string;
  file_path?: string;
}

interface MedicalRecord {
  id: string;
  patient: { name: string };
  doctor: string;
  date: string;
  dateOfAdmission: string;
  type: string;
  details: string;
  file_path?: string;
  recordCount: number;
  records: PatientRecord[]; // All individual records for this patient
  bill: {
    invoiceId: string;
    status: string;
    items: Array<{ description: string; amount: string }>;
  };
  bills: Array<{
    invoiceId: string;
    status: string;
    items: Array<{ description: string; amount: string }>;
  }>; // All bills for this patient
  record_id: number;
}

// Fallback data in case API fails - now grouped by patient
const fallbackMedicalRecords: MedicalRecord[] = [
  {
    id: 'PAT001',
    patient: { name: 'Amelia Johnson' },
    doctor: 'Dr. Evelyn Reed',
    date: '2023-06-15',
    dateOfAdmission: '2023-06-12',
    type: 'Prescription, Diagnosis',
    details: 'Combined records: 2 entries',
    recordCount: 2,
    records: [
      {
        id: 'REC001',
        date: '2023-06-15',
        type: 'Prescription', 
        details: 'Lisinopril 10mg for hypertension.',
        doctor: 'Dr. Evelyn Reed'
      },
      {
        id: 'REC002',
        date: '2023-06-14',
        type: 'Diagnosis',
        details: 'Diagnosed with mild hypertension.',
        doctor: 'Dr. Evelyn Reed'
      }
    ],
    bill: {
      invoiceId: 'INV-2023-001',
      status: 'Paid',
      items: [
        { description: 'Consultation Fee', amount: '₱150.00' },
        { description: 'Medication - Lisinopril', amount: '₱25.00' },
      ],
    },
    bills: [{
      invoiceId: 'INV-2023-001',
      status: 'Paid',
      items: [
        { description: 'Consultation Fee', amount: '₱150.00' },
        { description: 'Medication - Lisinopril', amount: '₱25.00' },
      ],
    }],
    record_id: 1,
  },
  {
    id: 'PAT002',
    patient: { name: 'Benjamin Carter' },
    doctor: 'Dr. Kenji Tanaka',
    date: '2023-06-18',
    dateOfAdmission: '2023-06-08',
    type: 'Test Result',
    details: 'Combined records: 1 entries',
    recordCount: 1,
    records: [{
      id: 'REC003',
      date: '2023-06-18',
      type: 'Test Result',
      details: 'Blood Panel: All levels normal.',
      doctor: 'Dr. Kenji Tanaka'
    }],
    bill: {
      invoiceId: 'INV-2023-002',
      status: 'Unpaid',
      items: [{ description: 'Lab Test - Blood Panel', amount: '₱100.75' }],
    },
    bills: [{
      invoiceId: 'INV-2023-002',
      status: 'Unpaid',
      items: [{ description: 'Lab Test - Blood Panel', amount: '₱100.75' }],
    }],
    record_id: 2,
  }
];

function MedicalRecordModal({ record }: { record: MedicalRecord }) {
  // Calculate total from all bills for this patient
  const totalAmount = record.bills.reduce((total, bill) => {
    return total + bill.items.reduce((billTotal, item) => {
      // Handle both $ and ₱ currency symbols
      const amount = item.amount.replace(/[$₱,]/g, '');
      return billTotal + parseFloat(amount);
    }, 0);
  }, 0).toFixed(2);
  
  return (
    <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Patient Medical Records</DialogTitle>
        <DialogDescription>
          Patient ID: {record.id} - {record.recordCount} medical records
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <p className="font-medium text-muted-foreground">Patient</p>
                <p>{record.patient.name}</p>
            </div>
             <div>
                <p className="font-medium text-muted-foreground">Primary Doctor(s)</p>
                <p>{record.doctor}</p>
            </div>
            <div>
                <p className="font-medium text-muted-foreground">Date of Admission</p>
                <p>{record.dateOfAdmission}</p>
            </div>
             <div>
                <p className="font-medium text-muted-foreground">Latest Record Date</p>
                <p>{record.date}</p>
            </div>
             <div>
                <p className="font-medium text-muted-foreground">Record Types</p>
                <p>{record.type}</p>
            </div>
             <div>
                <p className="font-medium text-muted-foreground">Total Records</p>
                <p>{record.recordCount} entries</p>
            </div>
        </div>
        
        {/* Individual Records Section */}
        <div className="border-t pt-4">
            <h4 className="font-semibold mb-4 text-base">All Medical Records</h4>
            <div className="space-y-4">
                {record.records.map((individualRecord, index) => (
                    <div key={`${record.id}-${individualRecord.id}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                                <p className="font-medium text-muted-foreground text-xs">Record ID</p>
                                <p className="font-medium">{individualRecord.id}</p>
                            </div>
                            <div>
                                <p className="font-medium text-muted-foreground text-xs">Date</p>
                                <p>{individualRecord.date}</p>
                            </div>
                            <div>
                                <p className="font-medium text-muted-foreground text-xs">Type</p>
                                <Badge variant="outline">{individualRecord.type}</Badge>
                            </div>
                            <div>
                                <p className="font-medium text-muted-foreground text-xs">Doctor</p>
                                <p>{individualRecord.doctor}</p>
                            </div>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground text-xs">Details</p>
                            <p className="text-sm">{individualRecord.details}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Billing Information */}
        {record.bills.length > 0 && (
            <div className="border-t pt-4">
                <h4 className="font-semibold mb-2 text-base">Billing Information</h4>
                {record.bills.map((bill, index) => (
                    <div key={`${record.id}-${bill.invoiceId}-${index}`} className="mb-4 p-4 border rounded-lg">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                            <div>
                                <p className="font-medium text-muted-foreground">Invoice ID</p>
                                <p>{bill.invoiceId}</p>
                            </div>
                             <div>
                                <p className="font-medium text-muted-foreground">Bill Status</p>
                                <Badge variant={bill.status === 'Paid' ? 'default' : 'destructive'}>
                                    {bill.status}
                                </Badge>
                            </div>
                        </div>
                        {bill.items.length > 0 && (
                            <div className="border-t pt-2">
                                <h5 className="font-semibold mb-2">Invoice Items</h5>
                                {bill.items.map((item, itemIndex) => (
                                    <div key={`${bill.invoiceId}-item-${itemIndex}`} className="flex justify-between">
                                        <span>{item.description}</span>
                                        <span>{item.amount}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                <div className="flex justify-between font-bold text-lg border-t pt-2 mt-4">
                    <span>Total Amount (All Bills)</span>
                    <span>₱{totalAmount}</span>
                </div>
            </div>
        )}
      </div>
      <DialogFooter className="mt-4 h-8">
      </DialogFooter>
    </DialogContent>
  );
}

export default function AdminMedicalPage() {
  const [records, setRecords] = useState<MedicalRecord[]>(fallbackMedicalRecords);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch medical records from API
  const fetchMedicalRecords = async () => {
    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/medical-records.php');
      const result = await response.json();
      
      if (result.status === 'success') {
        setRecords(result.data);
      } else {
        setError(result.message || 'Failed to fetch medical records');
      }
    } catch (err) {
      setError('Error connecting to server - using fallback data');
      console.error('Medical Records API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

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
    // Calculate total from all bills
    const totalAmount = record.bills.reduce((total, bill) => {
      return total + bill.items.reduce((billTotal, item) => {
        const amount = item.amount.replace(/[$₱,]/g, '');
        return billTotal + parseFloat(amount);
      }, 0);
    }, 0).toFixed(2);

    // Create individual records text
    const recordsText = record.records.map((rec, index) => 
      `
${index + 1}. Record ID: ${rec.id}
   Date: ${rec.date}
   Type: ${rec.type}
   Doctor: ${rec.doctor}
   Details: ${rec.details}
`
    ).join('\n');

    // Create bills text
    const billsText = record.bills.map((bill, index) => 
      `
Bill ${index + 1}:
Invoice ID: ${bill.invoiceId}
Status: ${bill.status}
Items:
${bill.items.map(item => `  ${item.description}: ${item.amount}`).join('\n')}
`
    ).join('\n');

    const recordContent = `
                        Heramil Hospital
                   Patient Medical Records Summary

---------------------------------------------------------

Patient ID: ${record.id}
Patient Name: ${record.patient.name}
Date of Admission: ${record.dateOfAdmission}
Primary Doctor(s): ${record.doctor}
Total Medical Records: ${record.recordCount}
Latest Record Date: ${record.date}

---------------------------------------------------------

MEDICAL RECORDS:
${recordsText}

---------------------------------------------------------

BILLING INFORMATION:
${billsText}

Total Amount (All Bills): ₱${totalAmount}

---------------------------------------------------------
Generated on: ${new Date().toLocaleString()}
`;
    const blob = new Blob([recordContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-medical-records-${record.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  return (
    <DashboardLayout role="admin">
          <Card className="mt-8">
        <CardHeader>
          <CardTitle>Patient Medical Records</CardTitle>
          <CardDescription>
            A comprehensive list of all patient medical records, grouped by patient.
            {error && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                <strong>Note:</strong> {error}
              </div>
            )}
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
          {loading ? (
            <div className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient ID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Doctor(s)</TableHead>
                      <TableHead>Latest Date</TableHead>
                      <TableHead>Record Types</TableHead>
                      <TableHead>Record Count</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-[40px] ml-auto" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No medical records found matching your search criteria.
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient ID</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Doctor(s)</TableHead>
                <TableHead>Latest Date</TableHead>
                <TableHead>Record Types</TableHead>
                <TableHead>Record Count</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>
                    <span className="font-medium">{record.patient.name}</span>
                    <div className="text-sm text-muted-foreground">
                      Admitted: {record.dateOfAdmission}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">{record.doctor}</div>
                  </TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {record.type.split(', ').map((type, index) => (
                        <Badge key={`${record.id}-type-${index}`} variant={getBadgeVariant(type)} className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {record.recordCount} records
                    </Badge>
                  </TableCell>
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
                              View All Records
                            </DropdownMenuItem>
                          </DialogTrigger>
                          <DropdownMenuItem onClick={() => handlePrint(record)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Summary
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
          )}
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-{filteredRecords.length}</strong> of <strong>{records.length}</strong> patients
            </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}

    
