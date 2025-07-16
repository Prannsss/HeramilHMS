
'use client';

import { useState } from 'react';
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

const doctors = [
    { id: '1', name: 'Dr. Evelyn Reed', department: 'Cardiology', availableTimes: ['09:00 AM', '11:00 AM', '02:00 PM'] },
    { id: '2', name: 'Dr. Kenji Tanaka', department: 'Pediatrics', availableTimes: ['10:00 AM', '01:00 PM', '03:00 PM'] },
    { id: '3', name: 'Dr. Mark O\'Connell', department: 'Radiology', availableTimes: ['09:30 AM', '11:30 AM', '04:00 PM'] },
    { id: '4', name: 'Dr. Lee', department: 'Cardiology', availableTimes: ['10:00 AM', '12:00 PM', '03:00 PM'] },
    { id: '5', name: 'Dr. Davis', department: 'Pediatrics', availableTimes: ['09:00 AM', '11:00 AM', '02:30 PM'] },
    { id: '6', name: 'Dr. Wilson', department: 'Radiology', availableTimes: ['08:30 AM', '10:30 AM', '01:30 PM'] },
];

const departments = [...new Set(doctors.map(d => d.department))];

export default function BookAppointmentPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      name: '',
      email: '',
      reason: '',
      department: '',
      doctorId: '',
      time: '',
    },
  });

  const selectedDepartment = form.watch('department');
  const selectedDoctorId = form.watch('doctorId');

  const filteredDoctors = doctors.filter(
    (doctor) => doctor.department === selectedDepartment
  );

  const selectedDoctor = doctors.find(
    (doctor) => doctor.id === selectedDoctorId
  );

  async function onSubmit(values: z.infer<typeof appointmentFormSchema>) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setIsSubmitted(true);
    toast({
      title: 'Appointment Request Received!',
      description: 'We have successfully received your appointment please verify your appointment through an automated email that will be sent to you.',
    });
    console.log(values);
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
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="you@example.com" {...field} />
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
                        <Select onValueChange={(value) => { field.onChange(value); form.setValue('doctorId', ''); form.setValue('time', ''); }} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a department" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {departments.map((dept) => (
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
                        <Select onValueChange={(value) => { field.onChange(value); form.setValue('time', ''); }} value={field.value} disabled={!selectedDepartment}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a doctor" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {filteredDoctors.map((doc) => (
                                <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
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
      </div>
    </div>
  );
}
