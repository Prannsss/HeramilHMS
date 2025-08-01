
'use client'

import { useState, useEffect } from "react";
import { FileDown, PlusCircle, MoreHorizontal, AlertCircle, Edit, Save, X } from "lucide-react";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserStore } from "@/hooks/use-user-store";
import { useRouter } from "next/navigation";

interface Appointment {
  id: string;
  patient: {
    name: string;
    email: string;
  };
  time: string;
  reason: string;
  date: string;
}

interface Patient {
  id: string;
  patient_id: number;
  name: string;
  email: string;
  contact_number: string;
  address: string;
  dob: string;
  age: number;
  gender: string;
  lastVisit: string;
  status: string;
  bloodType: string;
  allergies: string;
  dateOfAdmission: string;
  reasonForAdmission: string;
  dateOfDischarge: string | null;
}

const getInitials = (name: string) => {
    const names = name.split(' ');
    const firstName = names[0] ?? '';
    const lastName = names.length > 1 ? names[names.length - 1] : '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) return 0;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return Math.max(0, age);
};

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DoctorDashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [diagnosisNotes, setDiagnosisNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Patient | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, getDoctorId, hasHydrated } = useUserStore();
  const router = useRouter();

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

    fetchData(doctorId);
    setIsAuthChecked(true);
  }, [hasHydrated, user, isAuthenticated, getDoctorId, router]);

  const fetchData = async (doctorId: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all dashboard data from the dedicated API with doctor_id
      const response = await fetch(`http://localhost/HeramilHMS/public/backend/api/doc-dashboard.php?doctor_id=${doctorId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        // Calculate age for patients if not already present
        const patientsWithAge = (data.data.patients || []).map((patient: Patient) => ({
          ...patient,
          age: patient.age || calculateAge(patient.dob)
        }));
        
        setAppointments(data.data.appointments || []);
        setPatients(patientsWithAge);
        
        // Set first patient as selected if available
        if (patientsWithAge && patientsWithAge.length > 0) {
          setSelectedPatient(patientsWithAge[0]);
        } else {
          setSelectedPatient(null);
        }
      } else {
        setError(data.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Failed to connect to server. Please ensure the backend is running.');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setDiagnosisNotes(""); // Clear notes when switching patients
    setIsEditMode(false); // Exit edit mode when switching patients
    setEditedPatient(null);
  };

  const handleEditClick = () => {
    if (selectedPatient) {
      // Ensure all fields have default values to prevent controlled/uncontrolled errors
      setEditedPatient({ 
        ...selectedPatient,
        name: selectedPatient.name || '',
        contact_number: selectedPatient.contact_number || '',
        address: selectedPatient.address || '',
        dob: selectedPatient.dob || '',
        gender: selectedPatient.gender || '',
        bloodType: selectedPatient.bloodType || '',
        allergies: selectedPatient.allergies || '',
        age: selectedPatient.age || 0
      });
      setIsEditMode(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedPatient(null);
  };

  const handleInputChange = (field: keyof Patient, value: string) => {
    if (editedPatient) {
      const updatedPatient = {
        ...editedPatient,
        [field]: value
      };
      
      // If date of birth is changed, automatically calculate age
      if (field === 'dob') {
        updatedPatient.age = calculateAge(value);
      }
      
      setEditedPatient(updatedPatient);
    }
  };

  const handleSavePatient = async () => {
    if (!editedPatient) {
      toast({
        variant: "destructive",
        title: "No Changes",
        description: "No patient data to save.",
      });
      return;
    }

    const doctorId = getDoctorId();
    if (!doctorId) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "Doctor ID not found. Please log in again.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-dashboard.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_patient',
          patient_id: editedPatient.patient_id,
          doctor_id: doctorId,
          name: editedPatient.name,
          contact_number: editedPatient.contact_number,
          address: editedPatient.address,
          date_of_birth: editedPatient.dob,
          age: editedPatient.age,
          blood_type: editedPatient.bloodType,
          allergies: editedPatient.allergies,
          gender: editedPatient.gender
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Update the patient in the local state
        const updatedPatients = patients.map(p => 
          p.patient_id === editedPatient.patient_id 
            ? { ...editedPatient }
            : p
        );
        setPatients(updatedPatients);
        setSelectedPatient(editedPatient);
        
        toast({
          title: "Patient Updated",
          description: `${editedPatient.name}'s information has been updated successfully.`,
        });
        
        setIsEditMode(false);
        setEditedPatient(null);
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: data.error || "Failed to update patient information.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: "Failed to connect to server.",
      });
      console.error('Error updating patient:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
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

    const doctorId = getDoctorId();
    if (!doctorId) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Doctor ID not found. Please log in again.",
        });
        return;
    }

    try {
      // Save to doctor dashboard API with doctor_id included
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-dashboard.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_notes',
          patient_id: selectedPatient.patient_id,
          doctor_id: doctorId,
          doctor_name: user?.name || 'Unknown Doctor',
          notes: diagnosisNotes
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast({
            title: "Notes Saved",
            description: `Diagnosis notes for ${selectedPatient.name} have been saved to medical records.`,
        });
        setDiagnosisNotes(""); // Clear the textarea after saving
      } else {
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: data.error || "Failed to save diagnosis notes.",
        });
      }
    } catch (err) {
      toast({
          variant: "destructive",
          title: "Save Failed",
          description: "Failed to connect to server.",
      });
      console.error('Error saving notes:', err);
    }
  };

  if (!hasHydrated || !isAuthChecked || loading) {
    return (
      <DashboardLayout role="doctor">
        <PageHeader
          title="Doctor's Dashboard"
          description="Loading your appointments and patient records..."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Loading today's appointments...</CardDescription>
              </CardHeader>
              <CardContent>
                <LoadingSkeleton />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Your Active Patients</CardTitle>
                <CardDescription>Loading patient records...</CardDescription>
              </CardHeader>
              <CardContent>
                <LoadingSkeleton />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
                <CardDescription>Loading patient details...</CardDescription>
              </CardHeader>
              <CardContent>
                <LoadingSkeleton />
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="doctor">
        <PageHeader
          title="Doctor's Dashboard"
          description="Error loading dashboard data"
        />
        <Card className="mt-8">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => {
                const doctorId = getDoctorId();
                if (doctorId) {
                  fetchData(doctorId);
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
      <PageHeader
        title="Doctor's Dashboard"
        description="Manage your appointments and patient records."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                Your verified upcoming appointments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.length > 0 ? (
                    appointments.map((appt) => (
                      <TableRow key={appt.id}>
                        <TableCell>
                          <span className="font-medium">{appt.patient.name}</span>
                        </TableCell>
                        <TableCell>
                          <div>{appt.date}</div>
                          <div className="text-sm text-muted-foreground">{appt.time}</div>
                        </TableCell>
                        <TableCell>{appt.reason}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No verified appointments scheduled
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Active Patients</CardTitle>
              <CardDescription>
                Active patients with verified appointments or medical history with you.
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
                  {patients.length > 0 ? (
                    patients.map((patient) => (
                      <TableRow key={patient.id} onClick={() => handlePatientSelect(patient)} className="cursor-pointer">
                        <TableCell>
                          <div>
                            <div className="font-medium">{patient.name}</div>
                            <div className="text-sm text-muted-foreground">{patient.contact_number}</div>
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No active patients assigned
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>

        <div className="lg:col-span-1">
          <Card className="flex h-full flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Patient Information</CardTitle>
                  <CardDescription>Details for the selected patient.</CardDescription>
                </div>
                {selectedPatient && !isEditMode && (
                  <Button variant="outline" size="sm" onClick={handleEditClick}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
                {isEditMode && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleSavePatient}
                      disabled={isSaving}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            {selectedPatient ? (
                <>
                    <CardContent className="flex-1 flex flex-col space-y-4">
                        <div className="flex justify-center">
                            <Avatar className="h-24 w-24">
                                <AvatarFallback>{getInitials(isEditMode ? (editedPatient?.name || selectedPatient.name) : selectedPatient.name)}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="name">Name</Label>
                            <Input 
                              id="name" 
                              value={isEditMode ? (editedPatient?.name || '') : (selectedPatient.name || '')}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              readOnly={!isEditMode}
                              className={isEditMode ? '' : 'bg-muted'}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input 
                                  id="dob" 
                                  type={isEditMode ? "date" : "text"}
                                  value={isEditMode ? (editedPatient?.dob || '') : (selectedPatient.dob || '')}
                                  onChange={(e) => handleInputChange('dob', e.target.value)}
                                  readOnly={!isEditMode}
                                  className={isEditMode ? '' : 'bg-muted'}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="age">Age {isEditMode && '(Auto-calculated)'}</Label>
                                <Input 
                                  id="age" 
                                  value={isEditMode ? (editedPatient?.age?.toString() || '') : (selectedPatient.age?.toString() || 'Not specified')}
                                  readOnly
                                  className="bg-muted"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="gender">Gender</Label>
                            {isEditMode ? (
                              <Select 
                                value={editedPatient?.gender || ''}
                                onValueChange={(value) => handleInputChange('gender', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Male">Male</SelectItem>
                                  <SelectItem value="Female">Female</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input 
                                id="gender" 
                                value={selectedPatient.gender || 'Not specified'}
                                readOnly
                                className="bg-muted"
                              />
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="contact">Contact Number</Label>
                            <Input 
                              id="contact" 
                              value={isEditMode ? (editedPatient?.contact_number || '') : (selectedPatient.contact_number || '')}
                              onChange={(e) => handleInputChange('contact_number', e.target.value)}
                              readOnly={!isEditMode}
                              className={isEditMode ? '' : 'bg-muted'}
                            />
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="address">Address</Label>
                            <Textarea 
                              id="address" 
                              value={isEditMode ? (editedPatient?.address || '') : (selectedPatient.address || 'Not specified')}
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              readOnly={!isEditMode}
                              className={isEditMode ? '' : 'bg-muted'}
                              rows={2}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="bloodType">Blood Type</Label>
                                {isEditMode ? (
                                  <Select 
                                    value={editedPatient?.bloodType || ''}
                                    onValueChange={(value) => handleInputChange('bloodType', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select blood type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="A+">A+</SelectItem>
                                      <SelectItem value="A-">A-</SelectItem>
                                      <SelectItem value="B+">B+</SelectItem>
                                      <SelectItem value="B-">B-</SelectItem>
                                      <SelectItem value="AB+">AB+</SelectItem>
                                      <SelectItem value="AB-">AB-</SelectItem>
                                      <SelectItem value="O+">O+</SelectItem>
                                      <SelectItem value="O-">O-</SelectItem>
                                      <SelectItem value="Unknown">Unknown</SelectItem>
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input 
                                    id="bloodType" 
                                    value={selectedPatient.bloodType || 'Not specified'}
                                    readOnly
                                    className="bg-muted"
                                  />
                                )}
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="allergies">Allergies</Label>
                                <Input 
                                  id="allergies" 
                                  value={isEditMode ? (editedPatient?.allergies || '') : (selectedPatient.allergies || '')}
                                  onChange={(e) => handleInputChange('allergies', e.target.value)}
                                  readOnly={!isEditMode}
                                  className={isEditMode ? '' : 'bg-muted'}
                                />
                            </div>
                        </div>
                        <div className="space-y-1 flex-1 flex flex-col">
                            <Label htmlFor="notes">Diagnosis Notes</Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Enter diagnosis notes..." 
                                className="flex-1"
                                value={diagnosisNotes}
                                onChange={(e) => setDiagnosisNotes(e.target.value)}
                                disabled={isEditMode}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        onClick={handleSaveNotes}
                        disabled={isEditMode}
                      >
                        Save Notes
                      </Button>
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
