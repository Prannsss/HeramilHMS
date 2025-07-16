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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const inventory = [
  {
    id: "INV001",
    name: "Surgical Masks",
    category: "PPE",
    stock: 850,
    maxStock: 1000,
    status: "In Stock",
  },
  {
    id: "INV002",
    name: "Amoxicillin 500mg",
    category: "Medication",
    stock: 120,
    maxStock: 200,
    status: "In Stock",
  },
  {
    id: "INV003",
    name: "IV Drip Bags",
    category: "Medical Supplies",
    stock: 45,
    maxStock: 150,
    status: "Low Stock",
  },
  {
    id: "INV004",
    name: "Defibrillator",
    category: "Equipment",
    stock: 10,
    maxStock: 10,
    status: "In Stock",
  },
  {
    id: "INV005",
    name: "Hand Sanitizer (5L)",
    category: "Consumables",
    stock: 0,
    maxStock: 50,
    status: "Out of Stock",
  },
];

export default function AdminInventoryPage() {
  return (
    <DashboardLayout role="admin">
      <PageHeader
        title="Inventory"
        description="Monitor and manage hospital inventory."
      />
      <Card>
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
          <CardDescription>
            An overview of all items in the hospital inventory.
          </CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search inventory..." className="pl-8" />
            </div>
            <Button className="ml-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Item ID</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={(item.stock / item.maxStock) * 100} className="w-24 h-2" />
                      <span>{item.stock} / {item.maxStock}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={
                        item.status === "In Stock"
                          ? "secondary"
                          : item.status === "Low Stock"
                          ? "default" // A less alarming color
                          : "destructive"
                      }
                      className={item.status === 'Low Stock' ? 'bg-yellow-500 text-black' : ''}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-5</strong> of <strong>{inventory.length}</strong> items
            </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}
