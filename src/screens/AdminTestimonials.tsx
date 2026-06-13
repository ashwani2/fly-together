
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Eye, 
  Image as ImageIcon, 
  Video,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Testimonial } from '@/types';
import { api } from '@/lib/api';
import { swal } from '@/lib/swal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const testimonialSchema = z.object({
  studentName: z.string().trim().min(1, 'Student name is required'),
  universityName: z.string().optional(),
  content: z.string().trim().min(1, 'Testimony is required'),
  mediaType: z.enum(['image', 'video']),
  mediaUrl: z.string().trim().min(1, 'Media URL is required'),
});
type TestimonialValues = z.infer<typeof testimonialSchema>;

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="px-1 text-xs font-medium text-red-600">{msg}</p> : null;
}

export default function AdminTestimonials() {
  const [testimonialList, setTestimonialList] = useState<Testimonial[]>([]);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TestimonialValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: { studentName: '', universityName: '', content: '', mediaType: 'image', mediaUrl: '' },
  });

  useEffect(() => {
    if (isTestimonialDialogOpen) {
      reset({
        studentName: editingTestimonial?.studentName ?? '',
        universityName: editingTestimonial?.universityName ?? '',
        content: editingTestimonial?.content ?? '',
        mediaType: editingTestimonial?.mediaType === 'video' ? 'video' : 'image',
        mediaUrl: editingTestimonial?.mediaUrl ?? '',
      });
    }
  }, [isTestimonialDialogOpen, editingTestimonial, reset]);

  const load = async () => {
    try {
      const list = await api.testimonials.list();
      setTestimonialList(
        list.map((t) => ({
          id: t.id,
          studentName: t.studentName,
          universityName: t.universityName ?? undefined,
          content: t.content,
          mediaUrl: t.mediaUrl,
          mediaType: t.mediaType === 'VIDEO' ? 'video' : 'image',
          avatarUrl: t.avatarUrl ?? undefined,
          date: '',
        })),
      );
    } catch (e) {
      console.error('Failed to load testimonials', e);
    }
  };

  useEffect(() => { load(); }, []);

  const onSaveTestimonial = async (values: TestimonialValues) => {
    const body = {
      studentName: values.studentName,
      universityName: values.universityName || undefined,
      content: values.content,
      mediaUrl: values.mediaUrl,
      mediaType: (values.mediaType === 'video' ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(values.studentName)}`,
    };
    try {
      if (editingTestimonial) await api.testimonials.update(editingTestimonial.id, body);
      else await api.testimonials.create(body);
      await load();
    } catch (err: any) {
      swal.error(err?.message || 'Save failed');
      return;
    }
    setIsTestimonialDialogOpen(false);
    setEditingTestimonial(null);
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!(await swal.confirm('This will permanently delete the testimonial.', { title: 'Delete testimonial?', confirmText: 'Delete', variant: 'error' }))) return;
    try {
      await api.testimonials.remove(id);
      setTestimonialList((l) => l.filter((t) => t.id !== id));
    } catch (e: any) {
      swal.error(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Testimonials Management</h1>
        <p className="text-muted-foreground">Curate student stories featured on the homepage.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Student Testimonials</CardTitle>
              <CardDescription>Manage stories and reviews shared by students on the homepage.</CardDescription>
            </div>
            <Dialog open={isTestimonialDialogOpen} onOpenChange={(open) => {
              setIsTestimonialDialogOpen(open);
              if (!open) setEditingTestimonial(null);
            }}>
              <DialogTrigger render={
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Add Testimonial
                </Button>
              } />
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</DialogTitle>
                  <DialogDescription>
                    Fill in student details and their story to feature on the homepage.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSaveTestimonial)} noValidate className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Student Name</label>
                      <Input {...register('studentName')} placeholder="e.g. John Doe" />
                      <FieldError msg={errors.studentName?.message} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">University</label>
                      <Input {...register('universityName')} placeholder="e.g. Oxford" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Testimony</label>
                    <textarea
                      {...register('content')}
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="What did the student say?"
                    />
                    <FieldError msg={errors.content?.message} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Media Type</label>
                      <select
                        {...register('mediaType')}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Media URL</label>
                      <Input {...register('mediaUrl')} placeholder="URL to image/video" />
                      <FieldError msg={errors.mediaUrl?.message} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsTestimonialDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>Save Testimonial</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="px-6">Student</TableHead>
                  <TableHead>Testimony</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {testimonialList.length > 0 ? (
                testimonialList.map((t) => (
                  <TableRow key={t.id} className="group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={t.avatarUrl} />
                          <AvatarFallback>{t.studentName[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{t.studentName}</span>
                          <span className="text-[10px] text-muted-foreground">{t.universityName}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-xs line-clamp-2 text-muted-foreground">{t.content}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {t.mediaType === 'image' ? (
                          <ImageIcon className="w-3 h-3 text-blue-500" />
                        ) : (
                          <Video className="w-3 h-3 text-red-500" />
                        )}
                        <span className="text-[10px] truncate max-w-[100px]">{t.mediaUrl}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] font-mono">{t.date}</TableCell>
                    <TableCell className="text-right px-6">
                       <div className="flex justify-end gap-2">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8"
                           onClick={() => {
                             setEditingTestimonial(t);
                             setIsTestimonialDialogOpen(true);
                           }}
                         >
                           <Eye className="w-4 h-4" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 text-destructive hover:bg-destructive/10"
                           onClick={() => handleDeleteTestimonial(t.id)}
                         >
                           <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                    No testimonials found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
