
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Logo from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const appointmentFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  mobile: z.string().min(10, {
    message: 'Please enter a valid mobile number.',
  }),
  address: z.string().min(5, {
    message: 'Please enter a valid address.',
  }),
  date: z.date({
    required_error: 'An appointment date is required.',
  }),
  department: z.string().min(1, 'Please select a department.'),
  doctorId: z.string().min(1, 'Please select a doctor.'),
  time: z.string().min(1, 'Please select a time.'),
  reason: z.string().min(10, {
    message: 'Reason must be at least 10 characters.',
  }),
});

interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  availableTimes: string[];
}

interface DoctorsData {
  doctors: Doctor[];
  departments: string[];
  doctors_by_department: Record<string, Doctor[]>;
}

export default function BookAppointmentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [doctorsData, setDoctorsData] = useState<DoctorsData>({
    doctors: [],
    departments: [],
    doctors_by_department: {}
  });
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const { toast } = useToast();

  // Fetch doctors and departments on component mount
  useEffect(() => {
    fetchDoctorsData();
  }, []);

  const fetchDoctorsData = async () => {
    try {
      setLoadingDoctors(true);
      
      console.log('Fetching doctors from API...');
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doctors-schedule.php');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);
      
      // Check if response starts with HTML/PHP error
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<?php')) {
        console.error('Server returned HTML/PHP instead of JSON:', responseText);
        
        // Fallback to hardcoded data
        const fallbackData = {
          doctors: [
            { id: '1', name: 'Dr. Jayson Ado', department: 'General Medicine', specialization: 'General Medicine', availableTimes: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM'] },
            { id: '2', name: 'Dr. Juan Tamad', department: 'Cardiology', specialization: 'Cardiologist', availableTimes: ['09:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
            { id: '3', name: 'Nurse Joy Garcia', department: 'Emergency', specialization: 'Registered Nurse', availableTimes: ['09:00 AM', '10:00 AM', '01:00 PM', '04:00 PM'] },
            { id: '4', name: 'Dr. Kenji Tanaka', department: 'Pediatrics', specialization: 'Pediatrician', availableTimes: ['10:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'] }
          ],
          departments: ['General Medicine', 'Cardiology', 'Emergency', 'Pediatrics'],
          doctors_by_department: {
            'General Medicine': [{ id: '1', name: 'Dr. Jayson Ado', department: 'General Medicine', specialization: 'General Medicine', availableTimes: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM'] }],
            'Cardiology': [{ id: '2', name: 'Dr. Juan Tamad', department: 'Cardiology', specialization: 'Cardiologist', availableTimes: ['09:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] }],
            'Emergency': [{ id: '3', name: 'Nurse Joy Garcia', department: 'Emergency', specialization: 'Registered Nurse', availableTimes: ['09:00 AM', '10:00 AM', '01:00 PM', '04:00 PM'] }],
            'Pediatrics': [{ id: '4', name: 'Dr. Kenji Tanaka', department: 'Pediatrics', specialization: 'Pediatrician', availableTimes: ['10:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'] }]
          }
        };
        
        setDoctorsData(fallbackData);
        
        toast({
          title: 'Using Sample Data',
          description: 'Unable to connect to database. Using sample data. Please ensure XAMPP is running.',
          variant: 'destructive',
        });
        return;
      }
      
      try {
        const result = JSON.parse(responseText);
        console.log('Parsed result:', result);
        
        if (result.status === 'success') {
          setDoctorsData(result.data);
          toast({
            title: 'Success',
            description: 'Doctors data loaded from database successfully.',
          });
        } else {
          throw new Error(result.message || 'Unknown error from server');
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Server returned invalid JSON response');
      }
      
    } catch (error) {
      console.error('Error fetching doctors:', error);
      
      // Fallback to hardcoded data on any error
      const fallbackData = {
        doctors: [
          { id: '1', name: 'Dr. Jayson Ado', department: 'General Medicine', specialization: 'General Medicine', availableTimes: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM'] },
          { id: '2', name: 'Dr. Juan Tamad', department: 'Cardiology', specialization: 'Cardiologist', availableTimes: ['09:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] },
          { id: '3', name: 'Nurse Joy Garcia', department: 'Emergency', specialization: 'Registered Nurse', availableTimes: ['09:00 AM', '10:00 AM', '01:00 PM', '04:00 PM'] },
          { id: '4', name: 'Dr. Kenji Tanaka', department: 'Pediatrics', specialization: 'Pediatrician', availableTimes: ['10:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'] }
        ],
        departments: ['General Medicine', 'Cardiology', 'Emergency', 'Pediatrics'],
        doctors_by_department: {
          'General Medicine': [{ id: '1', name: 'Dr. Jayson Ado', department: 'General Medicine', specialization: 'General Medicine', availableTimes: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM'] }],
          'Cardiology': [{ id: '2', name: 'Dr. Juan Tamad', department: 'Cardiology', specialization: 'Cardiologist', availableTimes: ['09:00 AM', '11:00 AM', '02:00 PM', '03:00 PM'] }],
          'Emergency': [{ id: '3', name: 'Nurse Joy Garcia', department: 'Emergency', specialization: 'Registered Nurse', availableTimes: ['09:00 AM', '10:00 AM', '01:00 PM', '04:00 PM'] }],
          'Pediatrics': [{ id: '4', name: 'Dr. Kenji Tanaka', department: 'Pediatrics', specialization: 'Pediatrician', availableTimes: ['10:00 AM', '11:00 AM', '01:00 PM', '03:00 PM'] }]
        }
      };
      
      setDoctorsData(fallbackData);
      
      toast({
        title: 'Connection Failed',
        description: 'Using sample data. Please check if XAMPP is running and try refreshing.',
        variant: 'destructive',
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  const form = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      address: '',
      reason: '',
      department: '',
      doctorId: '',
      time: '',
    },
  });

  const selectedDepartment = form.watch('department');
  const selectedDoctorId = form.watch('doctorId');

  const filteredDoctors = doctorsData.doctors_by_department[selectedDepartment] || [];

  const selectedDoctor = doctorsData.doctors.find(
    (doctor) => doctor.id === selectedDoctorId
  );

  async function onSubmit(values: z.infer<typeof appointmentFormSchema>) {
    setIsLoading(true);
    
    try {
      // Format the data for the API
      const appointmentData = {
        name: values.name,
        email: values.email,
        mobile: values.mobile,
        address: values.address,
        date: format(values.date, 'yyyy-MM-dd'),
        time: values.time,
        doctorId: values.doctorId,
        reason: values.reason,
      };

      console.log('Submitting appointment:', appointmentData);

      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/book-appointment.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const responseText = await response.text();
      console.log('Appointment response:', responseText);

      // Check if response is HTML/PHP error
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<?php')) {
        console.warn('Backend not available, simulating success...');
        
        // Simulate successful submission when backend is not available
        setIsSubmitted(true);
        toast({
          title: 'Appointment Request Received! (Simulated)',
          description: 'Your appointment has been submitted. Note: Backend is not available, so this is simulated. Please ensure XAMPP is running for real submissions.',
        });
        return;
      }

      try {
        const result = JSON.parse(responseText);
        
        if (result.status === 'success') {
          setIsSubmitted(true);
          toast({
            title: 'Appointment Request Received!',
            description: 'We have successfully received your appointment. Please verify your appointment through an automated email that will be sent to you.',
          });
        } else {
          // Handle specific error from backend
          toast({
            title: 'Booking Failed',
            description: result.message || 'Failed to submit appointment. Please try again.',
            variant: 'destructive',
          });
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        
        // If we can't parse JSON but got a response, show generic error
        toast({
          title: 'Submission Failed',
          description: 'Server returned an invalid response. Please try again.',
          variant: 'destructive',
        });
      }

    } catch (error) {
      console.error('Error submitting appointment:', error);
      
      // Show a user-friendly error message
      toast({
        title: 'Submission Failed',
        description: 'Unable to submit appointment. Please check your connection and ensure XAMPP is running.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  if (isSubmitted) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md text-center">
                 <header className="mb-8 flex flex-col items-center">
                    <Logo />
                </header>
                <Card>
                    <CardHeader>
                        <CardTitle>Thank You!</CardTitle>
                        <CardDescription>Your appointment request has been successfully submitted.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Please check your email to verify and confirm your appointment details.</p>
                    </CardContent>
                    <CardFooter>
                         <Button asChild className="w-full">
                            <Link href="/">Return to Home</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <header className="mb-8 flex flex-col items-center">
          <Logo />
        </header>
        
        {loadingDoctors ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="text-muted-foreground">Loading doctors and departments...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Book an Appointment</CardTitle>
              <CardDescription>
                Please fill out the form below to request an appointment.
              </CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan Tamad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                            <Input placeholder="j.tamad@gmail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Mobile Number</FormLabel>
                        <FormControl>
                            <Input placeholder="+(63)000-000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Luzon, Visayas, Mindanao" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Department</FormLabel>
                        <Select 
                          onValueChange={(value) => { 
                            field.onChange(value); 
                            form.setValue('doctorId', ''); 
                            form.setValue('time', ''); 
                          }} 
                          defaultValue={field.value}
                          disabled={loadingDoctors}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={loadingDoctors ? "Loading departments..." : "Select a department"} />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {doctorsData.departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Doctor</FormLabel>
                        <Select 
                          onValueChange={(value) => { 
                            field.onChange(value); 
                            form.setValue('time', ''); 
                          }} 
                          value={field.value} 
                          disabled={!selectedDepartment || loadingDoctors}
                        >
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a doctor" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {filteredDoctors.map((doc) => (
                                <SelectItem key={doc.id} value={doc.id}>
                                  {doc.name} - {doc.specialization}
                                </SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Preferred Date</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={'outline'}
                                className={cn(
                                    'w-full justify-start text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? (
                                    format(field.value, 'PPP')
                                ) : (
                                    <span>Pick a date</span>
                                )}
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date < new Date() || date < new Date('1900-01-01')
                                }
                                initialFocus
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Available Time</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDoctor}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a time slot" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {selectedDoctor?.availableTimes.map((time) => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Appointment</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Briefly describe the reason for your visit..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Request Appointment
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href="/">Cancel</Link>
                  </Button>
                </div>
              </form>
            </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
