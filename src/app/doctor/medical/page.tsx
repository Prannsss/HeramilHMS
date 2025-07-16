'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const medicalRecords = [
  {
    id: 'REC001',
    patient: { name: 'Amelia Johnson', avatar: 'https://placehold.co/32x32.png' },
    doctor: 'Dr. Evelyn Reed',
    date: '2023-06-15',
    type: 'Prescription',
    details: 'Lisinopril 10mg for hypertension.',
  },
  {
    id: 'REC002',
    patient: { name: 'Benjamin Carter', avatar: 'https://placehold.co/32x32.png' },
    doctor: 'Dr. Kenji Tanaka',
    date: '2023-06-18',
    type: 'Test Result',
    details: 'Blood Panel: All levels normal.',
  },
  {
    id: 'REC003',
    patient: { name: 'Charlotte Davis', avatar: 'https://placehold.co/32x32.png' },
    doctor: 'Dr. Mark O\'Connell',
    date: '2023-06-20',
    type: 'Diagnosis',
    details: 'Diagnosed with seasonal allergies.',
  },
  {
    id: 'REC004',
    patient: { name: 'Daniel Evans', avatar: 'https://placehold.co/32x32.png' },
    doctor: 'Dr. Evelyn Reed',
    date: '2023-06-22',
    type: 'Prescription',
    details: 'Amoxicillin 500mg for infection.',
  },
  {
    id: 'REC005',
    patient: { name: 'Evelyn Foster', avatar: 'https://placehold.co/32x32.png' },
    doctor: 'Dr. Kenji Tanaka',
    date: '2023-06-25',
    type: 'Test Result',
    details: 'X-Ray: No fractures detected.',
  },
];

type MedicalRecord = typeof medicalRecords[0];

export default function DoctorMedicalPage() {
  const [records, setRecords] = useState<MedicalRecord[]>(medicalRecords);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecords = records.filter(record =>
    record.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.type.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'Prescription':
        return 'default';
      case 'Test Result':
        return 'secondary';
      case 'Diagnosis':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <DashboardLayout role="doctor">
      <PageHeader
        title="Medical Records"
        description="View your patients' medical records."
      />
      <Card>
        <CardHeader>
          <CardTitle>Your Patient Records</CardTitle>
          <CardDescription>
            A list of medical records for your assigned patients.
          </CardDescription>
           <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by patient or type..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={record.patient.avatar} alt={record.patient.name} data-ai-hint="patient avatar" />
                        <AvatarFallback>{record.patient.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span>{record.patient.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(record.type)}>{record.type}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{record.details}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-{filteredRecords.length}</strong> of <strong>{records.length}</strong> records
            </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}
