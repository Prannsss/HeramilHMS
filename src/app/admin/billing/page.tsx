
'use client';

import { useState } from "react";
import { Eye, Search, Trash2, Edit, MoreHorizontal } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";

const initialBills = [
  {
    invoiceId: "INV-2023-001",
    patient: {
      name: "Amelia Johnson",
      email: "amelia.j@email.com",
    },
    date: "2023-06-15",
    status: "Paid",
    items: [
        { description: "Consultation Fee", amount: "$150.00" },
        { description: "Medication - Lisinopril", amount: "$25.00" },
    ],
  },
  {
    invoiceId: "INV-2023-002",
    patient: {
      name: "Benjamin Carter",
      email: "ben.c@email.com",
    },
    date: "2023-06-18",
    status: "Unpaid",
    items: [{ description: "Lab Test - Blood Panel", amount: "$100.75" }],
  },
  {
    invoiceId: "INV-2023-003",
    patient: {
      name: "Evelyn Foster",
      email: "evelyn.f@email.com",
    },
    date: "2023-06-20",
    status: "Paid",
    items: [
      { description: "Emergency Room Visit", amount: "$200.00" },
      { description: "Medication", amount: "$100.00" },
    ],
  },
  {
    invoiceId: "INV-2023-004",
    patient: {
      name: "Daniel Evans",
      email: "daniel.e@email.com",
    },
    date: "2023-06-22",
    status: "Pending",
    items: [{ description: "Follow-up Visit", amount: "$75.50" }],
  },
  {
    invoiceId: "INV-2023-005",
    patient: {
      name: "Jackson Lee",
      email: "jackson.lee@email.com",
    },
    date: "2023-06-25",
    status: "Unpaid",
    items: [
      { description: "Surgical Procedure", amount: "$450.00" },
      { description: "Anesthesia", amount: "$50.20" },
    ],
  },
];

type BillStatus = "Paid" | "Unpaid" | "Pending";
type Bill = Omit<typeof initialBills[0], 'patient'> & { patient: { name: string, email: string }};

function BillTable({ bills, onStatusChange, onDelete }: { bills: Bill[], onStatusChange: (invoiceId: string, newStatus: BillStatus) => void, onDelete: (invoiceId: string) => void }) {
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
          <TableHead>Date</TableHead>
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
                {`$${bill.items.reduce((total, item) => total + parseFloat(item.amount.replace('$', '')), 0).toFixed(2)}`}
            </TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(bill.status)} className={bill.status === 'Pending' ? 'bg-yellow-500 text-black' : ''}>
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
                  <DropdownMenuItem onClick={() => onStatusChange(bill.invoiceId, 'Paid')}>
                      <Edit className="mr-2 h-4 w-4" /> Mark as Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(bill.invoiceId, 'Unpaid')}>
                      <Edit className="mr-2 h-4 w-4" /> Mark as Unpaid
                  </DropdownMenuItem>
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


export default function AdminBillingPage() {
  const [bills, setBills] = useState(initialBills);
  
  const handleStatusChange = (invoiceId: string, newStatus: BillStatus) => {
    setBills(bills.map(bill => bill.invoiceId === invoiceId ? {...bill, status: newStatus} : bill));
  }

  const handleDelete = (invoiceId: string) => {
    setBills(bills.filter(bill => bill.invoiceId !== invoiceId));
  }
  
  const paidBills = bills.filter(bill => bill.status === 'Paid');
  const unpaidBills = bills.filter(bill => bill.status === 'Unpaid');
  const pendingBills = bills.filter(bill => bill.status === 'Pending');

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
              <Input placeholder="Search invoices..." className="pl-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unpaid">
            <TabsList>
              <TabsTrigger value="unpaid">Unpaid ({unpaidBills.length})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingBills.length})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="unpaid">
              <BillTable bills={unpaidBills} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            </TabsContent>
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
                Showing <strong>1-{bills.length}</strong> of <strong>{bills.length}</strong> invoices
            </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}

function InvoiceModal({ bill }: { bill: Bill }) {
  const totalAmount = bill.items.reduce((total, item) => total + parseFloat(item.amount.replace('$', '')), 0);
  
  const handlePrint = () => {
    const totalAmount = bill.items.reduce((total, item) => total + parseFloat(item.amount.replace('$', '')), 0);

    const invoiceContent = `
                        Heramil Hospital

---------------------------------------------------------

Invoice ID: ${bill.invoiceId}
Patient: ${bill.patient.name}
Date: ${bill.date}
Status: ${bill.status}

---------------------------------------------------------

Items:
${bill.items.map(item => `${item.description.padEnd(30)} ${item.amount}`).join('\n')}

---------------------------------------------------------

Total Amount: $${totalAmount.toFixed(2)}

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
            <span className="text-muted-foreground">Date:</span>
            <span>{bill.date}</span>
        </div>
        <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span>{bill.status}</span>
        </div>
        <div className="border-t pt-4 mt-2">
            <h4 className="font-semibold mb-2">Invoice Items</h4>
            {bill.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                    <span>{item.description}</span>
                    <span>{item.amount}</span>
                </div>
            ))}
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-4 mt-2">
            <span>Total Amount</span>
            <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handlePrint}>Print Invoice</Button>
      </DialogFooter>
    </DialogContent>
  );
}
