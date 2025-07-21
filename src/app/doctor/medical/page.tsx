
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
import { Search } from 'lucide-react';
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

interface MedicalRecord {
  id: string;
  patient: { name: string };
  doctor: string;
  date: string;
  dateOfAdmission: string;
  type: string;
  details: string;
  bill: {
    invoiceId: string;
    status: string;
    items: Array<{ description: string; amount: string }>;
  };
}

function MedicalRecordModal({ record, onClose }: { record: MedicalRecord | null; onClose: () => void }) {
  const [detailedRecord, setDetailedRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (record?.id) {
      fetchRecordDetails(record.id);
    }
  }, [record?.id]);

  const fetchRecordDetails = async (recordId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost/HeramilHMS/public/backend/api/doc-medical.php?action=record_details&record_id=${recordId}`);
      const result = await response.json();
      
      if (result.success) {
        setDetailedRecord(result.data);
      } else {
        console.error('Failed to fetch record details:', result.error);
        setDetailedRecord(record);
      }
    } catch (error) {
      console.error('Error fetching record details:', error);
      setDetailedRecord(record);
    } finally {
      setLoading(false);
    }
  };

  if (!record) return null;

  const displayRecord = detailedRecord || record;
  const totalAmount = displayRecord.bill.items.reduce((total, item) => {
    // Remove ₱ symbol and any comma separators, then parse as float
    const amount = parseFloat(item.amount.replace(/₱|,/g, ''));
    return total + (isNaN(amount) ? 0 : amount);
  }, 0);

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Medical Record Details</DialogTitle>
        <DialogDescription>
          Record ID: {displayRecord.id}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-6 py-4 text-sm">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="text-muted-foreground">Loading record details...</div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-medium text-muted-foreground">Patient</p>
                <p>{displayRecord.patient.name}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Doctor</p>
                <p>{displayRecord.doctor}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Date of Admission</p>
                <p>{displayRecord.dateOfAdmission}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Record Date</p>
                <p>{displayRecord.date}</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Record Type</p>
                <p>{displayRecord.type}</p>
              </div>
              <div className="col-span-2">
                <p className="font-medium text-muted-foreground">Details</p>
                <p>{displayRecord.details}</p>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 text-base">Billing Information</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div>
                  <p className="font-medium text-muted-foreground">Invoice ID</p>
                  <p>{displayRecord.bill.invoiceId}</p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Bill Status</p>
                  <p>{displayRecord.bill.status}</p>
                </div>
              </div>
              {displayRecord.bill.items.length > 0 && (
                <>
                  <div className="border-t pt-2 mt-4">
                    <h5 className="font-semibold mb-2">Invoice Items</h5>
                    {displayRecord.bill.items.map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{item.description}</span>
                        <span>{item.amount}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2 mt-4">
                    <span>Total Amount</span>
                    <span>₱{totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
      <DialogFooter className="mt-4 h-8">
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function DoctorMedicalPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-medical.php?action=records');
      const result = await response.json();
      
      if (result.success) {
        setRecords(result.data);
      } else {
        console.error('Failed to fetch medical records:', result.error);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record =>
    record.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      case 'Follow-up':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  return (
    <DashboardLayout role="doctor">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Patient Records</CardTitle>
          <CardDescription>
            A list of medical records for your assigned patients.
          </CardDescription>
           <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient or type..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="text-muted-foreground">Loading medical records...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Patient</TableHead>
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
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(record.type)}>{record.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{record.details}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewRecord(record)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredRecords.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No medical records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-{filteredRecords.length}</strong> of <strong>{records.length}</strong> records
            </div>
        </CardFooter>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <MedicalRecordModal record={selectedRecord} onClose={handleCloseModal} />
      </Dialog>
    </DashboardLayout>
  );
}
