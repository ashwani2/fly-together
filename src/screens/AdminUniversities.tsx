
import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { swal } from '@/lib/swal';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

interface UniRow { id: string; name: string; location: string; students: number; status: string }

const uniSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  location: z.string().trim().min(1, 'Location is required'),
  tuitionFee: z.string().optional(),
  logo: z.string().optional(),
});
type UniValues = z.infer<typeof uniSchema>;

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="col-span-3 col-start-2 px-1 text-xs font-medium text-red-600">{msg}</p> : null;
}

export default function AdminUniversities() {
  const [unis, setUnis] = useState<UniRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UniValues>({
    resolver: zodResolver(uniSchema),
    defaultValues: { name: '', location: '', tuitionFee: '', logo: '' },
  });

  const load = async () => {
    try {
      const list = await api.universities.list();
      setUnis(list.map((u) => ({ id: u.id, name: u.name, location: u.location, students: u.courses.length, status: 'Active' })));
    } catch (e) {
      console.error('Failed to load universities', e);
    }
  };

  useEffect(() => { load(); }, []);

  const onAddUni = async (values: UniValues) => {
    try {
      await api.universities.create({
        name: values.name,
        location: values.location,
        logo: values.logo || 'https://logo.clearbit.com/example.com',
        rating: 0,
        tuitionFee: values.tuitionFee || 'Contact for details',
        description: values.name,
        courses: [],
      });
      await load();
    } catch (err: any) {
      swal.error(err?.message || 'Save failed');
      return;
    }
    reset({ name: '', location: '', tuitionFee: '', logo: '' });
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await swal.confirm('This will remove the university from the platform.', { title: 'Delete university?', confirmText: 'Delete', variant: 'error' }))) return;
    try {
      await api.universities.remove(id);
      setUnis((l) => l.filter((u) => u.id !== id));
    } catch (e: any) {
      swal.error(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">University Management</h1>
          <p className="text-muted-foreground">Configure global university profiles and enrollment status.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset({ name: '', location: '', tuitionFee: '', logo: '' }); }}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add University
            </Button>
          } />
          <DialogContent>
            <form onSubmit={handleSubmit(onAddUni)} noValidate>
              <DialogHeader>
                <DialogTitle>Add New University</DialogTitle>
                <DialogDescription>
                  Enter the details of the institution you want to add to the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" className="col-span-3" {...register('name')} />
                  <FieldError msg={errors.name?.message} />
                </div>
                <div className="grid grid-cols-4 items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="location" className="text-right">Location</Label>
                  <Input id="location" className="col-span-3" {...register('location')} />
                  <FieldError msg={errors.location?.message} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tuitionFee" className="text-right">Tuition Fee</Label>
                  <Input id="tuitionFee" className="col-span-3" placeholder="£20,000 - £35,000" {...register('tuitionFee')} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="logo" className="text-right">Logo URL</Label>
                  <Input id="logo" className="col-span-3" placeholder="https://logo.clearbit.com/..." {...register('logo')} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>Save University</Button>
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
                <TableHead className="px-6 text-center">University Name</TableHead>
                <TableHead className="text-center">Location</TableHead>
                <TableHead className="text-center">Courses</TableHead>
                <TableHead className="text-center">Portal Visibility</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unis.map((uni) => (
                <TableRow key={uni.id} className="group">
                  <TableCell className="font-medium text-center py-4">
                    <span className="underline decoration-primary/30 decoration-2 underline-offset-4">{uni.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm text-center">{uni.location}</TableCell>
                  <TableCell className="font-mono text-sm text-center font-bold text-primary">{uni.students}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={uni.status === 'Active' ? 'default' : 'secondary'} className={cn(
                      uni.status === 'Active' ? "bg-green-500 hover:bg-green-600" : "bg-muted text-muted-foreground border-none"
                    )}>
                      {uni.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(uni.id)}
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
