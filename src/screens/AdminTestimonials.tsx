
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Eye,
  MessageSquare,
  UploadCloud,
  Loader2,
  Link2,
  RefreshCw,
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
  mediaUrl: z.string().trim().min(1, 'Please upload a photo of the student'),
});
type TestimonialValues = z.infer<typeof testimonialSchema>;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Validate a chosen headshot before upload so the face displays well in the
 * circular avatar: must be a JPG/PNG/WebP, under 5MB, at least 200×200, and
 * roughly square (a wide/tall photo would crop the face out of the circle).
 * Resolves to an error string, or null when the photo is acceptable.
 */
function validatePhoto(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!ALLOWED_TYPES.includes(file.type)) return resolve('Please use a JPG, PNG or WebP image.');
    if (file.size > MAX_BYTES) return resolve('Image is too large. Please keep it under 5 MB.');
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      if (width < 200 || height < 200) return resolve('Image is too small. Use at least 200×200 pixels.');
      const ratio = width / height;
      if (ratio < 0.6 || ratio > 1.6) {
        return resolve('Please use a square-ish photo (close to 1:1) so the face stays centered and fully visible.');
      }
      resolve(null);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve('That file does not look like a valid image.'); };
    img.src = url;
  });
}

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="px-1 text-xs font-medium text-red-600">{msg}</p> : null;
}

const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export default function AdminTestimonials() {
  const [testimonialList, setTestimonialList] = useState<Testimonial[]>([]);
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<TestimonialValues>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: { studentName: '', universityName: '', content: '', mediaUrl: '' },
  });

  const photoUrl = watch('mediaUrl');

  useEffect(() => {
    if (isTestimonialDialogOpen) {
      reset({
        studentName: editingTestimonial?.studentName ?? '',
        universityName: editingTestimonial?.universityName ?? '',
        content: editingTestimonial?.content ?? '',
        mediaUrl: editingTestimonial?.avatarUrl ?? editingTestimonial?.mediaUrl ?? '',
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
          date: fmtDate(t.createdAt),
        })),
      );
    } catch (e) {
      console.error('Failed to load testimonials', e);
    }
  };

  useEffect(() => { load(); }, []);

  const onPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be re-selected after an error
    if (!file) return;
    const err = await validatePhoto(file);
    if (err) { swal.error(err, 'Photo not accepted'); return; }
    setUploading(true);
    try {
      const { url } = await api.testimonials.uploadImage(file);
      setValue('mediaUrl', url, { shouldValidate: true });
    } catch (e: any) {
      swal.error(e?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onSaveTestimonial = async (values: TestimonialValues) => {
    const body = {
      studentName: values.studentName,
      universityName: values.universityName || undefined,
      content: values.content,
      // The uploaded headshot is used both as the avatar and the media image.
      mediaUrl: values.mediaUrl,
      mediaType: 'IMAGE' as const,
      avatarUrl: values.mediaUrl,
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

                  {/* Photo upload (headshot). Validated for size + square-ish aspect. */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Student Photo</label>
                    <input type="hidden" {...register('mediaUrl')} />
                    <div className="flex items-center gap-4 rounded-xl border border-input bg-muted/10 p-3">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-border bg-muted">
                        {photoUrl ? (
                          <img src={photoUrl} alt="Student headshot" className="h-full w-full object-cover object-center" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <UploadCloud className="h-7 w-7" />
                          </div>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 grid place-items-center bg-background/70">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
                          {photoUrl ? <RefreshCw className="h-4 w-4" /> : <UploadCloud className="h-4 w-4" />}
                          {uploading ? 'Uploading…' : photoUrl ? 'Replace photo' : 'Upload photo'}
                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhotoSelect} disabled={uploading} />
                        </label>
                        <p className="text-[11px] text-muted-foreground">
                          Square JPG/PNG/WebP, at least 200×200, under 5&nbsp;MB. The face should be centered.
                        </p>
                        {photoUrl && (
                          <a
                            href={photoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-[11px] font-medium text-primary hover:underline"
                          >
                            <Link2 className="h-3 w-3 shrink-0" />
                            <span className="truncate">{photoUrl}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <FieldError msg={errors.mediaUrl?.message} />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsTestimonialDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting || uploading}>Save Testimonial</Button>
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
                  <TableHead>Photo</TableHead>
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
                          <AvatarImage src={t.avatarUrl} className="object-cover" />
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
                      {t.avatarUrl ? (
                        <a href={t.avatarUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[11px] text-primary hover:underline">
                          <Link2 className="w-3 h-3" /> View
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
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
                    <div className="flex flex-col items-center gap-2">
                      <MessageSquare className="h-6 w-6 text-muted-foreground/50" />
                      No testimonials found.
                    </div>
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
