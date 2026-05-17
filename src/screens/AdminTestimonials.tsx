
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
import { mockTestimonials } from '@/mockData';

export default function AdminTestimonials() {
  const [testimonialList, setTestimonialList] = useState<Testimonial[]>(() => {
    const saved = localStorage.getItem('testimonials');
    return saved ? JSON.parse(saved) : mockTestimonials;
  });
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const savedTestimonials = localStorage.getItem('testimonials');
      if (savedTestimonials) {
        setTestimonialList(JSON.parse(savedTestimonials));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const saveTestimonials = (newList: Testimonial[]) => {
    setTestimonialList(newList);
    localStorage.setItem('testimonials', JSON.stringify(newList));
  };

  const handleAddEditTestimonial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Partial<Testimonial> = {
      studentName: formData.get('studentName') as string,
      universityName: formData.get('universityName') as string,
      content: formData.get('content') as string,
      mediaUrl: formData.get('mediaUrl') as string,
      mediaType: formData.get('mediaType') as 'image' | 'video',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.get('studentName')}`,
      date: new Date().toISOString().split('T')[0],
    };

    if (editingTestimonial) {
      const newList = testimonialList.map(t => t.id === editingTestimonial.id ? { ...editingTestimonial, ...data } : t);
      saveTestimonials(newList);
    } else {
      const newTestimonial: Testimonial = {
        id: `t-${Date.now()}`,
        ...(data as Omit<Testimonial, 'id'>)
      };
      saveTestimonials([...testimonialList, newTestimonial]);
    }
    setIsTestimonialDialogOpen(false);
    setEditingTestimonial(null);
  };

  const handleDeleteTestimonial = (id: string) => {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      saveTestimonials(testimonialList.filter(t => t.id !== id));
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
                <form 
                  key={editingTestimonial?.id || 'new-testimonial-form'} 
                  onSubmit={handleAddEditTestimonial} 
                  className="space-y-4 pt-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Student Name</label>
                      <Input name="studentName" defaultValue={editingTestimonial?.studentName} required placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">University</label>
                      <Input name="universityName" defaultValue={editingTestimonial?.universityName} placeholder="e.g. Oxford" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Testimony</label>
                    <textarea 
                      name="content" 
                      defaultValue={editingTestimonial?.content}
                      required 
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      placeholder="What did the student say?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Media Type</label>
                      <select 
                        name="mediaType" 
                        defaultValue={editingTestimonial?.mediaType || 'image'}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Media URL</label>
                      <Input name="mediaUrl" defaultValue={editingTestimonial?.mediaUrl} required placeholder="URL to image/video" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsTestimonialDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Testimonial</Button>
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
