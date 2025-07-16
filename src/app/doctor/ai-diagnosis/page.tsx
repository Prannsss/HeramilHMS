
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles, Check, ChevronsUpDown } from 'lucide-react';

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
import { aiDiagnosisSupport } from '@/ai/flows/ai-diagnosis-support';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const initialPatients = [
  {
    id: "PAT001",
    name: "Amelia Johnson",
    email: "amelia.j@email.com",
    avatar: "https://placehold.co/32x32.png",
    dob: "1985-04-12",
    lastVisit: "2023-06-15",
    status: "Active",
    bloodType: "A+",
    allergies: "Peanuts",
    dateOfAdmission: "2023-06-12",
    reasonForAdmission: "Routine Check-up",
  },
  {
    id: "PAT002",
    name: "Benjamin Carter",
    email: "ben.c@email.com",
    avatar: "https://placehold.co/32x32.png",
    dob: "1992-08-25",
    lastVisit: "2023-06-10",
    status: "Active",
    bloodType: "O-",
    allergies: "None",
    dateOfAdmission: "2023-06-08",
    reasonForAdmission: "Fractured Arm",
  },
  {
    id: "PAT004",
    name: "Daniel Evans",
    email: "daniel.e@email.com",
    avatar: "https://placehold.co/32x32.png",
    dob: "2001-01-30",
    lastVisit: "2023-06-18",
    status: "Active",
    bloodType: "AB+",
    allergies: "Aspirin",
    dateOfAdmission: "2023-06-18",
    reasonForAdmission: "Allergic Reaction",
  },
  {
    id: "PAT005",
    name: "Evelyn Foster",
    email: "evelyn.f@email.com",
    avatar: "https://placehold.co/32x32.png",
    dob: "1999-07-19",
    lastVisit: "2023-06-01",
    status: "Active",
    bloodType: "O+",
    allergies: "None",
    dateOfAdmission: "2023-05-28",
    reasonForAdmission: "Migraine Treatment",
  },
];

type Patient = typeof initialPatients[0];

const formSchema = z.object({
  patientId: z.string().min(1, 'Please select a patient.'),
  diagnosis: z.string().optional(),
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
                  {patient.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function AiDiagnosisPage() {
  const [patients] = useState<Patient[]>(initialPatients);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientId: '',
      diagnosis: '',
    },
  });

  const selectedPatientId = form.watch('patientId');
  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  async function handleGenerateDiagnosis() {
    if (!selectedPatient) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a patient first.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await aiDiagnosisSupport({ symptoms: selectedPatient.reasonForAdmission });
      if (result.diagnosis) {
        form.setValue('diagnosis', result.diagnosis);
      } else {
        throw new Error('Failed to get diagnosis suggestions.');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not generate a diagnosis. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
        title: "Diagnosis Saved",
        description: `The diagnosis for ${selectedPatient?.name} has been saved.`,
    })
  }

  return (
    <DashboardLayout role="doctor">
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    Write your diagnosis or generate one with AI.
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
                            placeholder="Write your diagnosis here or click 'Generate with AI'."
                            className="h-full min-h-[250px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateDiagnosis}
                    disabled={isLoading || !selectedPatient}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Generate with AI
                  </Button>
                  <Button type="submit" disabled={!selectedPatient}>
                    Save Diagnosis
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </DashboardLayout>
  );
}
