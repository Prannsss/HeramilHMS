
'use client';

import { useState, useMemo } from "react";
import { PlusCircle, Search, Check, ChevronsUpDown } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";


const initialInventory = [
  {
    id: "INV001",
    name: "Surgical Masks",
    category: "PPE",
    stock: 850,
    maxStock: 1000,
  },
  {
    id: "INV002",
    name: "Amoxicillin 500mg",
    category: "Medication",
    stock: 120,
    maxStock: 200,
  },
  {
    id: "INV003",
    name: "IV Drip Bags",
    category: "Medical Supplies",
    stock: 45,
    maxStock: 150,
  },
  {
    id: "INV004",
    name: "Defibrillator",
    category: "Equipment",
    stock: 10,
    maxStock: 10,
  },
  {
    id: "INV005",
    name: "Hand Sanitizer (5L)",
    category: "Consumables",
    stock: 0,
    maxStock: 50,
  },
];

type InventoryItem = typeof initialInventory[0];

const getStatus = (stock: number, maxStock: number): { text: string; variant: "secondary" | "default" | "destructive", className: string } => {
    if (stock === 0) return { text: "Out of Stock", variant: "destructive", className: "" };
    if (stock < maxStock * 0.1) return { text: "Critical Low", variant: "destructive", className: "" };
    if (stock < maxStock * 0.3) return { text: "Low Stock", variant: "default", className: "bg-yellow-500 text-black" };
    return { text: "In Stock", variant: "secondary", className: "" };
};

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState(initialInventory);
  const [searchTerm, setSearchTerm] = useState("");

  const handleAddItem = (newItemData: Omit<InventoryItem, 'id'>) => {
    const newItem: InventoryItem = {
      ...newItemData,
      id: `INV${(inventory.length + 1).toString().padStart(3, '0')}`,
    };
    setInventory([...inventory, newItem]);
  };

  const handleAddStock = (itemId: string, quantity: number) => {
    setInventory(inventory.map(item => {
        if (item.id === itemId) {
            const newStock = Math.min(item.stock + quantity, item.maxStock);
            return { ...item, stock: newStock };
        }
        return item;
    }));
  };
  
  const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = useMemo(() => [...new Set(inventory.map(item => item.category))], [inventory]);

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
                <Input placeholder="Search inventory..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <AddItemModal onAddItem={handleAddItem} categories={categories}>
                <Button className="ml-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Item
                </Button>
            </AddItemModal>
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const status = getStatus(item.stock, item.maxStock);
                return (
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
                    <TableCell>
                      <Badge
                        variant={status.variant}
                        className={status.className}
                      >
                        {status.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <AddStockModal item={item} onAddStock={handleAddStock}>
                            <Button size="sm" variant="outline">Add Stock</Button>
                        </AddStockModal>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-{filteredInventory.length}</strong> of <strong>{filteredInventory.length}</strong> items
            </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}

function AddItemModal({ children, onAddItem, categories }: { children: React.ReactNode, onAddItem: (item: Omit<InventoryItem, 'id'>) => void, categories: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', stock: 0, maxStock: 100 });

  const handleSave = () => {
    onAddItem(newItem);
    setIsOpen(false);
    setIsConfirmOpen(false);
    setNewItem({ name: '', category: '', stock: 0, maxStock: 100 });
  }

  const handleSubmit = () => {
    const isNewCategory = !categories.find(c => c.toLowerCase() === newItem.category.toLowerCase());
    if (isNewCategory && newItem.category) {
        setIsConfirmOpen(true);
    } else {
        handleSave();
    }
  };
  
  return (
    <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>
                Fill in the details for the new item.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" value={newItem.name} onChange={(e) => setNewItem({...newItem, name: e.target.value})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <CategoryCombobox 
                    categories={categories}
                    value={newItem.category}
                    onChange={(value) => setNewItem({...newItem, category: value})}
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">Initial Stock</Label>
                <Input id="stock" type="number" value={newItem.stock} onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value, 10) || 0})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxStock" className="text-right">Max Stock</Label>
                <Input id="maxStock" type="number" value={newItem.maxStock} onChange={(e) => setNewItem({...newItem, maxStock: parseInt(e.target.value, 10) || 0})} className="col-span-3" />
            </div>
            </div>
            <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit}>Save Item</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Add New Category?</AlertDialogTitle>
                    <AlertDialogDescription>
                        The category "{newItem.category}" does not exist. Do you want to add it as a new category?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSave}>Yes, Add Category</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
}


function CategoryCombobox({ categories, value, onChange }: { categories: string[], value: string, onChange: (value: string) => void }) {
    const [open, setOpen] = useState(false);
  
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="col-span-3 justify-between"
          >
            {value ? value : "Select or type category..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput 
                placeholder="Search or create category..." 
                value={value}
                onValueChange={onChange}
            />
            <CommandList>
                <CommandEmpty>No category found. Type to create.</CommandEmpty>
                <CommandGroup>
                {categories.map((category) => (
                    <CommandItem
                        key={category}
                        value={category}
                        onSelect={(currentValue) => {
                            onChange(currentValue === value ? "" : currentValue);
                            setOpen(false);
                        }}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        value === category ? "opacity-100" : "opacity-0"
                        )}
                    />
                    {category}
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }


function AddStockModal({ children, item, onAddStock }: { children: React.ReactNode, item: InventoryItem, onAddStock: (itemId: string, quantity: number) => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const handleSubmit = () => {
        onAddStock(item.id, quantity);
        setIsOpen(false);
        setQuantity(1);
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Stock for {item.name}</DialogTitle>
                    <DialogDescription>
                        Current stock: {item.stock}/{item.maxStock}. Enter the quantity to add.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                            Quantity
                        </Label>
                        <Input 
                            id="quantity" 
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 0)}
                            className="col-span-3"
                            min="1"
                            max={item.maxStock - item.stock}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleSubmit}>Add to Stock</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
