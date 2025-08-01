
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Download } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  dateRange: z.object({
    from: z.date().optional(),
    to: z.date().optional(),
  }).optional(),
});

export default function ReportsPage() {
  const [report, setReport] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleDownload = () => {
    if (!report.trim()) return;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    if (dateRange) {
      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      link.download = `report-${fromDate}-to-${toDate}.txt`;
    } else {
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      link.download = `report-${currentDate}.txt`;
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Reports" 
        description="Create and manage hospital reports with date ranges"
      />
      
      <div className="grid grid-cols-1 gap-8 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Select Date Range</CardTitle>
            <CardDescription>
              Select a date range for your report.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
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
                              !field.value?.from && 'text-muted-foreground'
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
                          onSelect={(range) => {
                            field.onChange(range);
                            if (range?.from && range?.to) {
                              setDateRange(range as { from: Date; to: Date });
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
          </CardContent>
        </Card>

        <Card className="min-h-[400px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Write Your Report</CardTitle>
                <CardDescription>
                  Write your report content here. Use the date range above to organize your reports.
                </CardDescription>
              </div>
              {report.trim() && (
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Write your report here..."
              value={report}
              onChange={(e) => setReport(e.target.value)}
              className="h-96 w-full text-sm"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
