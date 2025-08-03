
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';

import DashboardLayout from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useUserStore } from '@/hooks/use-user-store';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

// Types for API response
interface Patient {
  id: string;
  patient_id: number;
  name: string;
  email: string;
  age: number;
  gender: string;
  contact_number: string;
  address: string;
  dob: string;
  bloodType: string;
  allergies: string;
  status: string;
  dateOfAdmission: string;
  reasonForAdmission: string;
  dateOfDischarge: string | null;
  lastVisit: string | null;
}

const formSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient.'),
  diagnosis: z.string().min(1, 'Please enter a diagnosis.'),
});

function PatientCombobox({ patients, field }: { patients: Patient[], field: any }) {
  const [open, setOpen] = useState(false)
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value
              ? patients.find(
                  (patient) => patient.id === field.value
                )?.name
              : "Select a patient"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder="Search patient..." />
          <CommandList>
            <CommandEmpty>No patient found.</CommandEmpty>
            <CommandGroup>
              {patients.map((patient) => (
                <CommandItem
                  value={patient.name}
                  key={patient.id}
                  onSelect={() => {
                    field.onChange(patient.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      patient.id === field.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <div className="flex items-center justify-between w-full">
                    <span>{patient.name}</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      patient.status === 'Admitted' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    )}>
                      {patient.status}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function DiagnosisPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const { toast } = useToast();
  const { user, isAuthenticated, getDoctorId, hasHydrated } = useUserStore();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      diagnosis: '',
    },
  });

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
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'No doctor ID found in authentication',
        duration: 3000,
      });
      return;
    }

    setIsAuthChecked(true);
    fetchPatients(doctorId);
  }, [hasHydrated, user, isAuthenticated, getDoctorId, router]);

  // Fetch patients from API
  async function fetchPatients(doctorId: number) {
    try {
      const response = await fetch(`http://localhost/HeramilHMS/public/backend/api/doc-diagnosis.php?action=patients&doctor_id=${doctorId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        setPatients(data.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load patients: ' + data.message,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load patients. Please check your connection.',
        duration: 3000,
      });
    } finally {
      setIsLoadingPatients(false);
    }
  }

  const selectedPatientId = form.watch('patientId');
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!selectedPatient) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a patient.',
        duration: 3000,
      });
      return;
    }

    const doctorId = getDoctorId();
    if (!doctorId) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Doctor ID not found. Please log in again.',
        duration: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doc-diagnosis.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patient_id: selectedPatient.patient_id,
          doctor_id: doctorId,
          diagnosis: values.diagnosis,
          record_type: 'Diagnosis'
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        toast({
          title: "Diagnosis Saved",
          description: `The diagnosis for ${selectedPatient.name} has been saved successfully.`,
          duration: 3000,
        });
        
        // Reset form
        form.reset();
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save diagnosis: ' + data.message,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save diagnosis. Please try again.',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DashboardLayout role="doctor">
      <PageHeader 
        title="Diagnosis" 
        description="Create and manage patient diagnosis"
      />
      
      {!hasHydrated || !isAuthChecked || isLoadingPatients ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">
            {!hasHydrated ? 'Initializing...' : !isAuthChecked ? 'Checking authentication...' : 'Loading patients...'}
          </span>
        </div>
      ) : patients.length === 0 ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-medium text-muted-foreground">No Patients Available</h3>
            <p className="text-sm text-muted-foreground mt-2">
              You don't have any active patients assigned to you for diagnosis.
            </p>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Patient</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="patientId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Patient</FormLabel>
                            <PatientCombobox patients={patients} field={field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {selectedPatient && (
                      <div className="space-y-2 text-sm pt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="font-medium text-muted-foreground">DOB</p>
                            <p>{selectedPatient.dob}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Blood Type</p>
                            <p>{selectedPatient.bloodType}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Age</p>
                            <p>{selectedPatient.age}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Gender</p>
                            <p>{selectedPatient.gender}</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Status</p>
                            <p className={cn(
                              "font-medium",
                              selectedPatient.status === 'Admitted' ? 'text-red-600' : 'text-green-600'
                            )}>
                              {selectedPatient.status}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">DOA</p>
                            <p>{selectedPatient.dateOfAdmission}</p>
                          </div>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Allergies</p>
                          <p>{selectedPatient.allergies}</p>
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Reason for Admission</p>
                          <p>{selectedPatient.reasonForAdmission}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="md:col-span-2">
                <Card className="flex flex-col h-full">
                  <CardHeader>
                    <CardTitle>Diagnosis Notes</CardTitle>
                    <CardDescription>
                      Write your diagnosis notes here.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                     <FormField
                      control={form.control}
                      name="diagnosis"
                      render={({ field }) => (
                        <FormItem className="h-full flex flex-col">
                          <FormLabel>Diagnosis</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Write your diagnosis here..."
                              className="h-full min-h-[250px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isLoading || !selectedPatient}>
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Save Diagnosis
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </form>
        </Form>
      )}
    </DashboardLayout>
  );
}
