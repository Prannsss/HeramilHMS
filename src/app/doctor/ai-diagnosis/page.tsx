'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

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
import { Textarea } from '@/components/ui/textarea';
import { aiDiagnosisSupport, AiDiagnosisSupportOutput } from '@/ai/flows/ai-diagnosis-support';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

const formSchema = z.object({
  symptoms: z.string().min(10, 'Please provide a detailed description of the symptoms.'),
});

export default function AiDiagnosisPage() {
  const [diagnosis, setDiagnosis] = useState<AiDiagnosisSupportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        symptoms: "Patient presents with a persistent dry cough for the last two weeks, accompanied by a low-grade fever, fatigue, and occasional shortness of breath. No chest pain reported."
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setDiagnosis(null);
    try {
      const result = await aiDiagnosisSupport(values);
      if (result.diagnosisSuggestions && result.confidenceLevels) {
        setDiagnosis(result);
      } else {
        throw new Error('Failed to get diagnosis suggestions.');
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not get diagnosis suggestions. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const chartData = diagnosis?.diagnosisSuggestions.map((suggestion, index) => ({
    name: suggestion,
    probability: diagnosis.confidenceLevels[index] * 100,
  })) || [];

  return (
    <DashboardLayout role="doctor">
      <PageHeader
        title="AI Diagnosis Support"
        description="Get differential diagnosis suggestions based on patient symptoms."
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Symptom Input</CardTitle>
                  <CardDescription>
                    Enter the patient's symptoms for AI analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="symptoms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Patient Symptoms</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={10}
                            placeholder="e.g., Patient complains of fever, headache, and a sore throat..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Get Diagnosis
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis Suggestions</CardTitle>
              <CardDescription>
                Potential diagnoses and their confidence levels.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] pt-4">
              {isLoading && (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              {diagnosis && (
                <ChartContainer config={{
                    probability: {
                        label: 'Probability',
                        color: 'hsl(var(--primary))',
                    },
                }} className="h-full w-full">
                    <BarChart
                    accessibilityLayer
                    data={chartData}
                    layout="vertical"
                    margin={{
                        left: 10,
                        right: 10,
                    }}
                    >
                    <CartesianGrid horizontal={false} />
                    <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
                        width={120}
                        className="text-sm"
                    />
                    <XAxis dataKey="probability" type="number" hide />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent />} />
                    <Bar dataKey="probability" radius={5} />
                    </BarChart>
                </ChartContainer>
              )}
               {!isLoading && !diagnosis && (
                <div className="flex h-full items-center justify-center">
                  <p className="text-muted-foreground">Results will be displayed here.</p>
                </div>
               )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
