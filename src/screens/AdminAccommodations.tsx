
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { swal } from '@/lib/swal';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface AccRow { id: string; name: string; type: string; price: string; city: string }

const accSchema = z.object({
  name: z.string().trim().min(1, 'Property name is required'),
  city: z.string().trim().min(1, 'City is required'),
  type: z.string().trim().min(1, 'Room type is required'),
  price: z.string().trim().min(1, 'Base rate is required'),
});
type AccValues = z.infer<typeof accSchema>;

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="col-span-3 col-start-2 px-1 text-xs font-medium text-red-600">{msg}</p> : null;
}

export default function AdminAccommodations() {
  const [accs, setAccs] = useState<AccRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AccValues>({
    resolver: zodResolver(accSchema),
    defaultValues: { name: '', city: '', type: '', price: '' },
  });

  const load = async () => {
    try {
      const list = await api.accommodations.list();
      setAccs(list.map((a) => ({ id: a.id, name: a.name, type: a.type, price: a.price, city: a.city })));
    } catch (e) {
      console.error('Failed to load accommodations', e);
    }
  };

  useEffect(() => { load(); }, []);

  const onAddAcc = async (values: AccValues) => {
    try {
      await api.accommodations.create({
        name: values.name,
        city: values.city,
        type: values.type,
        price: values.price,
        amenities: [],
        image: `https://picsum.photos/seed/${encodeURIComponent(values.name)}/400/300`,
        description: values.name,
        universityProximity: undefined,
      } as any);
      await load();
    } catch (err: any) {
      swal.error(err?.message || 'Save failed');
      return;
    }
    reset({ name: '', city: '', type: '', price: '' });
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await swal.confirm('This will remove the accommodation listing.', { title: 'Delete listing?', confirmText: 'Delete', variant: 'error' }))) return;
    try {
      await api.accommodations.remove(id);
      setAccs((l) => l.filter((a) => a.id !== id));
    } catch (e: any) {
      swal.error(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Accommodation Inventory</h1>
          <p className="text-muted-foreground">Manage student housing listings and live pricing.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset({ name: '', city: '', type: '', price: '' }); }}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Listing
            </Button>
          } />
          <DialogContent>
            <form onSubmit={handleSubmit(onAddAcc)} noValidate>
              <DialogHeader>
                <DialogTitle>Add New Accommodation</DialogTitle>
                <DialogDescription>
                  Enter the details of the property you want to list.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="name" className="text-right">Property Name</Label>
                  <Input id="name" className="col-span-3" {...register('name')} />
                  <FieldError msg={errors.name?.message} />
                </div>
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="city" className="text-right">City</Label>
                  <Input id="city" className="col-span-3" placeholder="e.g. London" {...register('city')} />
                  <FieldError msg={errors.city?.message} />
                </div>
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="type" className="text-right">Room Type</Label>
                  <Input id="type" className="col-span-3" {...register('type')} />
                  <FieldError msg={errors.type?.message} />
                </div>
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="price" className="text-right">Base Rate</Label>
                  <Input id="price" placeholder="e.g. £300/pw" className="col-span-3" {...register('price')} />
                  <FieldError msg={errors.price?.message} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>List Property</Button>
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
                <TableHead className="text-center">City</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accs.map((acc) => (
                <TableRow key={acc.id} className="group">
                  <TableCell className="font-medium text-center py-4">{acc.name}</TableCell>
                  <TableCell className="text-sm text-center">{acc.type}</TableCell>
                  <TableCell className="font-mono text-sm text-center font-bold text-primary">{acc.price}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{acc.city}</TableCell>
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
