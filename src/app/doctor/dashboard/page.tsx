import { FileDown, PlusCircle } from "lucide-react";
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

const upcomingAppointments = [
  {
    patient: { name: "Liam Johnson", email: "liam@email.com", avatar: "https://placehold.co/32x32.png" },
    time: "09:00 AM",
    reason: "Follow-up",
  },
  {
    patient: { name: "Emma Brown", email: "emma@email.com", avatar: "https://placehold.co/32x32.png" },
    time: "10:30 AM",
    reason: "Annual Check-up",
  },
  {
    patient: { name: "Noah Williams", email: "noah@email.com", avatar: "https://placehold.co/32x32.png" },
    time: "11:15 AM",
    reason: "Consultation",
  },
];

const prescriptions = [
    { id: "RX7890", name: "Lisinopril 10mg", date: "2023-06-15", status: "Active" },
    { id: "RX1234", name: "Metformin 500mg", date: "2023-05-20", status: "Active" },
]

const testResults = [
    { id: "LAB567", name: "Complete Blood Count (CBC)", date: "2023-06-15", status: "Ready" },
    { id: "IMG890", name: "Chest X-Ray", date: "2023-06-12", status: "Ready" },
]

export default function DoctorDashboardPage() {
  return (
    <DashboardLayout role="doctor">
      <PageHeader
        title="Doctor's Dashboard"
        description="Manage your appointments and patient records."
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                Your scheduled appointments for today.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingAppointments.map((appt) => (
                    <TableRow key={appt.patient.email}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={appt.patient.avatar} alt={appt.patient.name} data-ai-hint="patient avatar" />
                            <AvatarFallback>{appt.patient.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{appt.patient.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{appt.time}</TableCell>
                      <TableCell>{appt.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Prescriptions</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {prescriptions.map(p => (
                            <li key={p.id} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{p.name}</p>
                                    <p className="text-sm text-muted-foreground">{p.date}</p>
                                </div>
                                <Button variant="ghost" size="icon"><FileDown className="h-4 w-4" /></Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" size="sm" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add Prescription</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Test Results</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2">
                        {testResults.map(r => (
                            <li key={r.id} className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{r.name}</p>
                                    <p className="text-sm text-muted-foreground">{r.date}</p>
                                </div>
                                <Button variant="ghost" size="icon"><FileDown className="h-4 w-4" /></Button>
                            </li>
                        ))}
                    </ul>
                </CardContent>
                <CardFooter>
                    <Button variant="outline" size="sm" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Add Result</Button>
                </CardFooter>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
              <CardDescription>Details for the selected patient.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-center">
                    <Avatar className="h-24 w-24">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="Patient" data-ai-hint="patient avatar" />
                        <AvatarFallback>LJ</AvatarFallback>
                    </Avatar>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue="Liam Johnson" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" defaultValue="42" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="gender">Gender</Label>
                        <Input id="gender" defaultValue="Male" />
                    </div>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="contact">Contact</Label>
                    <Input id="contact" defaultValue="liam@email.com" />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="notes">Diagnosis Notes</Label>
                    <Textarea id="notes" placeholder="Enter diagnosis notes..."></Textarea>
                </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Update Information</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
