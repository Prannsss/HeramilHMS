'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { format, parse } from 'date-fns';

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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { autoAdjustAvailabilitySchedule, AutoAdjustAvailabilityScheduleOutput } from '@/ai/flows/availability-schedule-adjustment';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  doctorId: z.string().min(1, 'Doctor ID is required.'),
  startDate: z.string().min(1, 'Start date is required.'),
  endDate: z.string().min(1, 'End date is required.'),
  knownEvents: z.string().min(1, 'Known events are required.'),
});

type AdjustedSchedule = { date: string; availability: string[] }[];

export default function ScheduleAdjustmentPage() {
  const [result, setResult] = useState<AutoAdjustAvailabilityScheduleOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doctorId: "DR007",
      startDate: "2024-07-01",
      endDate: "2024-07-31",
      knownEvents: JSON.stringify([
        { date: "2024-07-04", description: "Independence Day" },
        { date: "2024-07-20", description: "Hospital Foundation Gala" }
      ], null, 2),
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
        const parsedEvents = JSON.parse(values.knownEvents);
        if(!Array.isArray(parsedEvents)) throw new Error("Known events must be a JSON array.");
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Invalid JSON",
            description: "Known events must be a valid JSON array.",
        });
        setIsLoading(false);
        return;
    }

    try {
      const response = await autoAdjustAvailabilitySchedule(values);
      if (response.adjustedSchedule && response.summary) {
        setResult(response);
      } else {
        throw new Error('Failed to adjust schedule.');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not adjust schedule. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const parsedSchedule: AdjustedSchedule = result ? JSON.parse(result.adjustedSchedule) : [];

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="AI Schedule Adjustment"
        description="Automatically adjust doctor schedules for holidays and events."
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Adjustment Details</CardTitle>
                  <CardDescription>
                    Provide the details for schedule adjustment.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="doctorId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor ID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., DR123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="knownEvents"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Known Events (JSON format)</FormLabel>
                        <FormControl>
                          <Textarea rows={5} placeholder='[{"date": "YYYY-MM-DD", "description": "Event"}]' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Adjust Schedule
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Adjusted Schedule</CardTitle>
                    <CardDescription>The updated schedule will appear here.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && (
                        <div className="flex items-center justify-center pt-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    {result && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-2">Adjustment Summary</h3>
                                <p className="text-sm text-muted-foreground p-4 bg-secondary rounded-lg">{result.summary}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold mb-2">Updated Availability</h3>
                                <div className="max-h-96 overflow-y-auto border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Availability</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedSchedule.map((item) => (
                                            <TableRow key={item.date}>
                                                <TableCell>{format(parse(item.date, 'yyyy-MM-dd', new Date()), 'EEE, MMM dd')}</TableCell>
                                                <TableCell>
                                                    {item.availability.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {item.availability.map(slot => <Badge variant="secondary" key={slot}>{slot}</Badge>)}
                                                        </div>
                                                    ) : <Badge variant="destructive">Unavailable</Badge>}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
