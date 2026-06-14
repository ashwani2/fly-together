
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Eye, 
  ExternalLink,
  Handshake
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { HomePartner } from '@/types';
import { api } from '@/lib/api';
import { swal } from '@/lib/swal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const partnerSchema = z.object({
  name: z.string().trim().min(1, 'Partner name is required'),
  logo: z.string().trim().min(1, 'Logo URL is required').url('Enter a valid URL'),
  redirectUrl: z.string().trim().min(1, 'Redirection URL is required').url('Enter a valid URL'),
});
type PartnerValues = z.infer<typeof partnerSchema>;

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="px-1 text-xs font-medium text-red-600">{msg}</p> : null;
}

export default function AdminHomePartners() {
  const [partnerList, setPartnerList] = useState<HomePartner[]>([]);
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<HomePartner | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PartnerValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: { name: '', logo: '', redirectUrl: '' },
  });

  useEffect(() => {
    if (isPartnerDialogOpen) {
      reset({ name: editingPartner?.name ?? '', logo: editingPartner?.logo ?? '', redirectUrl: editingPartner?.redirectUrl ?? '' });
    }
  }, [isPartnerDialogOpen, editingPartner, reset]);

  const load = async () => {
    try {
      const list = await api.partners.list();
      setPartnerList(list.map((p) => ({ id: p.id, name: p.name, logo: p.imageUrl, redirectUrl: p.redirectionUrl })));
    } catch (e) {
      console.error('Failed to load partners', e);
    }
  };

  useEffect(() => { load(); }, []);

  const onSavePartner = async (values: PartnerValues) => {
    const body = { name: values.name, imageUrl: values.logo, redirectionUrl: values.redirectUrl };
    try {
      if (editingPartner) await api.partners.update(editingPartner.id, body);
      else await api.partners.create(body);
      await load();
    } catch (err: any) {
      swal.error(err?.message || 'Save failed');
      return;
    }
    setIsPartnerDialogOpen(false);
    setEditingPartner(null);
  };

  const handleDeletePartner = async (id: string) => {
    if (!(await swal.confirm('This will remove the partner from the home marquee.', { title: 'Delete partner?', confirmText: 'Delete', variant: 'error' }))) return;
    try {
      await api.partners.remove(id);
      setPartnerList((l) => l.filter((p) => p.id !== id));
    } catch (e: any) {
      swal.error(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Home Marquee Partners</h1>
        <p className="text-muted-foreground">Manage partners and clients that appear in the home page marquee.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Partner Network</CardTitle>
              <CardDescription>Add partners with their logos and redirection links (Newsletters/Certificates).</CardDescription>
            </div>
            <Dialog open={isPartnerDialogOpen} onOpenChange={(open) => {
              setIsPartnerDialogOpen(open);
              if (!open) setEditingPartner(null);
            }}>
              <DialogTrigger render={
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Add Partner
                </Button>
              } />
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingPartner ? 'Edit Partner' : 'Add New Partner'}</DialogTitle>
                  <DialogDescription>
                    Provide partner name, logo URL and the redirection link.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSavePartner)} noValidate className="space-y-4 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Partner Name</label>
                    <Input {...register('name')} placeholder="e.g. Global Education" />
                    <FieldError msg={errors.name?.message} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input {...register('logo')} placeholder="https://logo.clearbit.com/..." />
                    <FieldError msg={errors.logo?.message} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Redirection URL (Newsletter/Cert)</label>
                    <Input {...register('redirectUrl')} placeholder="https://..." />
                    <FieldError msg={errors.redirectUrl?.message} />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsPartnerDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{editingPartner ? 'Update Partner' : 'Save Partner'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="px-6">Partner</TableHead>
                <TableHead>Redirection Link</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partnerList.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded border bg-white dark:bg-white/90 p-1 flex items-center justify-center">
                        <img src={partner.logo} alt={partner.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <span className="font-semibold text-sm">{partner.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a href={partner.redirectUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                      {partner.redirectUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingPartner(partner);
                          setIsPartnerDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeletePartner(partner.id)}
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
