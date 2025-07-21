
'use client';

import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";


type StaffStatus = "Active" | "On Leave" | "Retired";
type Role = "General Medicine" | "Cardiologist" | "Pediatrician" | "Radiologist" | "Registered Nurse" | "Administrator";

const roleDepartmentMap: Record<Role, string> = {
    "General Medicine": "General Medicine",
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
    role: Role;
    department: string;
    status: StaffStatus;
    created_at?: string;
    updated_at?: string;
};

// API functions
const fetchStaff = async (): Promise<StaffMember[]> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doctors.php');
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error('Failed to fetch staff data');
    }
  } catch (error) {
    console.error('Error fetching staff:', error);
    throw error;
  }
};

const addStaffMember = async (staffData: Omit<StaffMember, 'id' | 'created_at' | 'updated_at'>): Promise<StaffMember> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doctors.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(staffData),
    });
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to add staff member');
    }
  } catch (error) {
    console.error('Error adding staff:', error);
    throw error;
  }
};

const updateStaffStatus = async (staffId: string, status: StaffStatus): Promise<void> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doctors.php', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: staffId, status }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to update staff status');
    }
  } catch (error) {
    console.error('Error updating staff status:', error);
    throw error;
  }
};

const deleteStaffMember = async (staffId: string): Promise<void> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doctors.php', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: staffId }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete staff member');
    }
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }
};

function StaffTable({
  staff,
  onStatusChange,
  onDelete
}: {
  staff: StaffMember[],
  onStatusChange: (staffId: string, newStatus: StaffStatus) => void,
  onDelete: (staffId: string) => void
}) {
    const getStatusBadge = (status: StaffStatus) => {
    switch (status) {
        case "Active": return "secondary";
        case "On Leave": return "default";
        case "Retired": return "destructive";
        default: return "outline";
    }
  }

  return (
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
                      <Button variant="ghost" size="icon" onClick={() => onStatusChange(member.id, 'Active')} className="h-8 w-8">
                          <Undo2 className="h-4 w-4" />
                          <span className="sr-only">Undo</span>
                      </Button>
                      <DeleteStaffModal staffName={member.name} onDelete={() => onDelete(member.id)} />
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
                    <DropdownMenuItem onClick={() => onStatusChange(member.id, 'Active')}>Mark as Active</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(member.id, 'On Leave')}>Mark as On Leave</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onStatusChange(member.id, 'Retired')}>Mark as Retired</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const staffData = await fetchStaff();
      setStaff(staffData);
    } catch (err) {
      setError('Failed to load staff data. Please try again.');
      console.error('Error loading staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (newStaffMember: Omit<StaffMember, "id" | "created_at" | "updated_at">) => {
    try {
      setError(null);
      const addedStaff = await addStaffMember(newStaffMember);
      setStaff(prevStaff => [addedStaff, ...prevStaff]);
    } catch (err: any) {
      setError(err.message || 'Failed to add staff member');
    }
  };

  const handleStatusChange = async (staffId: string, newStatus: StaffStatus) => {
    try {
      setError(null);
      await updateStaffStatus(staffId, newStatus);
      setStaff(staff.map(member => member.id === staffId ? { ...member, status: newStatus } : member));
    } catch (err: any) {
      setError(err.message || 'Failed to update staff status');
    }
  };
  
  const handleDelete = async (staffId: string) => {
    try {
      setError(null);
      await deleteStaffMember(staffId);
      setStaff(staff.filter(member => member.id !== staffId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete staff member');
    }
  };
  
  const filteredStaff = staff.filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const activeStaff = filteredStaff.filter(s => s.status === 'Active');
  const onLeaveStaff = filteredStaff.filter(s => s.status === 'On Leave');
  const retiredStaff = filteredStaff.filter(s => s.status === 'Retired');

  return (
    <DashboardLayout role="admin">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>A list of all staff members at the hospital.</CardDescription>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search staff..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
          {loading ? (
            <div className="space-y-4">
              <div className="flex space-x-1">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Active ({activeStaff.length})</TabsTrigger>
                <TabsTrigger value="on-leave">On Leave ({onLeaveStaff.length})</TabsTrigger>
                <TabsTrigger value="retired">Retired ({retiredStaff.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <StaffTable staff={activeStaff} onStatusChange={handleStatusChange} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value="on-leave">
                <StaffTable staff={onLeaveStaff} onStatusChange={handleStatusChange} onDelete={handleDelete} />
              </TabsContent>
              <TabsContent value="retired">
                <StaffTable staff={retiredStaff} onStatusChange={handleStatusChange} onDelete={handleDelete} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter>
          <div className="text-xs text-muted-foreground">
            Showing <strong>1-{filteredStaff.length}</strong> of <strong>{staff.length}</strong> staff members
          </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}

function AddStaffModal({ children, onAddStaff }: { children: React.ReactNode, onAddStaff: (staff: Omit<StaffMember, "id" | "created_at" | "updated_at">) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'General Medicine' as Role, status: 'Active' as StaffStatus });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = (role: Role) => {
    setNewStaff({ ...newStaff, role: role });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onAddStaff({
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        department: roleDepartmentMap[newStaff.role],
        status: newStaff.status,
      });
      setIsOpen(false);
      setNewStaff({ name: '', email: '', role: 'General Medicine', status: 'Active' });
    } catch (error) {
      console.error('Error adding staff:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setNewStaff({ name: '', email: '', role: 'General Medicine', status: 'Active' });
      }
    }}>
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Save Staff'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function DeleteStaffModal({ staffName, onDelete }: { staffName: string, onDelete: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /><span className="sr-only">Delete</span></Button>
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

    
