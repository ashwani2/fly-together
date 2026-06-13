
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Eye, 
  Image as ImageIcon,
  FileText
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BlogPost } from '@/types';
import { api } from '@/lib/api';
import { swal } from '@/lib/swal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const blogSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  category: z.string().min(1),
  coverImage: z.string().trim().min(1, 'Cover image URL is required'),
  excerpt: z.string().trim().min(1, 'Excerpt is required'),
  content: z.string().trim().min(1, 'Content is required'),
});
type BlogValues = z.infer<typeof blogSchema>;

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="px-1 text-xs font-medium text-red-600">{msg}</p> : null;
}

export default function AdminBlogs() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isBlogDialogOpen, setIsBlogDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<BlogValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: { title: '', category: 'Education', coverImage: '', excerpt: '', content: '' },
  });

  useEffect(() => {
    if (isBlogDialogOpen) {
      reset({
        title: editingBlog?.title ?? '',
        category: editingBlog?.category ?? 'Education',
        coverImage: editingBlog?.coverImage ?? '',
        excerpt: editingBlog?.excerpt ?? '',
        content: editingBlog?.content ?? '',
      });
    }
  }, [isBlogDialogOpen, editingBlog, reset]);

  const load = async () => {
    try {
      const list = await api.blogs.list();
      setBlogPosts(
        list.map((b) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          excerpt: b.excerpt,
          content: b.content,
          coverImage: b.coverImage,
          author: b.author,
          date: b.createdAt ? new Date(b.createdAt).toISOString().slice(0, 10) : '',
          category: b.category,
          readTime: b.readTime,
        })),
      );
    } catch (e) {
      console.error('Failed to load blogs', e);
    }
  };

  useEffect(() => { load(); }, []);

  const onSaveBlog = async (values: BlogValues) => {
    const body = {
      title: values.title,
      slug: values.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
      excerpt: values.excerpt,
      content: values.content,
      coverImage: values.coverImage,
      category: values.category,
      author: 'Admin',
      readTime: '5 min read',
    };
    try {
      if (editingBlog) await api.blogs.update(editingBlog.id, body);
      else await api.blogs.create(body);
      await load();
    } catch (err: any) {
      swal.error(err?.message || 'A post with this title/slug may already exist.', 'Save failed');
      return;
    }
    setIsBlogDialogOpen(false);
    setEditingBlog(null);
  };

  const handleDeleteBlog = async (id: string) => {
    if (!(await swal.confirm('This will permanently delete the blog post.', { title: 'Delete blog post?', confirmText: 'Delete', variant: 'error' }))) return;
    try {
      await api.blogs.remove(id);
      setBlogPosts((l) => l.filter((b) => b.id !== id));
    } catch (e: any) {
      swal.error(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Blog Management</h1>
        <p className="text-muted-foreground">Publish and manage articles to provide value to students.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Manage Blog Posts</CardTitle>
              <CardDescription>Create and edit articles for the website blog section.</CardDescription>
            </div>
            <Dialog open={isBlogDialogOpen} onOpenChange={(open) => {
              setIsBlogDialogOpen(open);
              if (!open) setEditingBlog(null);
            }}>
              <DialogTrigger render={
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> New Post
                </Button>
              } />
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingBlog ? 'Edit Post' : 'Add New Post'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSaveBlog)} noValidate className="space-y-6 pt-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Post Title</label>
                    <Input {...register('title')} placeholder="e.g. 5 Web Design Trends to Watch in 2024" />
                    <FieldError msg={errors.title?.message} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <select {...register('category')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                        <option>Education</option>
                        <option>Finance</option>
                        <option>Travel</option>
                        <option>Student Life</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">Cover Image URL</label>
                      <Input {...register('coverImage')} placeholder="https://..." />
                      <FieldError msg={errors.coverImage?.message} />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium italic opacity-70">Permalink: yourwebsite.com/{editingBlog?.slug || 'post-title-here'}</label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Excerpt (Short description)</label>
                    <textarea
                      {...register('excerpt')}
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    />
                    <FieldError msg={errors.excerpt?.message} />
                  </div>

                  <div className="space-y-1.5">
                    <div className="border rounded-xl overflow-hidden">
                      <div className="bg-muted/50 p-2 border-b flex gap-2">
                         <Button type="button" variant="ghost" size="sm" className="h-8 font-bold">B</Button>
                         <Button type="button" variant="ghost" size="sm" className="h-8 italic">I</Button>
                         <Button type="button" variant="ghost" size="sm" className="h-8 underline">U</Button>
                         <div className="w-px h-6 bg-border mx-1" />
                         <Button type="button" variant="ghost" size="sm" className="h-8 gap-2"><ImageIcon className="w-4 h-4" /> Add Media</Button>
                      </div>
                      <textarea
                        {...register('content')}
                        placeholder="Write your story here..."
                        className="flex min-h-[300px] w-full border-none bg-transparent px-3 py-2 text-sm focus-visible:outline-none"
                      />
                    </div>
                    <FieldError msg={errors.content?.message} />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsBlogDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>Publish Post</Button>
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
                <TableHead className="px-6">Article</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogPosts.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={blog.coverImage} className="w-12 h-8 rounded object-cover border" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold truncate max-w-[200px]">{blog.title}</span>
                        <span className="text-[10px] text-muted-foreground">{blog.author}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{blog.category}</Badge>
                  </TableCell>
                  <TableCell className="text-[10px] font-mono">{blog.date}</TableCell>
                  <TableCell className="text-right px-6">
                     <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingBlog(blog); setIsBlogDialogOpen(true); }}>
                         <Eye className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteBlog(blog.id)}>
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
