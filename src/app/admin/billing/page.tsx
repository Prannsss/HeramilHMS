
'use client';

import { useState, useEffect } from "react";
import { Eye, Search, Trash2, Edit, MoreHorizontal, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

type BillStatus = "Paid" | "Unpaid" | "Pending";

interface BillItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: string;
}

interface Bill {
  invoiceId: string;
  bill_id: number;
  patient: {
    name: string;
    email: string;
  };
  date: string;
  dateOfAdmission: string;
  status: BillStatus;
  total_amount: number;
  items: BillItem[];
}

function BillTable({ 
  bills, 
  onStatusChange, 
  onDelete 
}: { 
  bills: Bill[];
  onStatusChange: (invoiceId: string, newStatus: BillStatus) => void;
  onDelete: (invoiceId: string) => void;
}) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "secondary";
      case "Unpaid":
        return "destructive";
      case "Pending":
        return "default";
      default:
        return "outline";
    }
  };
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice ID</TableHead>
          <TableHead>Patient</TableHead>
          <TableHead>Invoice Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bills.map((bill) => (
          <TableRow key={bill.invoiceId}>
            <TableCell className="font-medium">{bill.invoiceId}</TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{bill.patient.name}</div>
                <div className="text-sm text-muted-foreground">
                  {bill.patient.email}
                </div>
              </div>
            </TableCell>
            <TableCell>{bill.date}</TableCell>
            <TableCell>
                ₱{bill.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </TableCell>
            <TableCell>
              <Badge 
                variant={getStatusVariant(bill.status)} 
                className={
                  bill.status === 'Pending' ? 'bg-yellow-500 text-black' : 
                  bill.status === 'Paid' ? 'bg-green-500 text-white' : ''
                }
              >
                {bill.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <Dialog>
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Invoice
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <InvoiceModal bill={bill} />
                  </Dialog>
                  {bill.status === 'Pending' && (
                    <DropdownMenuItem onClick={() => onStatusChange(bill.invoiceId, 'Paid')}>
                        <Edit className="mr-2 h-4 w-4" /> Mark as Paid
                    </DropdownMenuItem>
                  )}
                  {bill.status === 'Paid' && (
                    <DropdownMenuItem onClick={() => onStatusChange(bill.invoiceId, 'Pending')}>
                        <Edit className="mr-2 h-4 w-4" /> Mark as Pending
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="text-red-500" onClick={() => onDelete(bill.invoiceId)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminBillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/billing.php');
      const data = await response.json();
      
      if (data.success) {
        setBills(data.data);
      } else {
        setError(data.error || 'Failed to fetch bills');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching bills:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleStatusChange = async (invoiceId: string, newStatus: BillStatus) => {
    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/billing.php', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          status: newStatus
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setBills(bills.map((bill: Bill) => 
          bill.invoiceId === invoiceId ? {...bill, status: newStatus} : bill
        ));
      } else {
        setError(data.error || 'Failed to update bill status');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error updating bill status:', err);
    }
  };

  const handleDelete = async (invoiceId: string) => {
    try {
      const response = await fetch('http://localhost/HeramilHMS/public/backend/api/billing.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await response.json();
      
      if (data.success) {
        setBills(bills.filter((bill: Bill) => bill.invoiceId !== invoiceId));
      } else {
        setError(data.error || 'Failed to delete bill');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error deleting bill:', err);
    }
  };

  const filteredBills = bills.filter((bill: Bill) =>
    bill.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.invoiceId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const paidBills = filteredBills.filter((bill: Bill) => bill.status === 'Paid');
  const pendingBills = filteredBills.filter((bill: Bill) => bill.status === 'Pending');

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Patient Invoices</CardTitle>
            <CardDescription>Loading billing records...</CardDescription>
          </CardHeader>
          <CardContent>
            <LoadingSkeleton />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin">
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Patient Invoices</CardTitle>
            <CardDescription>Error loading billing records</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={fetchBills} 
              className="mt-4"
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Patient Invoices</CardTitle>
          <CardDescription>
            An overview of all patient billing records.
          </CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search invoices..." 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">Pending ({pendingBills.length})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <BillTable bills={pendingBills} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            </TabsContent>
            <TabsContent value="paid">
              <BillTable bills={paidBills} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{filteredBills.length}</strong> of <strong>{bills.length}</strong> invoices
            </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}

function InvoiceModal({ bill }: { bill: Bill }) {
  const handlePrint = () => {
    const invoiceContent = `
                        Heramil Hospital

---------------------------------------------------------

Invoice ID: ${bill.invoiceId}
Patient: ${bill.patient.name}
Date of Admission: ${bill.dateOfAdmission}
Invoice Date: ${bill.date}
Status: ${bill.status}

---------------------------------------------------------

Items:
${bill.items.map(item => 
  `${item.description.padEnd(25)} Qty: ${item.quantity} @ ₱${item.unit_price.toFixed(2)} = ${item.amount}`
).join('\n')}

---------------------------------------------------------

Total Amount: ₱${bill.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

`;
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${bill.invoiceId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Invoice Details</DialogTitle>
        <DialogDescription>
          Invoice for {bill.patient.name} - {bill.invoiceId}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="flex justify-between">
            <span className="text-muted-foreground">Patient:</span>
            <span>{bill.patient.name}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-muted-foreground">Date of Admission:</span>
            <span>{bill.dateOfAdmission}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice Date:</span>
            <span>{bill.date}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span>{bill.status}</span>
        </div>
        <div className="border-t pt-4 mt-2">
            <h4 className="font-semibold mb-2">Invoice Items</h4>
            {bill.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm mb-1">
                    <span>{item.description} (Qty: {item.quantity})</span>
                    <span>{item.amount}</span>
                </div>
            ))}
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-4 mt-2">
            <span>Total Amount</span>
            <span>₱{bill.total_amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handlePrint}>Print Invoice</Button>
      </DialogFooter>
    </DialogContent>
  );
}
