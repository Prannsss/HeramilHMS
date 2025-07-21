
'use client';

import { useState, useEffect } from "react";
import { Eye, PlusCircle, Search, MoreHorizontal, LogOut, FileText, Loader2, UserPlus, UserMinus } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

// Types for API response
interface Patient {
  id: string;
  patient_id: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
  dob: string;
  age?: number;
  gender?: string;
  lastVisit: string | null;
  status: string;
  doctor: string;
  bloodType: string;
  allergies: string;
  dateOfAdmission: string;
  reasonForAdmission: string;
  reasonForAppointment?: string;
  dateOfDischarge: string | null;
  floorNumber: string;
  roomNumber: string;
  prescriptions: string[];
  usedItems: UsedItem[];
  billItems: BillItem[];
}

interface InventoryItem {
  id: string;
  item_id: number;
  name: string;
  stock_quantity: number;
  price: number;
}

interface BillItem {
  description: string;
  amount: string;
}

interface UsedItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface MedicalRecord {
  id: number;
  date: string;
  type: string;
  details: string;
  doctor: string;
}

interface BillRecord {
  bill_id: number;
  date: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  status: string;
}

interface Appointment {
  id: number;
  datetime: string;
  reason: string;
  status: string;
  doctor: string;
}

interface PatientDetails {
  patient: Patient;
  prescriptions: MedicalRecord[];
  diagnoses: MedicalRecord[];
  other_records: MedicalRecord[];
  bills: BillRecord[];
  total_amount: number;
  appointments: Appointment[];
}

function PatientTable({ patients, onPatientSelect, onPrescribeSelect, onAdmitSelect, onDischargeSelect }: { 
  patients: Patient[], 
  onPatientSelect: (patient: Patient) => void, 
  onPrescribeSelect: (patient: Patient) => void,
  onAdmitSelect: (patient: Patient) => void,
  onDischargeSelect?: (patient: Patient) => void 
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Patient ID</TableHead>
          <TableHead>Reason</TableHead>
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
                 <div className="text-sm text-muted-foreground">
                  {patient.mobile}
                </div>
              </div>
            </TableCell>
            <TableCell>{patient.id}</TableCell>
            <TableCell className="max-w-xs truncate">
              {patient.status === 'Admitted' ? patient.reasonForAdmission : (patient.reasonForAppointment || patient.reasonForAdmission)}
            </TableCell>
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
                    <>
                      <DropdownMenuItem onClick={() => onPrescribeSelect(patient)}>
                        <FileText className="mr-2 h-4 w-4" /> Prescribe
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onAdmitSelect(patient)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Admit Patient
                      </DropdownMenuItem>
                      {onDischargeSelect && (
                        <DropdownMenuItem onClick={() => onDischargeSelect(patient)}>
                          <UserMinus className="mr-2 h-4 w-4" /> Discharge Patient
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  {patient.status === 'Admitted' && (
                    <>
                      <DropdownMenuItem onClick={() => onPrescribeSelect(patient)}>
                        <FileText className="mr-2 h-4 w-4" /> Prescribe
                      </DropdownMenuItem>
                      {onDischargeSelect && (
                        <DropdownMenuItem onClick={() => onDischargeSelect(patient)}>
                          <UserMinus className="mr-2 h-4 w-4" /> Discharge Patient
                        </DropdownMenuItem>
                      )}
                    </>
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
  const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { toast } = useToast();

  // Fetch detailed patient data when modal opens
  useEffect(() => {
    if (isOpen && patient) {
      setIsLoadingDetails(true);
      fetchPatientDetails(patient.patient_id);
    }
  }, [isOpen, patient]);

  const fetchPatientDetails = async (patientId: number) => {
    try {
      const response = await fetch(`http://localhost/HeramilHMS/public/backend/api/doc-patients.php?action=patient_details&patient_id=${patientId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setPatientDetails(data.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load patient details: ' + data.message,
        });
      }
    } catch (error) {
      console.error('Error fetching patient details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load patient details.',
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!patient) return null;
  
  const displayPatient = patientDetails?.patient || patient;
  const totalBill = patientDetails?.total_amount || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Patient Information</DialogTitle>
          <DialogDescription>Detailed information for {displayPatient.name}</DialogDescription>
        </DialogHeader>
        
        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Loading patient details...</span>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            {/* Basic Information */}
            <div className="flex items-center gap-4">
                <div>
                    <h3 className="text-xl font-semibold">{displayPatient.name}</h3>
                    <p className="text-sm text-muted-foreground">{displayPatient.email}</p>
                    <p className="text-sm text-muted-foreground">{displayPatient.mobile}</p>
                    <p className="text-sm text-muted-foreground">{displayPatient.id}</p>
                </div>
            </div>
            
            {/* Patient Details Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div>
                    <p className="font-medium text-muted-foreground">Date of Birth</p>
                    <p>{displayPatient.dob}</p>
                </div>
                 <div>
                    <p className="font-medium text-muted-foreground">Blood Type</p>
                    <p>{displayPatient.bloodType}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">Allergies</p>
                    <p>{displayPatient.allergies}</p>
                </div>
                 <div>
                    <p className="font-medium text-muted-foreground">Status</p>
                    <p>{displayPatient.status}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">Date of Admission</p>
                    <p>{displayPatient.dateOfAdmission}</p>
                </div>
                {displayPatient.status === 'Discharged' && displayPatient.dateOfDischarge && (
                    <div>
                        <p className="font-medium text-muted-foreground">Date of Discharge</p>
                        <p>{displayPatient.dateOfDischarge}</p>
                    </div>
                )}
                {displayPatient.status === 'Admitted' && (
                    <>
                        <div>
                            <p className="font-medium text-muted-foreground">Floor Number</p>
                            <p>{displayPatient.floorNumber || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="font-medium text-muted-foreground">Room Number</p>
                            <p>{displayPatient.roomNumber || 'N/A'}</p>
                        </div>
                    </>
                )}
                 <div className="col-span-2">
                    <p className="font-medium text-muted-foreground">Address</p>
                    <p>{displayPatient.address}</p>
                </div>
                {displayPatient.status !== 'Admitted' && displayPatient.reasonForAppointment && (
                  <div className="col-span-2">
                    <p className="font-medium text-muted-foreground">Reason for Appointment</p>
                    <p>{displayPatient.reasonForAppointment}</p>
                  </div>
                )}
                {displayPatient.status === 'Admitted' && (
                  <div className="col-span-2">
                    <p className="font-medium text-muted-foreground">Reason for Admission</p>
                    <p>{displayPatient.reasonForAdmission}</p>
                  </div>
                )}
            </div>

            {/* Recent Appointments */}
            {patientDetails?.appointments && patientDetails.appointments.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Appointments</h4>
                  <div className="space-y-2">
                    {patientDetails.appointments.map((appointment) => (
                      <div key={appointment.id} className="flex justify-between items-center text-sm border-l-2 border-blue-200 pl-3">
                        <div>
                          <p className="font-medium">{appointment.reason}</p>
                          <p className="text-muted-foreground">{new Date(appointment.datetime).toLocaleDateString()} - Dr. {appointment.doctor}</p>
                        </div>
                        <Badge variant={appointment.status === 'Completed' ? 'default' : 'secondary'}>
                          {appointment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Diagnoses */}
            {patientDetails?.diagnoses && patientDetails.diagnoses.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Diagnosis History</h4>
                  <div className="space-y-2">
                    {patientDetails.diagnoses.map((diagnosis) => (
                      <div key={diagnosis.id} className="border-l-2 border-green-200 pl-3 text-sm">
                        <p className="font-medium">{diagnosis.details}</p>
                        <p className="text-muted-foreground">{diagnosis.date} - Dr. {diagnosis.doctor}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Prescriptions */}
            {patientDetails?.prescriptions && patientDetails.prescriptions.length > 0 && (
                <div className="space-y-4">
                    <Separator />
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-3">Prescription History</h4>
                        <div className="space-y-2">
                          {patientDetails.prescriptions.map((prescription) => (
                            <div key={prescription.id} className="border-l-2 border-orange-200 pl-3 text-sm">
                              <p className="font-medium">{prescription.details}</p>
                              <p className="text-muted-foreground">{prescription.date} - Dr. {prescription.doctor}</p>
                            </div>
                          ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Billing Summary */}
            <div className="space-y-4">
                <Separator />
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Billing Summary</h4>
                    {patientDetails?.bills && patientDetails.bills.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        {patientDetails.bills.map((bill, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{bill.description} {bill.quantity > 1 && `(x${bill.quantity})`}</span>
                            <span>₱{bill.line_total.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4">No billing records found.</p>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total Bill</span>
                        <span>₱{totalBill.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PrescriptionModal({ patient, inventory, isOpen, onOpenChange, onSave }: { 
  patient: Patient | null, 
  inventory: InventoryItem[], 
  isOpen: boolean, 
  onOpenChange: (isOpen: boolean) => void, 
  onSave: (patientId: string, prescription: string, usedItems: UsedItem[]) => void 
}) {
    const [prescription, setPrescription] = useState('');
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
    const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const { toast } = useToast();

    // Fetch patient details when modal opens
    useEffect(() => {
      if (isOpen && patient) {
        setIsLoadingDetails(true);
        fetchPatientDetails(patient.patient_id);
      }
    }, [isOpen, patient]);

    const fetchPatientDetails = async (patientId: number) => {
      try {
        const response = await fetch(`http://localhost/HeramilHMS/public/backend/api/doc-patients.php?action=patient_details&patient_id=${patientId}`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setPatientDetails(data.data);
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load patient details: ' + data.message,
          });
        }
      } catch (error) {
        console.error('Error fetching patient details:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load patient details.',
        });
      } finally {
        setIsLoadingDetails(false);
      }
    };

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
            const item = inventory.find(i => i.id === itemId)!;
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
        setPatientDetails(null);
    };
    
    if (!patient) return null;

    const displayPatient = patientDetails?.patient || patient;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) resetState()}}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Prescription for {displayPatient.name}</DialogTitle>
                    <DialogDescription>
                        Enter prescription details and log any used inventory items.
                    </DialogDescription>
                </DialogHeader>
                
                {isLoadingDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading patient information...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
                    {/* Patient Summary Column */}
                    <div className="lg:col-span-1 space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-3">Patient Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Age:</span> {displayPatient.age || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Blood Type:</span> {displayPatient.bloodType}
                          </div>
                          <div>
                            <span className="font-medium">Allergies:</span> {displayPatient.allergies}
                          </div>
                          <div>
                            <span className="font-medium">
                              {displayPatient.status === 'Admitted' ? 'Reason for Admission:' : 'Reason for Appointment:'}
                            </span> 
                            {displayPatient.status === 'Admitted' ? displayPatient.reasonForAdmission : (displayPatient.reasonForAppointment || displayPatient.reasonForAdmission)}
                          </div>
                        </div>
                      </div>

                      {/* Recent Diagnoses */}
                      {patientDetails?.diagnoses && patientDetails.diagnoses.length > 0 && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Recent Diagnoses</h4>
                          <div className="space-y-2">
                            {patientDetails.diagnoses.slice(0, 3).map((diagnosis) => (
                              <div key={diagnosis.id} className="text-xs border-l-2 border-green-200 pl-2">
                                <p className="font-medium">{diagnosis.details}</p>
                                <p className="text-muted-foreground">{diagnosis.date}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recent Prescriptions */}
                      {patientDetails?.prescriptions && patientDetails.prescriptions.length > 0 && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">Recent Prescriptions</h4>
                          <div className="space-y-2">
                            {patientDetails.prescriptions.slice(0, 3).map((prescription) => (
                              <div key={prescription.id} className="text-xs border-l-2 border-orange-200 pl-2">
                                <p className="font-medium">{prescription.details}</p>
                                <p className="text-muted-foreground">{prescription.date}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Prescription Form Column */}
                    <div className="lg:col-span-2 space-y-4">
                      <div>
                          <Label htmlFor="prescription">Prescription</Label>
                          <Textarea
                              id="prescription"
                              value={prescription}
                              onChange={(e) => setPrescription(e.target.value)}
                              placeholder="e.g., Amoxicillin 500mg, 1 tablet every 8 hours for 7 days."
                              className="min-h-[120px] mt-2"
                          />
                      </div>
                      
                      <Separator />
                      
                      <div>
                          <Label>Used Inventory Items</Label>
                          <ScrollArea className="h-48 mt-2 rounded-md border p-4">
                             <div className="space-y-3">
                                  {inventory.map(item => (
                                      <div key={item.id} className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                              <Checkbox
                                                  id={`item-${item.id}`}
                                                  checked={!!selectedItems[item.id]}
                                                  onCheckedChange={(checked) => handleItemCheck(item.id, !!checked)}
                                              />
                                              <div>
                                                <label htmlFor={`item-${item.id}`} className="text-sm font-medium">{item.name}</label>
                                                <p className="text-xs text-muted-foreground">Stock: {item.stock_quantity} | Price: ₱{item.price}</p>
                                              </div>
                                          </div>
                                          {selectedItems[item.id] && (
                                              <div className="flex items-center gap-2">
                                                  <Label htmlFor={`qty-${item.id}`} className="text-xs">Qty:</Label>
                                                  <Input
                                                      id={`qty-${item.id}`}
                                                      type="number"
                                                      min="1"
                                                      max={item.stock_quantity}
                                                      value={selectedItems[item.id]}
                                                      onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))}
                                                      className="h-8 w-20"
                                                  />
                                              </div>
                                          )}
                                      </div>
                                  ))}
                              </div>
                          </ScrollArea>
                      </div>
                    </div>
                  </div>
                )}
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isLoadingDetails}>
                      {isLoadingDetails ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Prescription
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function AdmitPatientModal({ patient, isOpen, onOpenChange, onSave }: { 
  patient: Patient | null, 
  isOpen: boolean, 
  onOpenChange: (isOpen: boolean) => void, 
  onSave: (patientId: number, admissionData: any) => void 
}) {
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [allergies, setAllergies] = useState('');
    const [admissionDate, setAdmissionDate] = useState('');
    const [reasonForAdmission, setReasonForAdmission] = useState('');
    const [floorNumber, setFloorNumber] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const { toast } = useToast();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen && patient) {
            // Pre-fill existing data if available
            setDateOfBirth(patient.dob || '');
            setBloodType(patient.bloodType || '');
            setAllergies(patient.allergies || '');
            setAdmissionDate(new Date().toISOString().split('T')[0]);
            setReasonForAdmission(patient.reasonForAdmission || '');
            setFloorNumber(patient.floorNumber || '');
            setRoomNumber(patient.roomNumber || '');
        } else {
            // Reset form
            setDateOfBirth('');
            setBloodType('');
            setAllergies('');
            setAdmissionDate('');
            setReasonForAdmission('');
            setFloorNumber('');
            setRoomNumber('');
        }
    }, [isOpen, patient]);

    const handleSave = () => {
        if (!patient) return;
        
        if (!dateOfBirth || !reasonForAdmission) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Date of birth and reason for admission are required.',
            });
            return;
        }
        
        const admissionData = {
            date_of_birth: dateOfBirth,
            blood_type: bloodType,
            allergies: allergies,
            admission_date: admissionDate, // Send just the date, not datetime
            reason_for_admission: reasonForAdmission,
            floor_number: floorNumber || 'N/A',
            room_number: roomNumber || 'N/A',
        };
        
        onSave(patient.patient_id, admissionData);
        onOpenChange(false);
    };

    if (!patient) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Admit Patient: {patient.name}</DialogTitle>
                    <DialogDescription>
                        Fill in the patient's medical details and admission information.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                        <Input
                            id="dateOfBirth"
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="bloodType">Blood Type</Label>
                        <Input
                            id="bloodType"
                            type="text"
                            value={bloodType}
                            onChange={(e) => setBloodType(e.target.value)}
                            placeholder="e.g., A+, B-, O+, AB-"
                            className="mt-2"
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="allergies">Allergies</Label>
                        <Textarea
                            id="allergies"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            placeholder="List any known allergies."
                            className="mt-2"
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="admissionDate">Admission Date</Label>
                        <Input
                            id="admissionDate"
                            type="date"
                            value={admissionDate}
                            onChange={(e) => setAdmissionDate(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="floorNumber">Floor Number</Label>
                            <Input
                                id="floorNumber"
                                type="text"
                                value={floorNumber}
                                onChange={(e) => setFloorNumber(e.target.value)}
                                placeholder="e.g., 1, 2, 3"
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="roomNumber">Room Number</Label>
                            <Input
                                id="roomNumber"
                                type="text"
                                value={roomNumber}
                                onChange={(e) => setRoomNumber(e.target.value)}
                                placeholder="e.g., 101, 202, 303"
                                className="mt-2"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <Label htmlFor="reasonForAdmission">Reason for Admission *</Label>
                        <Textarea
                            id="reasonForAdmission"
                            value={reasonForAdmission}
                            onChange={(e) => setReasonForAdmission(e.target.value)}
                            placeholder="Describe the reason for admission."
                            className="mt-2"
                        />
                    </div>
                </div>
                
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>
                        Admit Patient
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isPrescribeModalOpen, setIsPrescribeModalOpen] = useState(false);
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch patients from API
  useEffect(() => {
    async function fetchPatients() {
      try {
        const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-patients.php?action=patients&doctor_id=1');
        const data = await response.json();
        
        if (data.status === 'success') {
          setPatients(data.data);
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load patients: ' + data.message,
          });
        }
      } catch (error) {
        console.error('Error fetching patients:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load patients. Please check your connection.',
        });
      } finally {
        setIsLoadingPatients(false);
      }
    }

    fetchPatients();
  }, [toast]);

  // Fetch inventory from API
  useEffect(() => {
    async function fetchInventory() {
      try {
        const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-patients.php?action=inventory');
        const data = await response.json();
        
        if (data.status === 'success') {
          setInventory(data.data);
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load inventory: ' + data.message,
          });
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load inventory. Please check your connection.',
        });
      } finally {
        setIsLoadingInventory(false);
      }
    }

    fetchInventory();
  }, [toast]);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsInfoModalOpen(true);
  }

  const handlePrescribeSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsPrescribeModalOpen(true);
  }

  const handleAdmitSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsAdmitModalOpen(true);
  };

  const handleSaveAdmission = async (patientId: number, admissionData: any) => {
    try {
      const formData = new FormData();
      formData.append('patient_id', patientId.toString());
      formData.append('date_of_birth', admissionData.date_of_birth);
      formData.append('blood_type', admissionData.blood_type);
      formData.append('allergies', admissionData.allergies);
      formData.append('admission_date', admissionData.admission_date);
      formData.append('reason_for_admission', admissionData.reason_for_admission);
      formData.append('floor_number', admissionData.floor_number);
      formData.append('room_number', admissionData.room_number);

      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-admit.php', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it for FormData
      });

      // Debug: Log the response
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response: ' + responseText.substring(0, 200));
      }
      
      if (data.status === 'success') {
        toast({
          title: 'Success',
          description: 'Patient admitted successfully.',
        });
        
        // Refresh patients list
        const patientsResponse = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-patients.php?action=patients&doctor_id=1');
        const patientsData = await patientsResponse.json();
        if (patientsData.status === 'success') {
          setPatients(patientsData.data);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to admit patient: ' + data.message,
        });
      }
    } catch (error) {
      console.error('Error admitting patient:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to admit patient. Please try again.',
      });
    }
  };

  const handleDischargePatient = async (patient: Patient) => {
    try {
      const formData = new FormData();
      formData.append('patient_id', patient.patient_id.toString());

      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-discharge.php', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let browser set it for FormData
      });

      // Debug: Log the response
      console.log('Discharge response status:', response.status);
      
      const responseText = await response.text();
      console.log('Discharge raw response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Discharge JSON parse error:', parseError);
        throw new Error('Invalid JSON response: ' + responseText.substring(0, 200));
      }
      
      if (data.status === 'success') {
        toast({
          title: 'Success',
          description: 'Patient discharged successfully.',
        });
        
        // Refresh patients list
        const patientsResponse = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-patients.php?action=patients&doctor_id=1');
        const patientsData = await patientsResponse.json();
        if (patientsData.status === 'success') {
          setPatients(patientsData.data);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to discharge patient: ' + data.message,
        });
      }
    } catch (error) {
      console.error('Error discharging patient:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to discharge patient. Please try again.',
      });
    }
  };

  const handleSavePrescription = async (patientId: string, prescription: string, usedItems: UsedItem[]) => {
    try {
      const selectedPatient = patients.find(p => p.id === patientId);
      if (!selectedPatient) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Patient not found.',
        });
        return;
      }

      // Prepare used items for API
      const apiUsedItems = usedItems.map(item => ({
        item_id: inventory.find(inv => inv.id === item.itemId)?.item_id || 0,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      }));

      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-patients.php?action=prescription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: selectedPatient.patient_id,
          doctor_id: 1, // TODO: Get from user session/context
          prescription: prescription,
          used_items: apiUsedItems
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        toast({
          title: "Prescription Saved",
          description: `The prescription for ${selectedPatient.name} has been saved successfully.`,
        });
        
        // Update local state
        setPatients(currentPatients => currentPatients.map(p => {
          if (p.id === patientId) {
            const newBillItems = usedItems.map(item => ({
              description: `Used Item: ${item.name} (x${item.quantity})`,
              amount: `₱${(item.quantity * item.price).toFixed(2)}`
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
        
        // Refresh inventory
        const inventoryResponse = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-patients.php?action=inventory');
        const inventoryData = await inventoryResponse.json();
        if (inventoryData.status === 'success') {
          setInventory(inventoryData.data);
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save prescription: ' + data.message,
        });
      }
    } catch (error) {
      console.error('Error saving prescription:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save prescription. Please try again.',
      });
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activePatients = filteredPatients.filter(p => p.status === 'Active');
  const admittedPatients = filteredPatients.filter(p => p.status === 'Admitted');
  const dischargedPatients = filteredPatients.filter(p => p.status === 'Discharged');

  return (
    <DashboardLayout role="doctor">
      {isLoadingPatients ? (
        <div className="flex items-center justify-center min-h-[400px] mt-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading patients...</span>
        </div>
      ) : (
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
                <TabsTrigger value="admitted">Admitted ({admittedPatients.length})</TabsTrigger>
                <TabsTrigger value="discharged">Discharged ({dischargedPatients.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <PatientTable patients={activePatients} onPatientSelect={handlePatientSelect} onPrescribeSelect={handlePrescribeSelect} onAdmitSelect={handleAdmitSelect} onDischargeSelect={handleDischargePatient} />
              </TabsContent>
              <TabsContent value="admitted">
                <PatientTable patients={admittedPatients} onPatientSelect={handlePatientSelect} onPrescribeSelect={handlePrescribeSelect} onAdmitSelect={handleAdmitSelect} onDischargeSelect={handleDischargePatient} />
              </TabsContent>
              <TabsContent value="discharged">
                 <PatientTable patients={dischargedPatients} onPatientSelect={handlePatientSelect} onPrescribeSelect={handlePrescribeSelect} onAdmitSelect={handleAdmitSelect} onDischargeSelect={handleDischargePatient} />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
              <div className="text-xs text-muted-foreground">
                  Showing <strong>{filteredPatients.length}</strong> of <strong>{patients.length}</strong> patients
              </div>
          </CardFooter>
        </Card>
      )}
      <PatientInfoModal patient={selectedPatient} isOpen={isInfoModalOpen} onOpenChange={setIsInfoModalOpen} />
      <PrescriptionModal 
        patient={selectedPatient} 
        inventory={inventory}
        isOpen={isPrescribeModalOpen} 
        onOpenChange={setIsPrescribeModalOpen} 
        onSave={handleSavePrescription} 
      />
      <AdmitPatientModal 
        patient={selectedPatient} 
        isOpen={isAdmitModalOpen} 
        onOpenChange={setIsAdmitModalOpen} 
        onSave={handleSaveAdmission} 
      />
    </DashboardLayout>
  );
}
