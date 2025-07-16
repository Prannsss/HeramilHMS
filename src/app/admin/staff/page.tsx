'use client';

import { useState } from "react";
import { PlusCircle, Search, MoreHorizontal, Trash2, Undo2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type StaffStatus = "Active" | "On Leave" | "Retired";
type Role = "Cardiologist" | "Pediatrician" | "Radiologist" | "Registered Nurse" | "Administrator";

const roleDepartmentMap: Record<Role, string> = {
    Cardiologist: "Cardiology",
    Pediatrician: "Pediatrics",
    Radiologist: "Radiology",
    "Registered Nurse": "Emergency",
    Administrator: "Administration",
};

type StaffMember = {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: Role;
    department: string;
    status: StaffStatus;
};

const initialStaff: StaffMember[] = [
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
    name: "Dr. Mark O'Connell",
    email: "m.oconnell@email.com",
    avatar: "https://placehold.co/32x32.png",
    role: "Radiologist",
    department: "Radiology",
    status: "Retired",
  },
];

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);

  const handleAddStaff = (newStaffMember: Omit<StaffMember, "id" | "avatar">) => {
    const newMember: StaffMember = {
      ...newStaffMember,
      id: `STF${(staff.length + 1).toString().padStart(3, "0")}`,
      avatar: "https://placehold.co/32x32.png",
    };
    setStaff([...staff, newMember]);
  };

  const handleStatusChange = (staffId: string, newStatus: StaffStatus) => {
    setStaff(staff.map(member => member.id === staffId ? { ...member, status: newStatus } : member));
  };
  
  const handleDelete = (staffId: string) => {
    setStaff(staff.filter(member => member.id !== staffId));
  };

  const getStatusBadge = (status: StaffStatus) => {
    switch (status) {
        case "Active": return "secondary";
        case "On Leave": return "default";
        case "Retired": return "destructive";
        default: return "outline";
    }
  }

  return (
    <DashboardLayout role="admin">
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>A list of all staff members at the hospital.</CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search staff..." className="pl-8" />
            </div>
            <AddStaffModal onAddStaff={handleAddStaff}>
              <Button className="ml-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Staff Member
              </Button>
            </AddStaffModal>
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{member.id}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.department}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(member.status)} className={member.status === "On Leave" ? "bg-yellow-500 text-black" : ""}>
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.status === 'Retired' ? (
                        <div className="flex justify-end items-center gap-2">
                           <Button variant="ghost" size="sm" onClick={() => handleStatusChange(member.id, 'Active')}>
                                <Undo2 className="mr-2 h-4 w-4" /> Undo
                            </Button>
                           <DeleteStaffModal staffName={member.name} onDelete={() => handleDelete(member.id)} />
                       </div>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'Active')}>Mark as Active</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'On Leave')}>Mark as On Leave</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => handleStatusChange(member.id, 'Retired')}>Mark as Retired</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{staff.length}</strong> of <strong>{staff.length}</strong> staff members
          </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}

function AddStaffModal({ children, onAddStaff }: { children: React.ReactNode, onAddStaff: (staff: Omit<StaffMember, "id" | "avatar">) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'Cardiologist' as Role, status: 'Active' as StaffStatus });

  const handleRoleChange = (role: Role) => {
    setNewStaff({ ...newStaff, role: role });
  };

  const handleSubmit = () => {
    onAddStaff({
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      department: roleDepartmentMap[newStaff.role],
      status: newStaff.status,
    });
    setIsOpen(false);
    setNewStaff({ name: '', email: '', role: 'Cardiologist', status: 'Active' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>Fill in the details for the new staff member.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">Email</Label>
            <Input id="email" type="email" value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">Role</Label>
            <Select onValueChange={(value: Role) => handleRoleChange(value)} defaultValue={newStaff.role}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(roleDepartmentMap).map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">Department</Label>
            <Input id="department" value={roleDepartmentMap[newStaff.role]} readOnly className="col-span-3 bg-muted" />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">Status</Label>
            <Select onValueChange={(value: StaffStatus) => setNewStaff({...newStaff, status: value})} defaultValue={newStaff.status}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit}>Save Staff</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function DeleteStaffModal({ staffName, onDelete }: { staffName: string, onDelete: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action will permanently delete the record for <strong>{staffName}</strong>. This cannot be undone.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                    Yes, delete record
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

    
