
'use client';

import { useState, useMemo, useEffect } from "react";
import { PlusCircle, Search, Check, ChevronsUpDown, Trash2 } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type InventoryItem = {
    id: string;
    name: string;
    category: string;
    stock: number;
    maxStock: number;
    unit_price?: number;
    created_at?: string;
    updated_at?: string;
};

// API functions
const fetchInventory = async (): Promise<InventoryItem[]> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/inventory.php');
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error('Failed to fetch inventory data');
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
    throw error;
  }
};

const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>): Promise<InventoryItem> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/inventory.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    const data = await response.json();
    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || 'Failed to add inventory item');
    }
  } catch (error) {
    console.error('Error adding inventory item:', error);
    throw error;
  }
};

const addStockToItem = async (itemId: string, quantity: number): Promise<number> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/inventory.php', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: itemId, addStock: quantity }),
    });
    const data = await response.json();
    if (data.success) {
      return data.new_stock;
    } else {
      throw new Error(data.error || 'Failed to add stock');
    }
  } catch (error) {
    console.error('Error adding stock:', error);
    throw error;
  }
};

const deleteInventoryItem = async (itemId: string): Promise<void> => {
  try {
    const response = await fetch('http://localhost/HeramilHMS/public/backend/api/inventory.php', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: itemId }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete inventory item');
    }
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    throw error;
  }
};

const getStatus = (stock: number, maxStock: number): { text: string; variant: "secondary" | "default" | "destructive", className: string } => {
    if (stock === 0) return { text: "Out of Stock", variant: "destructive", className: "" };
    if (stock < maxStock * 0.1) return { text: "Critical Low", variant: "destructive", className: "" };
    if (stock < maxStock * 0.3) return { text: "Low Stock", variant: "default", className: "bg-yellow-500 text-black" };
    return { text: "In Stock", variant: "secondary", className: "" };
};

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const inventoryData = await fetchInventory();
      setInventory(inventoryData);
    } catch (err) {
      setError('Failed to load inventory data. Please try again.');
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (newItemData: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      const addedItem = await addInventoryItem(newItemData);
      setInventory(prevInventory => [addedItem, ...prevInventory]);
    } catch (err: any) {
      setError(err.message || 'Failed to add inventory item');
    }
  };

  const handleAddStock = async (itemId: string, quantity: number) => {
    try {
      setError(null);
      const newStock = await addStockToItem(itemId, quantity);
      setInventory(inventory.map(item => {
        if (item.id === itemId) {
          return { ...item, stock: newStock };
        }
        return item;
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to add stock');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      setError(null);
      await deleteInventoryItem(itemId);
      setInventory(inventory.filter(item => item.id !== itemId));
    } catch (err: any) {
      setError(err.message || 'Failed to delete inventory item');
    }
  };
  
  const filteredInventory = inventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const categories = useMemo(() => [...new Set(inventory.map(item => item.category))], [inventory]);

  return (
    <DashboardLayout role="admin">
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
          <CardDescription>
            An overview of all items in the hospital inventory.
          </CardDescription>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
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
          {loading ? (
            <div className="space-y-4">
              <div className="space-y-2">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          ) : (
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
                          <div className="flex justify-end items-center gap-2">
                              <AddStockModal item={item} onAddStock={handleAddStock}>
                                  <Button size="sm" variant="outline">Add Stock</Button>
                              </AddStockModal>
                              <DeleteItemModal itemName={item.name} onDelete={() => handleDeleteItem(item.id)} />
                          </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>1-{filteredInventory.length}</strong> of <strong>{inventory.length}</strong> items
            </div>
        </CardFooter>
      </Card>
    </DashboardLayout>
  );
}

function AddItemModal({ children, onAddItem, categories }: { children: React.ReactNode, onAddItem: (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => void, categories: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', stock: 0, maxStock: 100, unit_price: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await onAddItem(newItem);
      setIsOpen(false);
      setIsConfirmOpen(false);
      setNewItem({ name: '', category: '', stock: 0, maxStock: 100, unit_price: 0 });
    } catch (error) {
      console.error('Error adding item:', error);
    } finally {
      setIsSubmitting(false);
    }
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
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setNewItem({ name: '', category: '', stock: 0, maxStock: 100, unit_price: 0 });
          }
        }}>
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
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit_price" className="text-right">Unit Price (₱)</Label>
                <Input id="unit_price" type="number" step="0.01" value={newItem.unit_price} onChange={(e) => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})} className="col-span-3" />
            </div>
            </div>
            <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Save Item'}
            </Button>
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
                    <AlertDialogAction onClick={handleSave} disabled={isSubmitting}>
                      {isSubmitting ? 'Adding...' : 'Yes, Add Category'}
                    </AlertDialogAction>
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
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            await onAddStock(item.id, quantity);
            setIsOpen(false);
            setQuantity(1);
        } catch (error) {
            console.error('Error adding stock:', error);
        } finally {
            setIsSubmitting(false);
        }
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
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add to Stock'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteItemModal({ itemName, onDelete }: { itemName: string, onDelete: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" aria-label={`Delete ${itemName}`}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the item <strong>{itemName}</strong> from the inventory.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onDelete} className="bg-destructive hover:bg-destructive/90">
                        Yes, delete item
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
