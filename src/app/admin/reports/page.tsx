
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';

import DashboardLayout from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { generateServiceLogReport } from '@/ai/flows/generate-report';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  dateRange: z.object({
    from: z.date({
      required_error: 'A start date is required.',
    }),
    to: z.date({
      required_error: 'An end date is required.',
    }),
  }),
});

export default function ReportsPage() {
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setReport('');
    setDateRange(values.dateRange);
    try {
      const result = await generateServiceLogReport({
        startDate: format(values.dateRange.from, 'yyyy-MM-dd'),
        endDate: format(values.dateRange.to, 'yyyy-MM-dd'),
      });
      if (result.reportSummary) {
        setReport(result.reportSummary);
      } else {
        throw new Error('Failed to generate report.');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not generate the report. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleDownload = () => {
    if (!report || !dateRange) return;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fromDate = format(dateRange.from, 'yyyy-MM-dd');
    const toDate = format(dateRange.to, 'yyyy-MM-dd');
    link.download = `report-${fromDate}-to-${toDate}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Automated Reporting"
        description="Generate service logs and hospital usage statistics using AI."
      />
      <div className="grid grid-cols-1 gap-8">
        <Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardHeader>
                <CardTitle>Report Options</CardTitle>
                <CardDescription>
                  Select the date range for your report.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
                  <FormField
                    control={form.control}
                    name="dateRange"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date range</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'w-[300px] justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value?.from ? (
                                  field.value.to ? (
                                    <>
                                      {format(field.value.from, 'LLL dd, y')} -{' '}
                                      {format(field.value.to, 'LLL dd, y')}
                                    </>
                                  ) : (
                                    format(field.value.from, 'LLL dd, y')
                                  )
                                ) : (
                                  <span>Pick a date range</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={field.value?.from}
                              selected={{from: field.value?.from, to: field.value?.to}}
                              onSelect={field.onChange}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Generate Report
                  </Button>
                </div>
              </CardContent>
            </form>
          </Form>
        </Card>

        <Card className="min-h-[400px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Report</CardTitle>
                <CardDescription>
                  AI-generated summary and insights will appear here.
                </CardDescription>
              </div>
              {report && !isLoading && (
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center pt-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {report && (
               <Textarea
               readOnly
               value={report}
               className="h-96 w-full text-sm bg-secondary"
             />
            )}
             {!isLoading && !report && (
              <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Your report will be displayed here.</p>
              </div>
             )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
