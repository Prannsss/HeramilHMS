
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
import { Search, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserStore } from '@/hooks/use-user-store';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface MedicalEntry {
  date: string;
  type: string;
  details: string;
  timestamp: number;
}

interface MedicalRecord {
  id: string;
  patient: { name: string };
  doctor: string;
  date: string;
  dateOfAdmission: string;
  type: string;
  details: string;
  entries?: MedicalEntry[];
  entryCount: number;
  bill: {
    invoiceId: string;
    status: string;
    items: Array<{ description: string; amount: string }>;
  };
}

function MedicalRecordModal({ record, onClose, doctorId }: { record: MedicalRecord | null; onClose: () => void; doctorId: number | null }) {
  const [detailedRecord, setDetailedRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (record?.id && doctorId) {
      fetchRecordDetails(record.id, doctorId);
    }
  }, [record?.id, doctorId]);

  const fetchRecordDetails = async (recordId: string, doctorId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost/HeramilHMS/public/backend/api/doc-medical.php?action=record_details&record_id=${recordId}&doctor_id=${doctorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (result.success) {
        setDetailedRecord(result.data);
      } else {
        console.error('Failed to fetch record details:', result.error);
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to fetch record details",
        });
        setDetailedRecord(record);
      }
    } catch (error) {
      console.error('Error fetching record details:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to server",
      });
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
        <DialogTitle>
          Medical Record Details
          {displayRecord.entryCount > 1 && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Consolidated ({displayRecord.entryCount} entries)
            </Badge>
          )}
        </DialogTitle>
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
                <p className="font-medium text-muted-foreground">Medical Entries ({displayRecord.entryCount || 1})</p>
                {displayRecord.entries && displayRecord.entries.length > 0 ? (
                  <div className="space-y-3 mt-2">
                    {displayRecord.entries.map((entry, index) => (
                      <div key={index} className="border-l-2 border-blue-200 pl-3 py-2 bg-gray-50 rounded-r">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm text-blue-700">{entry.type}</span>
                          <span className="text-xs text-gray-500">{entry.date}</span>
                        </div>
                        <p className="text-sm text-gray-700">{entry.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 p-3 bg-gray-50 rounded border-l-2 border-blue-200">{displayRecord.details}</p>
                )}
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
  const [error, setError] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  
  const { user, isAuthenticated, getDoctorId, hasHydrated } = useUserStore();
  const router = useRouter();
  const { toast } = useToast();

  // Check authentication once the store is hydrated
  useEffect(() => {
    if (!hasHydrated) return; // Wait for store to hydrate
    
    // Check if user is authenticated and is a doctor
    if (!isAuthenticated() || user?.role !== 'Doctor') {
      router.push('/');
      return;
    }

    const doctorId = getDoctorId();
    if (!doctorId) {
      setError('No doctor ID found in authentication');
      setLoading(false);
      return;
    }

    fetchMedicalRecords(doctorId);
    setIsAuthChecked(true);
  }, [hasHydrated, user, isAuthenticated, getDoctorId, router]);

  const fetchMedicalRecords = async (doctorId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost/HeramilHMS/public/backend/api/doc-medical.php?action=records&doctor_id=${doctorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (result.success) {
        setRecords(result.data || []);
      } else {
        setError(result.error || 'Failed to fetch medical records');
        console.error('Failed to fetch medical records:', result.error);
      }
    } catch (error) {
      setError('Failed to connect to server. Please ensure the backend is running.');
      console.error('Error fetching medical records:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search in patient name and main type
    if (record.patient.name.toLowerCase().includes(searchLower) ||
        record.type.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in individual entries for consolidated records
    if (record.entries && record.entries.length > 0) {
      return record.entries.some(entry => 
        entry.type.toLowerCase().includes(searchLower) ||
        entry.details.toLowerCase().includes(searchLower)
      );
    }
    
    // Search in main details for non-consolidated records
    return record.details.toLowerCase().includes(searchLower);
  });
  
  const getBadgeVariant = (type: string) => {
    // Handle multiple types separated by commas
    if (type.includes(',')) {
      return 'default'; // Mixed types - use default
    }
    
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

  const getDisplayType = (record: MedicalRecord) => {
    // If it's a consolidated record with multiple types, show the summary
    if (record.entryCount > 1 && record.type.includes(',')) {
      return record.type; // This will be something like "Diagnosis, Prescription"
    }
    return record.type;
  };

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  if (!hasHydrated || !isAuthChecked || loading) {
    return (
      <DashboardLayout role="doctor">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Patient Records</CardTitle>
            <CardDescription>
              Loading your medical records...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center h-32">
              <div className="text-muted-foreground">Loading medical records...</div>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="doctor">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Patient Records</CardTitle>
            <CardDescription>
              Error loading medical records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => {
                const doctorId = getDoctorId();
                if (doctorId) {
                  fetchMedicalRecords(doctorId);
                }
              }} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="doctor">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Your Patient Records</CardTitle>
          <CardDescription>
            Consolidated medical records for your assigned patients.
          </CardDescription>
           <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient, type, or entry details..."
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
                  <TableHead>Entries</TableHead>
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
                      <Badge variant={getBadgeVariant(record.type)}>{getDisplayType(record)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {record.entryCount || 1} {(record.entryCount || 1) === 1 ? 'entry' : 'entries'}
                      </Badge>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
        <MedicalRecordModal record={selectedRecord} onClose={handleCloseModal} doctorId={getDoctorId()} />
      </Dialog>
    </DashboardLayout>
  );
}
