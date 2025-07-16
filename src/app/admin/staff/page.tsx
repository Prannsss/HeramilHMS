import { PlusCircle, Search } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const staff = [
  {
    id: "STF001",
    name: "Dr. Evelyn Reed",
    email: "e.reed@email.com",
    avatar: "https://placehold.co/32x32.png",
    role: "Cardiologist",
    department: "Cardiology",
    status: "Active",
  },
  {
    id: "STF002",
    name: "Nurse Liam Garcia",
    email: "l.garcia@email.com",
    avatar: "https://placehold.co/32x32.png",
    role: "Registered Nurse",
    department: "Emergency",
    status: "Active",
  },
  {
    id: "STF003",
    name: "Dr. Kenji Tanaka",
    email: "k.tanaka@email.com",
    avatar: "https://placehold.co/32x32.png",
    role: "Pediatrician",
    department: "Pediatrics",
    status: "On Leave",
  },
  {
    id: "STF004",
    name: "Lena Petrova",
    email: "l.petrova@email.com",
    avatar: "https://placehold.co/32x32.png",
    role: "Administrator",
    department: "Administration",
    status: "Active",
  },
  {
    id: "STF005",
    name: "Mark O'Connell",
    email: "m.oconnell@email.com",
    avatar: "https://placehold.co/32x32.png",
    role: "Radiologist",
    department: "Radiology",
    status: "Active",
  },
];

export default function AdminStaffPage() {
  return (
    <DashboardLayout role="admin">
      <PageHeader title="Staff" description="Manage hospital staff members." />
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            A list of all staff members at the hospital.
          </CardDescription>
           <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search staff..." className="pl-8" />
            </div>
            <Button className="ml-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Staff Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Staff ID</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} alt={member.name} data-ai-hint="staff avatar" />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.id}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.department}</TableCell>
                   <TableCell>
                    <Badge variant={member.status === 'Active' ? 'secondary' : 'destructive'}>
                        {member.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
         <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-5</strong> of <strong>{staff.length}</strong> staff members
            </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}
