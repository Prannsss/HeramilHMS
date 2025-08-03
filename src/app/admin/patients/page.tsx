
'use client';

import { useState, useEffect } from "react";
import { Eye, PlusCircle, Search, MoreHorizontal, LogOut, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// Fallback data in case API fails
const fallbackPatients: Patient[] = [
  {
    id: "PAT001",
    name: "Amelia Johnson",
    email: "amelia.j@email.com",
    mobile: "555-0101",
    address: "123 Maple St, Springfield, IL",
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
    mobile: "555-0102",
    address: "456 Oak Ave, Metropolis, CA",
    dob: "1992-08-25",
    lastVisit: "2023-06-10",
    status: "Admitted",
    doctor: "Dr. Kenji Tanaka",
    bloodType: "O-",
    allergies: "None",
    dateOfAdmission: "2023-06-08",
    reasonForAdmission: "Fractured Arm",
    floorNumber: "1",
    roomNumber: "101",
    dateOfDischarge: null,
    prescriptions: [],
    usedItems: [],
    billItems: [{ description: "Lab Test - Blood Panel", amount: "$100.00" }],
  },
  {
    id: "PAT003",
    name: "Charlotte Davis",
    email: "charlotte.d@email.com",
    mobile: "555-0103",
    address: "789 Pine Ln, Gotham, NY",
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
  }
];

interface Patient {
  id: string;
  patient_id?: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
  dob: string;
  lastVisit: string;
  status: 'Active' | 'Admitted' | 'Discharged';
  doctor: string;
  bloodType: string;
  allergies: string;
  dateOfAdmission: string;
  reasonForAdmission: string;
  dateOfDischarge?: string | null;
  floorNumber?: string;
  roomNumber?: string;
  prescriptions: string[];
  usedItems: any[];
  billItems: { description: string; amount: string; }[];
}

interface Doctor {
  id: number;
  name: string;
  role: string;
  email: string;
  department: string;
  status: string;
}

interface AddPatientForm {
  name: string;
  age: string;
  gender: string;
  contact_number: string;
  address: string;
  date_of_birth: string;
  blood_type: string;
  allergies: string;
  floor_number: string;
  room_number: string;
  reason_for_admission: string;
  doctor_id: string;
}

function PatientTable({ patients, onPatientSelect, onDischarge, loading, dischargingPatient }: { 
  patients: Patient[], 
  onPatientSelect: (patient: Patient) => void, 
  onDischarge: (patientId: string) => void,
  loading?: boolean,
  dischargingPatient?: string | null
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Loading patients...</div>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No patients found in this category
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Patient</TableHead>
          <TableHead>Patient ID</TableHead>
          <TableHead>Date of Admission</TableHead>
          <TableHead>Assigned Doctor</TableHead>
          <TableHead>Floor & Room</TableHead>
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
            <TableCell>{patient.dateOfAdmission}</TableCell>
            <TableCell>
              <div className="text-sm">
                {patient.doctor || 'Not assigned'}
              </div>
            </TableCell>
            <TableCell>
              {patient.status === 'Admitted' && patient.floorNumber && patient.roomNumber && 
               patient.floorNumber !== 'N/A' && patient.roomNumber !== 'N/A'
                ? `${patient.floorNumber}F${patient.roomNumber}R`
                : patient.status === 'Admitted' 
                ? 'Awaiting assignment'
                : 'N/A'
              }
            </TableCell>
            <TableCell>
              <Badge variant={
                patient.status === 'Active' ? 'default' : 
                patient.status === 'Admitted' ? 'default' : 
                'destructive'
              } className={
                patient.status === 'Active' ? 'bg-green-600 hover:bg-green-700' : 
                patient.status === 'Admitted' ? 'bg-blue-600 hover:bg-blue-700' : 
                'bg-red-600 hover:bg-red-700'
              }>
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
                    {(patient.status === 'Active' || patient.status === 'Admitted') && (
                        <DropdownMenuItem 
                          onClick={() => onDischarge(patient.id)}
                          disabled={dischargingPatient === patient.id}
                        >
                            <LogOut className="mr-2 h-4 w-4" /> 
                            {dischargingPatient === patient.id ? 'Discharging...' : 'Discharge Patient'}
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

  const totalBill = (patient.billItems || []).reduce((acc, item) => {
    // Handle both $ and ₱ currency symbols
    const amount = item.amount.replace(/[$₱,]/g, '');
    return acc + parseFloat(amount);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Patient Information</DialogTitle>
          <DialogDescription>Details for {patient.name}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div className="flex items-center gap-4">
                <div>
                    <h3 className="text-xl font-semibold">{patient.name}</h3>
                    <p className="text-sm text-muted-foreground">{patient.email}</p>
                    <p className="text-sm text-muted-foreground">{patient.mobile}</p>
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
                    <p className="font-medium text-muted-foreground">Assigned Doctor</p>
                    <p>{patient.doctor || 'Not assigned'}</p>
                </div>
                <div>
                    <p className="font-medium text-muted-foreground">Date of Admission</p>
                    <p>{patient.dateOfAdmission}</p>
                </div>
                {patient.status === 'Admitted' && patient.floorNumber && patient.roomNumber && 
                 patient.floorNumber !== 'N/A' && patient.roomNumber !== 'N/A' && (
                    <div>
                        <p className="font-medium text-muted-foreground">Floor & Room</p>
                        <p>{patient.floorNumber}FR{patient.roomNumber}</p>
                    </div>
                )}
                {patient.status === 'Discharged' && patient.dateOfDischarge && (
                    <div>
                        <p className="font-medium text-muted-foreground">Date of Discharge</p>
                        <p>{patient.dateOfDischarge}</p>
                    </div>
                )}
                 <div className="col-span-2">
                    <p className="font-medium text-muted-foreground">Address</p>
                    <p>{patient.address}</p>
                </div>
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
                    {(patient.billItems && patient.billItems.length > 0) ? (
                      <div className="mt-2 space-y-2">
                        {patient.billItems.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.description}</span>
                            <span>{item.amount}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">No billing items available</p>
                    )}
                     <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Total Bill</span>
                        <span>₱{totalBill.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddPatientModal({ 
  isOpen, 
  onOpenChange, 
  doctors, 
  onSubmit, 
  isSubmitting,
  loadingDoctors 
}: { 
  isOpen: boolean, 
  onOpenChange: (isOpen: boolean) => void,
  doctors: Doctor[],
  onSubmit: (data: AddPatientForm) => void,
  isSubmitting: boolean,
  loadingDoctors: boolean
}) {
  const [formData, setFormData] = useState<AddPatientForm>({
    name: '',
    age: '',
    gender: '',
    contact_number: '',
    address: '',
    date_of_birth: '',
    blood_type: '',
    allergies: '',
    floor_number: '',
    room_number: '',
    reason_for_admission: '',
    doctor_id: ''
  });

  const [errors, setErrors] = useState<Partial<AddPatientForm>>({});
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genders = ['Male', 'Female', 'Other'];
  
  // Only 3 floors available
  const floors = Array.from({length: 3}, (_, i) => i + 1); // Floors 1-3

  // Fetch available rooms for selected floor
  const fetchAvailableRooms = async (floorNumber: string) => {
    if (!floorNumber) {
      setAvailableRooms([]);
      return;
    }

    setLoadingRooms(true);
    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/rooms.php');
      const result = await response.json();
      
      if (result.floors && Array.isArray(result.floors)) {
        // Find the specific floor
        const selectedFloor = result.floors.find((floor: any) => floor.floor == floorNumber);
        
        if (selectedFloor && selectedFloor.rooms) {
          // Extract room numbers for vacant rooms only
          const vacantRoomNumbers = selectedFloor.rooms
            .filter((room: any) => room.status === 'Vacant')
            .map((room: any) => room.room_number);
          setAvailableRooms(vacantRoomNumbers);
        } else {
          setAvailableRooms([]);
        }
      } else {
        console.error('Unexpected API response format:', result);
        setAvailableRooms([]);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setAvailableRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  const validateForm = () => {
    const newErrors: Partial<AddPatientForm> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    // Validate age - either manually entered or calculated from date of birth
    if (!formData.age || parseInt(formData.age) <= 0) {
      newErrors.age = 'Valid age is required';
    }
    
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.contact_number.trim()) newErrors.contact_number = 'Contact number is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.date_of_birth) newErrors.date_of_birth = 'Date of birth is required';
    if (!formData.blood_type) newErrors.blood_type = 'Blood type is required';
    if (!formData.floor_number) newErrors.floor_number = 'Floor is required';
    if (!formData.room_number) newErrors.room_number = 'Room is required';
    if (!formData.reason_for_admission.trim()) newErrors.reason_for_admission = 'Reason for admission is required';
    if (!formData.doctor_id) newErrors.doctor_id = 'Doctor assignment is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    // Calculate the initial age difference in years
    let age = today.getFullYear() - birthDate.getFullYear();
    
    // Get the month and day for more precise comparison
    const todayMonth = today.getMonth();
    const todayDay = today.getDate();
    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();
    
    // Check if the birthday hasn't occurred this year yet
    // If current month is before birth month, or same month but day hasn't reached birth day
    if (todayMonth < birthMonth || (todayMonth === birthMonth && todayDay < birthDay)) {
      age--;
    }
    
    return age.toString();
  };

  const handleInputChange = (field: keyof AddPatientForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If the field is date_of_birth, automatically calculate and set the age
    if (field === 'date_of_birth') {
      const calculatedAge = calculateAge(value);
      setFormData(prev => ({ ...prev, [field]: value, age: calculatedAge }));
    }
    
    // If the field is floor_number, fetch available rooms and clear room selection
    if (field === 'floor_number') {
      setFormData(prev => ({ ...prev, [field]: value, room_number: '' })); // Clear room selection
      fetchAvailableRooms(value);
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      gender: '',
      contact_number: '',
      address: '',
      date_of_birth: '',
      blood_type: '',
      allergies: '',
      floor_number: '',
      room_number: '',
      reason_for_admission: '',
      doctor_id: ''
    });
    setErrors({});
    setAvailableRooms([]);
  };

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Update age when date of birth changes (for initial load scenarios)
  useEffect(() => {
    if (formData.date_of_birth && !formData.age) {
      const calculatedAge = calculateAge(formData.date_of_birth);
      setFormData(prev => ({ ...prev, age: calculatedAge }));
    }
  }, [formData.date_of_birth]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>
            Fill in the patient information below. The patient will be automatically admitted.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter patient's full name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Age and Gender */}
            <div>
              <label className="text-sm font-medium">Age</label>
              <Input
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder={formData.date_of_birth ? "Auto-calculated" : "Enter age"}
                min="1"
                max="150"
                className={errors.age ? 'border-red-500' : ''}
                readOnly={!!formData.date_of_birth}
                disabled={!!formData.date_of_birth}
              />
              {formData.date_of_birth && (
                <p className="text-xs text-muted-foreground mt-1">
                  Calculated from date of birth
                </p>
              )}
              {errors.age && <p className="text-sm text-red-500 mt-1">{errors.age}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Gender</label>
              <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genders.map((gender) => (
                    <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-sm text-red-500 mt-1">{errors.gender}</p>}
            </div>

            {/* Contact and Date of Birth */}
            <div>
              <label className="text-sm font-medium">Contact Number</label>
              <Input
                value={formData.contact_number}
                onChange={(e) => handleInputChange('contact_number', e.target.value)}
                placeholder="+(63)"
                className={errors.contact_number ? 'border-red-500' : ''}
              />
              {errors.contact_number && <p className="text-sm text-red-500 mt-1">{errors.contact_number}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Date of Birth</label>
              <Input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className={errors.date_of_birth ? 'border-red-500' : ''}
              />
              {errors.date_of_birth && <p className="text-sm text-red-500 mt-1">{errors.date_of_birth}</p>}
            </div>

            {/* Blood Type and Allergies */}
            <div>
              <label className="text-sm font-medium">Blood Type</label>
              <Select value={formData.blood_type} onValueChange={(value) => handleInputChange('blood_type', value)}>
                <SelectTrigger className={errors.blood_type ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Blood type" />
                </SelectTrigger>
                <SelectContent>
                  {bloodTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.blood_type && <p className="text-sm text-red-500 mt-1">{errors.blood_type}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Allergies</label>
              <Input
                value={formData.allergies}
                onChange={(e) => handleInputChange('allergies', e.target.value)}
                placeholder="(Optional)"
              />
            </div>

            {/* Address */}
            <div className="col-span-2">
              <label className="text-sm font-medium">Address</label>
              <Textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="123, Luzon, Visayas, Mindanao"
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && <p className="text-sm text-red-500 mt-1">{errors.address}</p>}
            </div>

            {/* Floor and Room */}
            <div>
              <label className="text-sm font-medium">Floor</label>
              <Select value={formData.floor_number} onValueChange={(value) => handleInputChange('floor_number', value)}>
                <SelectTrigger className={errors.floor_number ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {floors.map((floor) => (
                    <SelectItem key={floor} value={floor.toString()}>Floor {floor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.floor_number && <p className="text-sm text-red-500 mt-1">{errors.floor_number}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Room</label>
              <Select 
                value={formData.room_number} 
                onValueChange={(value) => handleInputChange('room_number', value)}
                disabled={!formData.floor_number || loadingRooms}
              >
                <SelectTrigger className={errors.room_number ? 'border-red-500' : ''}>
                  <SelectValue placeholder={
                    !formData.floor_number 
                      ? "Select floor first" 
                      : loadingRooms 
                      ? "Loading rooms..." 
                      : availableRooms.length === 0 
                      ? "No rooms available" 
                      : "Select room"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room} value={room}>Room {room}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.floor_number && availableRooms.length === 0 && !loadingRooms && (
                <p className="text-xs text-muted-foreground mt-1">
                  No vacant rooms available on floor {formData.floor_number}
                </p>
              )}
              {errors.room_number && <p className="text-sm text-red-500 mt-1">{errors.room_number}</p>}
            </div>

            {/* Doctor Assignment */}
            <div className="col-span-2">
              <label className="text-sm font-medium">Assign Doctor</label>
              <Select 
                value={formData.doctor_id} 
                onValueChange={(value) => handleInputChange('doctor_id', value)}
                disabled={loadingDoctors}
              >
                <SelectTrigger className={errors.doctor_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder={
                    loadingDoctors 
                      ? "Loading doctors..." 
                      : doctors.length === 0 
                      ? "No doctors available" 
                      : "Select doctor"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {loadingDoctors ? (
                    <SelectItem value="loading" disabled>Loading doctors...</SelectItem>
                  ) : doctors.length === 0 ? (
                    <SelectItem value="no-doctors" disabled>No doctors available</SelectItem>
                  ) : (
                    doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id.toString()}>
                        {doctor.name} - {doctor.role} ({doctor.department})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!loadingDoctors && doctors.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  No doctors found. Using fallback data. Please check server connection.
                </p>
              )}
              {loadingDoctors && (
                <p className="text-xs text-muted-foreground mt-1">
                  Fetching available doctors...
                </p>
              )}
              {errors.doctor_id && <p className="text-sm text-red-500 mt-1">{errors.doctor_id}</p>}
            </div>

            {/* Reason for Admission */}
            <div className="col-span-2">
              <label className="text-sm font-medium">Reason for Admission</label>
              <Textarea
                value={formData.reason_for_admission}
                onChange={(e) => handleInputChange('reason_for_admission', e.target.value)}
                placeholder=" "
                className={errors.reason_for_admission ? 'border-red-500' : ''}
              />
              {errors.reason_for_admission && <p className="text-sm text-red-500 mt-1">{errors.reason_for_admission}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Patient...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Patient
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(fallbackPatients);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dischargingPatient, setDischargingPatient] = useState<string | null>(null);
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);

  // Fetch patients from API
  const fetchPatients = async () => {
    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/patients.php');
      const result = await response.json();
      
      if (result.status === 'success') {
        setPatients(result.data);
      } else {
        setError(result.message || 'Failed to fetch patients');
      }
    } catch (err) {
      setError('Error connecting to server - using fallback data');
      console.error('Patients API Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors from API
  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      console.log('Fetching doctors from API...');
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doctors.php');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Raw doctors response:', responseText);
      
      // Check if response starts with HTML/PHP error
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<?php')) {
        console.error('Server returned HTML/PHP instead of JSON:', responseText);
        
        // Fallback to sample doctors data
        const fallbackDoctors = [
          { id: 1, name: 'Dr. Jayson Ado', role: 'General Medicine', email: 'j.ado@hospital.com', department: 'General Medicine', status: 'Active' },
          { id: 2, name: 'Dr. Juan Tamad', role: 'Cardiologist', email: 'j.tamad@hospital.com', department: 'Cardiology', status: 'Active' },
          { id: 3, name: 'Nurse Joy Garcia', role: 'Registered Nurse', email: 'j.garcia@hospital.com', department: 'Emergency', status: 'Active' },
          { id: 4, name: 'Dr. Kenji Tanaka', role: 'Pediatrician', email: 'k.tanaka@hospital.com', department: 'Pediatrics', status: 'Active' }
        ];
        
        setDoctors(fallbackDoctors);
        return;
      }
      
      try {
        const result = JSON.parse(responseText);
        console.log('Parsed doctors result:', result);
        
        if (result.success && Array.isArray(result.data)) {
          // Convert string IDs back to numbers for the form
          const doctorsWithNumericIds = result.data.map((doctor: any) => ({
            ...doctor,
            id: typeof doctor.id === 'string' && doctor.id.startsWith('STF') 
              ? parseInt(doctor.id.replace('STF', '')) 
              : parseInt(doctor.id) || doctor.id
          }));
          console.log('Processed doctors:', doctorsWithNumericIds);
          setDoctors(doctorsWithNumericIds);
        } else if (Array.isArray(result)) {
          // Handle direct array response
          const doctorsWithNumericIds = result.map((doctor: any) => ({
            ...doctor,
            id: typeof doctor.id === 'string' && doctor.id.startsWith('STF') 
              ? parseInt(doctor.id.replace('STF', '')) 
              : parseInt(doctor.id) || doctor.id
          }));
          setDoctors(doctorsWithNumericIds);
        } else {
          throw new Error(result.message || 'Unknown error from server');
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Server returned invalid JSON response');
      }
      
    } catch (error) {
      console.error('Error fetching doctors:', error);
      
      // Fallback to sample doctors data on any error
      const fallbackDoctors = [
        { id: 1, name: 'Dr. Jayson Ado', role: 'General Medicine', email: 'j.ado@hospital.com', department: 'General Medicine', status: 'Active' },
        { id: 2, name: 'Dr. Juan Tamad', role: 'Cardiologist', email: 'j.tamad@hospital.com', department: 'Cardiology', status: 'Active' },
        { id: 3, name: 'Nurse Joy Garcia', role: 'Registered Nurse', email: 'j.garcia@hospital.com', department: 'Emergency', status: 'Active' },
        { id: 4, name: 'Dr. Kenji Tanaka', role: 'Pediatrician', email: 'k.tanaka@hospital.com', department: 'Pediatrics', status: 'Active' }
      ];
      
      setDoctors(fallbackDoctors);
    } finally {
      setLoadingDoctors(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    fetchDoctors();
  }, []);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  }

  const handleAddPatient = async (formData: AddPatientForm) => {
    setIsSubmittingPatient(true);
    setError(null);

    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/patients.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Refresh patients list
        await fetchPatients();
        setIsAddModalOpen(false);
        console.log('Patient added successfully:', result.message);
      } else {
        console.error('API returned error:', result.message);
        setError(`Failed to add patient: ${result.message}`);
      }
    } catch (err) {
      console.error('Error adding patient:', err);
      setError('Network error while adding patient. Please try again.');
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  const handleDischarge = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Set loading state for this specific patient
    setDischargingPatient(patientId);
    setError(null); // Clear any previous errors

    // Function to update local state
    const updateLocalState = () => {
      setPatients(prevPatients => 
        prevPatients.map(p => {
          if (p.id === patientId) {
            return {
              ...p,
              status: 'Discharged',
              dateOfDischarge: currentDate,
            };
          }
          return p;
        })
      );
    };

    // If no patient_id (using fallback data), just update local state
    if (!patient?.patient_id) {
      updateLocalState();
      setDischargingPatient(null);
      return;
    }

    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/patients.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: patient.patient_id,
          action: 'discharge'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        // Update local state on successful API call
        updateLocalState();
        console.log('Patient discharged successfully:', result.message);
      } else {
        console.error('API returned error:', result.message);
        setError(`Failed to discharge patient: ${result.message}`);
      }
    } catch (err) {
      console.error('Error discharging patient:', err);
      setError('Network error during discharge. Please try again.');
    } finally {
      setDischargingPatient(null);
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
    <DashboardLayout role="admin">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Patient Records</CardTitle>
          <CardDescription>
            A comprehensive list of all patients.
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
                  placeholder="Search patients by name or email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="shrink-0"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
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
              <PatientTable 
                patients={activePatients} 
                onPatientSelect={handlePatientSelect} 
                onDischarge={handleDischarge} 
                loading={loading}
                dischargingPatient={dischargingPatient}
              />
            </TabsContent>
            <TabsContent value="admitted">
              <PatientTable 
                patients={admittedPatients} 
                onPatientSelect={handlePatientSelect} 
                onDischarge={handleDischarge} 
                loading={loading}
                dischargingPatient={dischargingPatient}
              />
            </TabsContent>
            <TabsContent value="discharged">
               <PatientTable 
                 patients={dischargedPatients} 
                 onPatientSelect={handlePatientSelect} 
                 onDischarge={handleDischarge}
                 loading={loading}
                 dischargingPatient={dischargingPatient}
               />
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
      <AddPatientModal 
        isOpen={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen}
        doctors={doctors}
        loadingDoctors={loadingDoctors}
        onSubmit={handleAddPatient}
        isSubmitting={isSubmittingPatient}
      />
    </DashboardLayout>
  );
}
