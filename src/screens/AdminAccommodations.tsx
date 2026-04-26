
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_ACCOMMODATIONS = [
  { id: 'a1', name: 'Chapter Spitalfields', type: 'Studio/En-suite', price: '£350/pw', availability: 'High' },
  { id: 'a2', name: 'Scrape Shoreditch', type: 'Shared Flat', price: '£280/pw', availability: 'Medium' },
  { id: 'a3', name: 'Vita Student First Street', type: 'Studio', price: '£310/pw', availability: 'Low' },
];

export default function AdminAccommodations() {
  const [accs, setAccs] = useState(INITIAL_ACCOMMODATIONS);
  const [isOpen, setIsOpen] = useState(false);
  const [newAcc, setNewAcc] = useState({ name: '', type: '', price: '', availability: 'High' });

  const handleAddAcc = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `a${Date.now()}`;
    setAccs([...accs, { ...newAcc, id }]);
    setNewAcc({ name: '', type: '', price: '', availability: 'High' });
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setAccs(accs.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Accommodation Inventory</h1>
          <p className="text-muted-foreground">Manage student housing listings and live pricing.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Listing
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddAcc}>
              <DialogHeader>
                <DialogTitle>Add New Accommodation</DialogTitle>
                <DialogDescription>
                  Enter the details of the property you want to list.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Property Name</Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    value={newAcc.name}
                    onChange={(e) => setNewAcc({...newAcc, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">Room Type</Label>
                  <Input 
                    id="type" 
                    className="col-span-3"
                    value={newAcc.type}
                    onChange={(e) => setNewAcc({...newAcc, type: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Base Rate</Label>
                  <Input 
                    id="price" 
                    placeholder="e.g. £300/pw"
                    className="col-span-3"
                    value={newAcc.price}
                    onChange={(e) => setNewAcc({...newAcc, price: e.target.value})}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">List Property</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="px-6 text-center">Property Name</TableHead>
                <TableHead className="text-center">Room Types</TableHead>
                <TableHead className="text-center">Base Rate</TableHead>
                <TableHead className="text-center">Availability</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accs.map((acc) => (
                <TableRow key={acc.id} className="group">
                  <TableCell className="font-medium text-center py-4">{acc.name}</TableCell>
                  <TableCell className="text-sm text-center">{acc.type}</TableCell>
                  <TableCell className="font-mono text-sm text-center font-bold text-primary">{acc.price}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full ring-2 ring-offset-2 ring-offset-background transition-all",
                        acc.availability === 'High' ? "bg-green-500 ring-green-500/20" : 
                        acc.availability === 'Medium' ? "bg-amber-500 ring-amber-500/20" : "bg-red-500 ring-red-500/20"
                      )} />
                      <span className="text-xs font-medium">{acc.availability}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6 whitespace-nowrap">
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">Update Pricing</Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(acc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
