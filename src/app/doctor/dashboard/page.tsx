
'use client'

import { useState, useEffect } from "react";
import { FileDown, PlusCircle, MoreHorizontal, AlertCircle } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

// Current logged-in doctor (in real app, this would come from authentication)
const CURRENT_DOCTOR_ID = 1; // Dr. Jayson Ado
const CURRENT_DOCTOR_NAME = "Dr. Jayson Ado";

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
  dob: string;
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
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all dashboard data from the dedicated API
      const response = await fetch(`http://localhost/HeramilHMS/public/backend/api/doc-dashboard.php?doctor_id=${CURRENT_DOCTOR_ID}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setAppointments(data.data.appointments);
        setPatients(data.data.patients);
        
        // Set first patient as selected if available
        if (data.data.patients.length > 0) {
          setSelectedPatient(data.data.patients[0]);
        }
      } else {
        setError(data.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setDiagnosisNotes(""); // Clear notes when switching patients
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

    try {
      // Save to doctor dashboard API
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-dashboard.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'save_notes',
          patient_id: selectedPatient.patient_id,
          doctor_name: CURRENT_DOCTOR_NAME,
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

  if (loading) {
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
              onClick={fetchData} 
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
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Details for the selected patient.</CardDescription>
            </CardHeader>
            {selectedPatient ? (
                <>
                    <CardContent className="flex-1 flex flex-col space-y-4">
                        <div className="flex justify-center">
                            <Avatar className="h-24 w-24">
                                <AvatarFallback>{getInitials(selectedPatient.name)}</AvatarFallback>
                            </Avatar>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" value={selectedPatient.name} readOnly />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" value={selectedPatient.dob} readOnly />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="gender">Blood Type</Label>
                                <Input id="gender" value={selectedPatient.bloodType} readOnly />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="contact">Contact</Label>
                            <Input id="contact" value={selectedPatient.contact_number} readOnly />
                        </div>
                        <div className="space-y-1 flex-1 flex flex-col">
                            <Label htmlFor="notes">Diagnosis Notes</Label>
                            <Textarea 
                                id="notes" 
                                placeholder="Enter diagnosis notes..." 
                                className="flex-1"
                                value={diagnosisNotes}
                                onChange={(e) => setDiagnosisNotes(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                    <Button className="w-full" onClick={handleSaveNotes}>Save Notes</Button>
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
