
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
import { mockBlogPosts } from '@/mockData';

export default function AdminBlogs() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('blog_posts');
    return saved ? JSON.parse(saved) : mockBlogPosts;
  });
  const [isBlogDialogOpen, setIsBlogDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const savedBlogs = localStorage.getItem('blog_posts');
      if (savedBlogs) {
        setBlogPosts(JSON.parse(savedBlogs));
      }
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const saveBlogs = (newList: BlogPost[]) => {
    setBlogPosts(newList);
    localStorage.setItem('blog_posts', JSON.stringify(newList));
  };

  const handleAddEditBlog = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const data: Partial<BlogPost> = {
      title,
      slug: title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
      excerpt: formData.get('excerpt') as string,
      content: formData.get('content') as string,
      coverImage: formData.get('coverImage') as string,
      category: formData.get('category') as string,
      author: 'Admin',
      date: new Date().toISOString().split('T')[0],
      readTime: '5 min read'
    };

    if (editingBlog) {
      const newList = blogPosts.map(b => b.id === editingBlog.id ? { ...editingBlog, ...data } : b);
      saveBlogs(newList);
    } else {
      const newBlog: BlogPost = {
        id: `b-${Date.now()}`,
        ...(data as Omit<BlogPost, 'id'>)
      };
      saveBlogs([...blogPosts, newBlog]);
    }
    setIsBlogDialogOpen(false);
    setEditingBlog(null);
  };

  const handleDeleteBlog = (id: string) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      saveBlogs(blogPosts.filter(b => b.id !== id));
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
                <form key={editingBlog?.id || 'new-blog-form'} onSubmit={handleAddEditBlog} className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Post Title</label>
                    <Input name="title" defaultValue={editingBlog?.title} required placeholder="e.g. 5 Web Design Trends to Watch in 2024" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <select name="category" defaultValue={editingBlog?.category || 'Education'} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                        <option>Education</option>
                        <option>Finance</option>
                        <option>Travel</option>
                        <option>Student Life</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Cover Image URL</label>
                      <Input name="coverImage" defaultValue={editingBlog?.coverImage} required placeholder="https://..." />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium italic opacity-70">Permalink: yourwebsite.com/{editingBlog?.slug || 'post-title-here'}</label>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Excerpt (Short description)</label>
                    <textarea 
                      name="excerpt" 
                      defaultValue={editingBlog?.excerpt}
                      required 
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="space-y-2 border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 p-2 border-b flex gap-2">
                       <Button type="button" variant="ghost" size="sm" className="h-8 font-bold">B</Button>
                       <Button type="button" variant="ghost" size="sm" className="h-8 italic">I</Button>
                       <Button type="button" variant="ghost" size="sm" className="h-8 underline">U</Button>
                       <div className="w-px h-6 bg-border mx-1" />
                       <Button type="button" variant="ghost" size="sm" className="h-8 gap-2"><ImageIcon className="w-4 h-4" /> Add Media</Button>
                    </div>
                    <textarea 
                      name="content" 
                      defaultValue={editingBlog?.content}
                      required 
                      placeholder="Write your story here..."
                      className="flex min-h-[300px] w-full border-none bg-transparent px-3 py-2 text-sm focus-visible:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsBlogDialogOpen(false)}>Cancel</Button>
                    <Button type="submit">Publish Post</Button>
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
