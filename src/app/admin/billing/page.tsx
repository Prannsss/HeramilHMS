import { Search } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const bills = [
  {
    invoiceId: "INV-2023-001",
    patient: {
      name: "Amelia Johnson",
      email: "amelia.j@email.com",
      avatar: "https://placehold.co/32x32.png",
    },
    date: "2023-06-15",
    amount: "$250.00",
    status: "Paid",
  },
  {
    invoiceId: "INV-2023-002",
    patient: {
      name: "Benjamin Carter",
      email: "ben.c@email.com",
      avatar: "https://placehold.co/32x32.png",
    },
    date: "2023-06-18",
    amount: "$150.75",
    status: "Unpaid",
  },
  {
    invoiceId: "INV-2023-003",
    patient: {
      name: "Evelyn Foster",
      email: "evelyn.f@email.com",
      avatar: "https://placehold.co/32x32.png",
    },
    date: "2023-06-20",
    amount: "$300.00",
    status: "Paid",
  },
  {
    invoiceId: "INV-2023-004",
    patient: {
      name: "Daniel Evans",
      email: "daniel.e@email.com",
      avatar: "https://placehold.co/32x32.png",
    },
    date: "2023-06-22",
    amount: "$75.50",
    status: "Pending",
  },
  {
    invoiceId: "INV-2023-005",
    patient: {
      name: "Jackson Lee",
      email: "jackson.lee@email.com",
      avatar: "https://placehold.co/32x32.png",
    },
    date: "2023-06-25",
    amount: "$500.20",
    status: "Unpaid",
  },
];

export default function AdminBillingPage() {
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
    <DashboardLayout role="admin">
      <PageHeader title="Billing" description="Manage patient invoices and payments." />
      <Card>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => (
                <TableRow key={bill.invoiceId}>
                  <TableCell className="font-medium">{bill.invoiceId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={bill.patient.avatar} alt={bill.patient.name} data-ai-hint="patient avatar" />
                        <AvatarFallback>{bill.patient.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{bill.patient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {bill.patient.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{bill.date}</TableCell>
                  <TableCell>{bill.amount}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={getStatusVariant(bill.status)} className={bill.status === 'Pending' ? 'bg-yellow-500 text-black' : ''}>
                      {bill.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-5</strong> of <strong>{bills.length}</strong> invoices
            </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}
