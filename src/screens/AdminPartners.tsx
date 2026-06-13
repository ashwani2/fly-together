
import React, { useState, useEffect } from 'react';
import { api, type ServiceCategory } from '@/lib/api';
import { swal } from '@/lib/swal';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Handshake, ArrowUpRight, Trash2 } from 'lucide-react';
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

const CATEGORY_OPTIONS: { value: ServiceCategory; label: string }[] = [
  { value: 'ACCOMMODATION', label: 'Accommodation' },
  { value: 'TICKET_BOOKING', label: 'Ticket Booking' },
  { value: 'LOANS', label: 'Loans' },
  { value: 'LOGISTICS', label: 'Logistics' },
  { value: 'ONLINE_PAYMENT', label: 'Online Payment' },
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORY_OPTIONS.map((c) => [c.value, c.label])) as Record<ServiceCategory, string>;

interface PartnerRow { id: string; name: string; service: string; status: string; commissions: string }

const partnerSchema = z.object({
  name: z.string().trim().min(1, 'Company name is required'),
  category: z.enum(['ACCOMMODATION', 'TICKET_BOOKING', 'LOANS', 'LOGISTICS', 'ONLINE_PAYMENT']),
  price: z.string().optional(),
});
type PartnerValues = z.infer<typeof partnerSchema>;

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="col-span-3 col-start-2 px-1 text-xs font-medium text-red-600">{msg}</p> : null;
}

export default function AdminPartners() {
  const [data, setData] = useState<PartnerRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PartnerValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: { name: '', category: 'LOGISTICS', price: '' },
  });

  const load = async () => {
    try {
      const list = await api.serviceProviders.list();
      setData(list.map((s) => ({ id: s.id, name: s.name, service: CATEGORY_LABEL[s.category], status: 'Active', commissions: s.price })));
    } catch (e) {
      console.error('Failed to load service providers', e);
    }
  };

  useEffect(() => { load(); }, []);

  const onAddPartner = async (values: PartnerValues) => {
    try {
      await api.serviceProviders.create({
        name: values.name,
        category: values.category,
        rating: 0,
        price: values.price || 'Contact for pricing',
        image: `https://picsum.photos/seed/${encodeURIComponent(values.name)}/400/300`,
        description: values.name,
        location: undefined,
      } as any);
      await load();
    } catch (err: any) {
      swal.error(err?.message || 'Save failed');
      return;
    }
    reset({ name: '', category: 'LOGISTICS', price: '' });
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await swal.confirm('This will remove the service provider.', { title: 'Delete provider?', confirmText: 'Delete', variant: 'error' }))) return;
    try {
      await api.serviceProviders.remove(id);
      setData((l) => l.filter((p) => p.id !== id));
    } catch (e: any) {
      swal.error(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Partner Ecosystem</h1>
          <p className="text-muted-foreground">Configure service level agreements and revenue sharing.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset({ name: '', category: 'LOGISTICS', price: '' }); }}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Handshake className="w-4 h-4" />
              Invite Partner
            </Button>
          } />
          <DialogContent>
            <form onSubmit={handleSubmit(onAddPartner)} noValidate>
              <DialogHeader>
                <DialogTitle>Invite New Partner</DialogTitle>
                <DialogDescription>
                  Send an invitation to a service provider to join the ecosystem.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="name" className="text-right">Company Name</Label>
                  <Input id="name" className="col-span-3" {...register('name')} />
                  <FieldError msg={errors.name?.message} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">Category</Label>
                  <select
                    id="category"
                    className="col-span-3 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    {...register('category')}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">Price</Label>
                  <Input id="price" placeholder="e.g. From £120/week" className="col-span-3" {...register('price')} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>Send Invitation</Button>
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
                <TableHead className="px-6 text-center">Provider Name</TableHead>
                <TableHead className="text-center">Service Category</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Accrued Revenue</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((partner) => (
                <TableRow key={partner.id} className="group">
                  <TableCell className="font-medium text-center py-4">{partner.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm text-center">{partner.service}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={partner.status === 'Active' ? 'default' : 'outline'} className={cn(
                      partner.status === 'Active' ? "bg-green-500 hover:bg-green-600 text-white border-none" : ""
                    )}>
                      {partner.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-center font-bold text-primary">{partner.commissions}</TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-3 h-3" />
                        Reports
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(partner.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
