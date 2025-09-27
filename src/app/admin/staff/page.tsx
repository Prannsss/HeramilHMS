
'use client';

import { useState, useEffect } from "react";
import { PlusCircle, Search, MoreHorizontal, Trash2, Undo2, KeyRound, Eye, EyeOff, Pencil, Calendar } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { useUserStore } from "@/hooks/use-user-store";
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

type Department = {
    id: string;
    name: string;
    description?: string;
    roles?: string;
    status: "Active" | "Inactive";
    created_at?: string;
    updated_at?: string;
};

type StaffMember = {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    status: StaffStatus;
    created_at?: string;
    updated_at?: string;
};

// API functions
const fetchDepartments = async (): Promise<Department[]> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/departments.php');
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error('Failed to fetch departments data');
    }
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
};

const addDepartment = async (departmentData: Omit<Department, 'id' | 'created_at' | 'updated_at'>): Promise<Department> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/departments.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(departmentData),
    });
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to add department');
    }
  } catch (error) {
    console.error('Error adding department:', error);
    throw error;
  }
};

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

const updateStaffMember = async (staffId: string, staffData: Partial<StaffMember>): Promise<StaffMember> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doctors.php', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: staffId, ...staffData }),
    });
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to update staff member');
    }
  } catch (error) {
    console.error('Error updating staff:', error);
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
    console.log('Sending delete request for staff ID:', staffId);
    
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/doctors.php', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: staffId }),
    });
    
    console.log('Delete response status:', response.status);
    
    const responseText = await response.text();
    console.log('Delete response text:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse delete response as JSON:', parseError);
      throw new Error('Invalid response from server');
    }
    
    console.log('Parsed delete response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete staff member');
    }
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw error;
  }
};

const setDoctorPassword = async (doctorId: string, password: string): Promise<void> => {
  try {
    console.log('Setting password for doctor ID:', doctorId, 'Type:', typeof doctorId, 'Password length:', password.length);
    
    const requestBody = { 
      id: doctorId, // Send as string first
      password: password 
    };
    
    console.log('Request body:', requestBody);
    
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/set-passwordforDoctor.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response from server');
    }
    
    console.log('Parsed API response:', data);
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to set password');
    }
  } catch (error) {
    console.error('Error setting password:', error);
    throw error;
  }
};

function StaffTable({
  staff,
  onStatusChange,
  onDelete,
  onSetPassword,
  onEditStaff,
  departments
}: {
  staff: StaffMember[],
  onStatusChange: (staffId: string, newStatus: StaffStatus) => void,
  onDelete: (staffId: string) => void,
  onSetPassword: (staffId: string, password: string) => void,
  onEditStaff: (staffId: string, updatedStaffData: Partial<StaffMember>) => void,
  departments: Department[]
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
                    <EditStaffModal 
                      staff={member}
                      onEditStaff={onEditStaff}
                      departments={departments}
                    >
                      <DropdownMenuItem onSelect={(e) => {
                        e.preventDefault();
                      }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Staff
                      </DropdownMenuItem>
                    </EditStaffModal>
                    <DropdownMenuSeparator />
                    <SetPasswordModal 
                      doctorId={member.id} 
                      doctorName={member.name} 
                      onSetPassword={onSetPassword}
                    >
                      <DropdownMenuItem onSelect={(e) => {
                        e.preventDefault();
                        console.log('Setting password for member:', member);
                      }}>
                        <KeyRound className="mr-2 h-4 w-4" />
                        Set Password
                      </DropdownMenuItem>
                    </SetPasswordModal>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onStatusChange(member.id, 'Active')}>
                      <Undo2 className="mr-2 h-4 w-4" />
                      Mark as Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onStatusChange(member.id, 'On Leave')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Mark as On Leave
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onStatusChange(member.id, 'Retired')}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Mark as Retired
                    </DropdownMenuItem>
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { refreshUser } = useUserStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [staffData, departmentsData] = await Promise.all([
        fetchStaff(),
        fetchDepartments()
      ]);
      setStaff(staffData);
      setDepartments(departmentsData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async (newStaffMember: Omit<StaffMember, "id" | "created_at" | "updated_at">) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const addedStaff = await addStaffMember(newStaffMember);
      setStaff(prevStaff => [addedStaff, ...prevStaff]);
    } catch (err: any) {
      setError(err.message || 'Failed to add staff member');
    }
  };

  const handleEditStaff = async (staffId: string, updatedStaffData: Partial<StaffMember>) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const updatedStaff = await updateStaffMember(staffId, updatedStaffData);
      setStaff(prevStaff => 
        prevStaff.map(member => 
          member.id === staffId ? { ...member, ...updatedStaff } : member
        )
      );
      
      // Refresh user data in case this update affects the currently logged-in doctor
      await refreshUser();
      
      setSuccessMessage(`Staff member has been updated successfully.`);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to update staff member');
    }
  };

  const handleAddDepartment = async (newDepartment: Omit<Department, "id" | "created_at" | "updated_at">) => {
    try {
      setError(null);
      setSuccessMessage(null);
      const addedDepartment = await addDepartment(newDepartment);
      setDepartments(prevDepartments => [addedDepartment, ...prevDepartments]);
      setSuccessMessage(`Department "${addedDepartment.name}" has been added successfully.`);
      
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to add department');
    }
  };

  const handleStatusChange = async (staffId: string, newStatus: StaffStatus) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await updateStaffStatus(staffId, newStatus);
      setStaff(staff.map(member => member.id === staffId ? { ...member, status: newStatus } : member));
    } catch (err: any) {
      setError(err.message || 'Failed to update staff status');
    }
  };
  
  const handleDelete = async (staffId: string) => {
    try {
      setError(null);
      setSuccessMessage(null);
      
      console.log('Attempting to delete staff with ID:', staffId);
      
      await deleteStaffMember(staffId);
      
      // Remove from local state
      setStaff(staff.filter(member => member.id !== staffId));
      
      // Find staff member name for success message
      const staffMember = staff.find(member => member.id === staffId);
      const staffName = staffMember ? staffMember.name : 'Staff member';
      
      setSuccessMessage(`${staffName} has been permanently deleted from the database.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      
    } catch (err: any) {
      console.error('Error deleting staff:', err);
      setError(err.message || 'Failed to delete staff member');
    }
  };

  const handleSetPassword = async (staffId: string, password: string) => {
    try {
      setError(null);
      setSuccessMessage(null);
      await setDoctorPassword(staffId, password);
      
      // Find staff member name for success message
      const staffMember = staff.find(member => member.id === staffId);
      const staffName = staffMember ? staffMember.name : 'Doctor';
      
      setSuccessMessage(`Password successfully set for ${staffName}. They can now log in with their email and password.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to set password');
      throw err; // Re-throw to let the modal handle it
    }
  };
  
  const filteredStaff = staff.filter(member => member.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Handle null/undefined status by defaulting to 'Active'
  const activeStaff = filteredStaff.filter(s => s.status === 'Active' || s.status === null || s.status === undefined);
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
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}
          <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search staff..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="ml-auto flex gap-2">
              <AddDepartmentModal onAddDepartment={handleAddDepartment}>
                <Button variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Department
                </Button>
              </AddDepartmentModal>
              <AddStaffModal onAddStaff={handleAddStaff} departments={departments}>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Staff Member
                </Button>
              </AddStaffModal>
            </div>
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
                <StaffTable staff={activeStaff} onStatusChange={handleStatusChange} onDelete={handleDelete} onSetPassword={handleSetPassword} onEditStaff={handleEditStaff} departments={departments} />
              </TabsContent>
              <TabsContent value="on-leave">
                <StaffTable staff={onLeaveStaff} onStatusChange={handleStatusChange} onDelete={handleDelete} onSetPassword={handleSetPassword} onEditStaff={handleEditStaff} departments={departments} />
              </TabsContent>
              <TabsContent value="retired">
                <StaffTable staff={retiredStaff} onStatusChange={handleStatusChange} onDelete={handleDelete} onSetPassword={handleSetPassword} onEditStaff={handleEditStaff} departments={departments} />
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

function AddStaffModal({ 
  children, 
  onAddStaff, 
  departments 
}: { 
  children: React.ReactNode, 
  onAddStaff: (staff: Omit<StaffMember, "id" | "created_at" | "updated_at">) => void,
  departments: Department[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: '', department: '', status: 'Active' as StaffStatus });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available roles from departments
  const availableRoles = departments
    .filter(dept => dept.status === 'Active' && dept.roles)
    .map(dept => dept.roles!)
    .filter((role, index, self) => self.indexOf(role) === index) // Remove duplicates
    .sort();

  // Set default values when modal opens and departments are available
  useEffect(() => {
    if (departments.length > 0 && availableRoles.length > 0) {
      if (!newStaff.role) {
        const defaultRole = availableRoles[0];
        const defaultDepartment = departments.find(dept => dept.roles === defaultRole && dept.status === 'Active');
        setNewStaff(prev => ({ 
          ...prev, 
          role: defaultRole,
          department: defaultDepartment?.name || ''
        }));
      }
    }
  }, [departments, availableRoles, newStaff.role]);

  // Helper function to find department for a given role
  const getDepartmentForRole = (role: string): Department | undefined => {
    return departments.find(dept => 
      dept.status === 'Active' && dept.roles === role
    );
  };

  const handleRoleChange = (role: string) => {
    // Auto-select department based on role
    const matchingDepartment = getDepartmentForRole(role);
    
    setNewStaff({ 
      ...newStaff, 
      role: role,
      department: matchingDepartment?.name || ''
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onAddStaff({
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        department: newStaff.department,
        status: newStaff.status,
      });
      setIsOpen(false);
      setNewStaff({ name: '', email: '', role: '', department: '', status: 'Active' });
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
        setNewStaff({ name: '', email: '', role: '', department: '', status: 'Active' });
      } else if (open && departments.length > 0 && availableRoles.length > 0) {
        // Set default values when opening modal
        const defaultRole = availableRoles[0];
        const defaultDepartment = departments.find(dept => dept.roles === defaultRole && dept.status === 'Active');
        if (!newStaff.role) {
          setNewStaff(prev => ({ 
            ...prev, 
            role: defaultRole,
            department: defaultDepartment?.name || ''
          }));
        }
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
            <Select onValueChange={(value: string) => handleRoleChange(value)} value={newStaff.role}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={availableRoles.length === 0 ? "Loading roles..." : "Select a role"} />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.length === 0 ? (
                  <SelectItem value="loading" disabled>Loading roles...</SelectItem>
                ) : (
                  availableRoles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="department" className="text-right">Department</Label>
            <Select onValueChange={(value) => setNewStaff({...newStaff, department: value})} value={newStaff.department}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={departments.length === 0 ? "Loading departments..." : "Select a department"} />
              </SelectTrigger>
              <SelectContent>
                {departments.length === 0 ? (
                  <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                ) : (
                  departments.filter(dept => dept.status === 'Active').map(department => (
                    <SelectItem key={department.id} value={department.name}>{department.name}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
          <Button onClick={handleSubmit} disabled={isSubmitting || !newStaff.name.trim() || !newStaff.email.trim() || !newStaff.department || !newStaff.role}>
            {isSubmitting ? 'Adding...' : 'Save Staff'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditStaffModal({ 
  children, 
  staff,
  onEditStaff, 
  departments 
}: { 
  children: React.ReactNode,
  staff: StaffMember,
  onEditStaff: (staffId: string, updatedStaff: Partial<StaffMember>) => void,
  departments: Department[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editStaff, setEditStaff] = useState({ 
    name: staff.name, 
    email: staff.email, 
    role: staff.role, 
    department: staff.department 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when staff prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setEditStaff({
        name: staff.name,
        email: staff.email,
        role: staff.role,
        department: staff.department
      });
    }
  }, [isOpen, staff]);

  // Get available roles from departments
  const availableRoles = departments
    .filter(dept => dept.status === 'Active' && dept.roles)
    .map(dept => dept.roles!)
    .filter((role, index, self) => self.indexOf(role) === index) // Remove duplicates
    .sort();

  // Helper function to find department for a given role
  const getDepartmentForRole = (role: string): Department | undefined => {
    return departments.find(dept => 
      dept.status === 'Active' && dept.roles === role
    );
  };

  const handleRoleChange = (role: string) => {
    // Auto-select department based on role
    const matchingDepartment = getDepartmentForRole(role);
    
    setEditStaff({ 
      ...editStaff, 
      role: role,
      department: matchingDepartment?.name || editStaff.department
    });
  };

  const handleSubmit = async () => {
    if (!editStaff.name.trim() || !editStaff.email.trim() || !editStaff.department || !editStaff.role) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onEditStaff(staff.id, editStaff);
      setIsOpen(false);
    } catch (error) {
      console.error('Error editing staff:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            Update the details for {staff.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Full Name</Label>
            <Input
              id="edit-name"
              value={editStaff.name}
              onChange={(e) => setEditStaff({ ...editStaff, name: e.target.value })}
              placeholder="Enter full name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              value={editStaff.email}
              onChange={(e) => setEditStaff({ ...editStaff, email: e.target.value })}
              placeholder="Enter email address"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-role">Role</Label>
            <Select value={editStaff.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-department">Department</Label>
            <Select value={editStaff.department} onValueChange={(value) => setEditStaff({ ...editStaff, department: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments
                  .filter(dept => dept.status === 'Active')
                  .map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting || !editStaff.name.trim() || !editStaff.email.trim() || !editStaff.department || !editStaff.role}>
            {isSubmitting ? 'Updating...' : 'Update Staff'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SetPasswordModal({ 
  children, 
  doctorId, 
  doctorName, 
  onSetPassword 
}: { 
  children: React.ReactNode, 
  doctorId: string, 
  doctorName: string, 
  onSetPassword: (doctorId: string, password: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');
    
    console.log('handleSubmit called with:', { doctorId, password, confirmPassword });
    
    // Validation
    if (!doctorId || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!doctorId.trim()) {
      setError('Invalid doctor ID');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSetPassword(doctorId, password);
      setIsOpen(false);
      setPassword('');
      setConfirmPassword('');
      setError('');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Error is already handled in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setPassword('');
      setConfirmPassword('');
      setError('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Password for {doctorName}</DialogTitle>
          <DialogDescription>
            Set a login password for this doctor. They will be able to use their email and this password to access their dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">Password</Label>
            <div className="relative col-span-3">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="pr-10"
                placeholder="Enter password (min 6 characters)"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 hover:text-black"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirmPassword" className="text-right">Confirm Password</Label>
            <div className="relative col-span-3">
              <Input 
                id="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                className="pr-10"
                placeholder="Confirm password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100 hover:text-black"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Setting Password...' : 'Set Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function AddDepartmentModal({ children, onAddDepartment }: { children: React.ReactNode, onAddDepartment: (department: Omit<Department, "id" | "created_at" | "updated_at">) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '', roles: '', status: 'Active' as 'Active' | 'Inactive' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onAddDepartment({
        name: newDepartment.name.trim(),
        description: newDepartment.description.trim(),
        roles: newDepartment.roles.trim(),
        status: newDepartment.status,
      });
      setIsOpen(false);
      setNewDepartment({ name: '', description: '', roles: '', status: 'Active' });
    } catch (error) {
      console.error('Error adding department:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setNewDepartment({ name: '', description: '', roles: '', status: 'Active' });
      }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Department</DialogTitle>
          <DialogDescription>Create a new department for the hospital.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dept-name" className="text-right">Name</Label>
            <Input 
              id="dept-name" 
              value={newDepartment.name} 
              onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })} 
              className="col-span-3"
              placeholder="e.g., Emergency Medicine"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dept-description" className="text-right">Description</Label>
            <Input 
              id="dept-description" 
              value={newDepartment.description} 
              onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })} 
              className="col-span-3"
              placeholder="Brief description of the department"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dept-roles" className="text-right">Role</Label>
            <Input 
              id="dept-roles" 
              value={newDepartment.roles} 
              onChange={(e) => setNewDepartment({ ...newDepartment, roles: e.target.value })} 
              className="col-span-3"
              placeholder="e.g., Emergency Physician, Radiologist"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="dept-status" className="text-right">Status</Label>
            <Select onValueChange={(value: 'Active' | 'Inactive') => setNewDepartment({...newDepartment, status: value})} defaultValue={newDepartment.status}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !newDepartment.name.trim() || !newDepartment.roles.trim()}
          >
            {isSubmitting ? 'Adding...' : 'Add Department'}
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
                <AlertDialogTitle>Permanently Delete Staff Member?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action will permanently delete <strong>{staffName}</strong> from the database, including their user account and login credentials. This cannot be undone.
                    <br /><br />
                    <strong>Note:</strong> Staff members with associated medical records cannot be deleted for data integrity.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                    Yes, permanently delete
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

    
