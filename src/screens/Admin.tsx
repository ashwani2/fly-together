
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileCheck, 
  TrendingUp, 
  Search, 
  Filter, 
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
  ChevronDown,
  ShieldCheck,
  FileText as FileIcon, 
  Download, 
  ExternalLink,
  Truck, 
  Home, 
  GraduationCap, 
  Banknote, 
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  Image as ImageIcon,
  Video,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { Testimonial, BlogPost } from '@/types';
import { mockTestimonials, mockBlogPosts } from '@/mockData';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const students = [
  { id: '1', name: 'Alex Johnson', university: 'Oxford', status: 'Verification', progress: 65, date: '2024-03-20' },
  { id: '2', name: 'Maria Garcia', university: 'Imperial', status: 'Application', progress: 80, date: '2024-03-18' },
  { id: '3', name: 'Chen Wei', university: 'Manchester', status: 'Documents', progress: 40, date: '2024-03-22' },
  { id: '4', name: 'Sarah Miller', university: 'UCL', status: 'Payment', progress: 95, date: '2024-03-15' },
];

const partners = [
  { id: 'p1', name: 'Royal Rahi Logistics', service: 'Logistics', status: 'Active', commissions: '£1,240' },
  { id: 'p2', name: 'UniSafe Payments', service: 'Payments', status: 'Active', commissions: '£850' },
  { id: 'p3', name: 'SkyHigh Travels', service: 'Ticketing', status: 'Reviewing', commissions: '£0' },
  { id: 'p4', name: 'Student Comforts', service: 'Accommodation', status: 'Active', commissions: '£2,100' },
];

const universitiesList = [
  { id: 'u1', name: 'University of Oxford', location: 'Oxford, UK', students: 450, status: 'Active' },
  { id: 'u2', name: 'Imperial College London', location: 'London, UK', students: 320, status: 'Active' },
  { id: 'u3', name: 'University of Manchester', location: 'Manchester, UK', students: 280, status: 'Hidden' },
  { id: 'u4', name: 'UCL', location: 'London, UK', students: 390, status: 'Active' },
];

const accommodationsList = [
  { id: 'a1', name: 'Chapter Spitalfields', type: 'Studio/En-suite', price: '£350/pw', availability: 'High' },
  { id: 'a2', name: 'Scrape Shoreditch', type: 'Shared Flat', price: '£280/pw', availability: 'Medium' },
  { id: 'a3', name: 'Vita Student First Street', type: 'Studio', price: '£310/pw', availability: 'Low' },
];

const mockLoanApps = [
  { id: 'LOAN-121', applicantName: 'John Doe', email: 'john@example.com', date: '2024-04-25', status: 'Pending', type: 'Education Loan' },
  { id: 'LOAN-122', applicantName: 'Emma Watson', email: 'emma@test.com', date: '2024-04-20', status: 'Approved', type: 'Education Loan' },
];

const adminStats = [
  { label: 'Total Students', value: '1,284', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Pending Verification', value: '42', icon: FileCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { label: 'Total Commissions', value: '£4,190', icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'Success Rate', value: '94%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
];

const docCategories = [
  {
    title: "Applicant Documents",
    items: [
      { name: "10th Marksheet", status: "Verified" },
      { name: "12th Marksheet", status: "Verified" },
      { name: "UG Degree/Transcripts", status: "Pending" },
      { name: "Aadhar Card (Self)", status: "Verified" },
      { name: "PAN Card (Self)", status: "Verified" },
      { name: "Offer Letter", status: "Verified" },
    ]
  },
  {
    title: "Guarantor Documents",
    items: [
      { name: "Aadhar Card (Parent)", status: "Pending" },
      { name: "PAN Card (Parent)", status: "Verified" },
      { name: "Passport Photo", status: "Verified" },
      { name: "6 Month Bank Statement", status: "Needs Review" },
      { name: "ITR Last 3 Years", status: "Verified" },
      { name: "Income Proof (Salary/Business)", status: "Verified" },
    ]
  },
  {
    title: "Co-Applicant Documents",
    items: [
      { name: "Aadhar Card", status: "Verified" },
      { name: "PAN Card", status: "Verified" },
      { name: "Passport Photo", status: "Verified" },
    ]
  }
];

export default function Admin() {
  const [studentList, setStudentList] = useState(students);
  const [loanList, setLoanList] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('loan_applications') || '[]');
    return [...mockLoanApps, ...saved];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [testimonialList, setTestimonialList] = useState<Testimonial[]>(() => {
    const saved = localStorage.getItem('testimonials');
    return saved ? JSON.parse(saved) : mockTestimonials;
  });
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('blog_posts');
    return saved ? JSON.parse(saved) : mockBlogPosts;
  });
  const [isTestimonialDialogOpen, setIsTestimonialDialogOpen] = useState(false);
  const [isBlogDialogOpen, setIsBlogDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);

  // Sync with localStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const savedLoans = JSON.parse(localStorage.getItem('loan_applications') || '[]');
      setLoanList([...mockLoanApps, ...savedLoans]);

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

  const handleApprove = (id: string) => {
    setStudentList(prev => prev.map(s => s.id === id ? { ...s, status: 'Application', progress: 85 } : s));
  };

  const handleReject = (id: string) => {
    setStudentList(prev => prev.filter(s => s.id !== id));
  };

  const filteredStudents = studentList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.university.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [applicantDocs, setApplicantDocs] = useState(docCategories);

  const updateDocStatus = (catIdx: number, itemIdx: number, newStatus: string) => {
    const newDocs = [...applicantDocs];
    newDocs[catIdx].items[itemIdx].status = newStatus;
    setApplicantDocs(newDocs);
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-muted-foreground">Comprehensive management of services, institutions, and applications.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-card/50 backdrop-blur group hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", stat.bg, stat.color)}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                  <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/20 border-none px-1.5 h-5">
                    +12%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <Tabs defaultValue="students" className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="bg-muted/50 p-1 inline-flex w-auto md:w-full justify-start md:justify-center min-w-max">
            <TabsTrigger value="students" className="gap-2">
              <Users className="w-4 h-4" /> Admission Queue
            </TabsTrigger>
            <TabsTrigger value="loans" className="gap-2">
              <Banknote className="w-4 h-4" /> Loan Applications
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="gap-2">
              <MessageSquare className="w-4 h-4" /> Testimonials
            </TabsTrigger>
            <TabsTrigger value="blogs" className="gap-2">
              <FileText className="w-4 h-4" /> Blogs
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2 text-muted-foreground/60" disabled>
              <ShieldCheck className="w-4 h-4" /> Partners
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="students">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Application Queue</CardTitle>
                  <CardDescription>Monitor and verify active student enrollment processes.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-full md:w-64">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search applicants..." 
                      className="pl-10 h-9" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      render={
                        <Button variant="outline" size="sm" className="gap-2 h-9">
                          <Filter className="w-4 h-4" />
                          {statusFilter === 'All' ? 'Filter' : statusFilter}
                          <ChevronDown className="w-3 h-3 opacity-50" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-[180px]">
                      <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                        <DropdownMenuRadioItem value="All">All Statuses</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="Verification">Verification</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="Application">Application</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="Documents">Documents</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="Payment">Payment</DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[280px] px-6 text-center">Student Details</TableHead>
                      <TableHead className="text-center">Target Institution</TableHead>
                      <TableHead className="text-center">Current Phase</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead className="text-center">Last Activity</TableHead>
                      <TableHead className="text-right px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id} className="group">
                          <TableCell className="font-medium px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <Avatar className="w-9 h-9 border-2 border-background shadow-sm">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                                <AvatarFallback>{student.name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col items-start text-left">
                                <span className="text-sm font-semibold">{student.name}</span>
                                <span className="text-[10px] text-muted-foreground font-normal">ID: {student.id}9823</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col">
                              <span className="text-sm">{student.university}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">ENROLLMENT-ID: 7420</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant="secondary"
                              className={cn(
                                "px-2 py-0 h-5 font-medium text-[10px] uppercase tracking-wider",
                                student.status === 'Verification' ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" :
                                student.status === 'Application' ? "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20" :
                                student.status === 'Payment' ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" :
                                "bg-muted text-muted-foreground hover:bg-muted"
                              )}
                            >
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-primary transition-all duration-1000" 
                                  style={{ width: `${student.progress}%` }} 
                                />
                              </div>
                              <span className="text-[10px] font-mono font-medium text-muted-foreground">{student.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground text-xs font-mono">{student.date}</TableCell>
                          <TableCell className="text-right px-6">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-green-500 hover:bg-green-500/10"
                                onClick={() => handleApprove(student.id)}
                                title="Approve"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button 
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                                onClick={() => handleReject(student.id)}
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" title="Details">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                          No applications found matching "{searchQuery}"
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loans">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle>Education Loan Requests</CardTitle>
              <CardDescription>Review and process new loan inquiry forms from students.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="px-6">Applicant</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                  {loanList.length > 0 ? (
                    loanList.map((loan) => (
                      <TableRow key={loan.id} className="group">
                        <TableCell className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold">{loan.applicantName}</span>
                            <span className="text-xs text-muted-foreground">{loan.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-normal">{loan.type}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">{loan.date}</TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              "text-[10px] uppercase",
                              loan.status === 'Pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"
                            )}
                          >
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-8 gap-2"
                             onClick={() => {
                               setSelectedLoan(loan);
                               setIsReviewOpen(true);
                             }}
                            >
                             Review Docs <Eye className="w-3 h-3" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                        No loan applications found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials">
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
        </TabsContent>

        <TabsContent value="blogs">
          <Card className="border-none shadow-sm">
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
                      <DialogTitle>Add New Post</DialogTitle>
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
                <TableHeader>
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
        </TabsContent>
      </Tabs>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-5xl w-[98vw] h-[95vh] md:h-[85vh] bg-background/60 backdrop-blur-3xl border-white/10 shadow-2xl p-0 overflow-hidden flex flex-col gap-0 transition-all duration-500">
          {/* Fixed Header */}
          <div className="flex-none p-6 border-b bg-background/40 backdrop-blur-xl">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <FileIcon className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight">
                      Document Verification
                    </DialogTitle>
                    <DialogDescription className="text-sm md:text-base font-medium">
                      Applicant: <span className="text-foreground">{selectedLoan?.applicantName}</span> • <span className="font-mono text-primary">{selectedLoan?.id}</span>
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain">
            <div className="p-4 md:p-8 space-y-6">
              <Accordion type="multiple" defaultValue={["item-0"]} className="w-full space-y-4">
                {applicantDocs.map((category, catIdx) => (
                  <AccordionItem key={catIdx} value={`item-${catIdx}`} className="border rounded-2xl px-4 bg-muted/20 overflow-hidden">
                    <AccordionTrigger className="hover:no-underline py-5 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {catIdx + 1}
                        </div>
                        <span className="text-base font-bold">{category.title}</span>
                        <Badge variant="outline" className="ml-2 text-[10px] h-5 bg-background font-mono">
                          {category.items.length} Files
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {category.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-background/50 backdrop-blur-sm group hover:border-primary/40 transition-all gap-4">
                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className="p-3 rounded-xl bg-muted/80 border border-border/50 group-hover:scale-110 transition-transform">
                                <FileIcon className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-bold truncate leading-tight mb-1">{item.name}</span>
                                <div className="flex items-center gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger render={
                                      <button className={cn(
                                        "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all outline-none",
                                        item.status === 'Verified' ? "bg-green-500/20 text-green-500 border border-green-500/20" : 
                                        item.status === 'Pending' ? "bg-amber-500/20 text-amber-500 border border-amber-500/20" : 
                                        "bg-red-500/20 text-red-500 border border-red-500/20"
                                      )}>
                                        {item.status}
                                        <ChevronDown className="w-2.5 h-2.5" />
                                      </button>
                                    } />
                                    <DropdownMenuContent align="start" className="w-[140px]">
                                      <DropdownMenuRadioGroup 
                                        value={item.status} 
                                        onValueChange={(val) => updateDocStatus(catIdx, itemIdx, val)}
                                      >
                                        <DropdownMenuRadioItem value="Verified" className="text-xs">Verified</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="Pending" className="text-xs">Pending</DropdownMenuRadioItem>
                                        <DropdownMenuRadioItem value="Needs Review" className="text-xs">Needs Review</DropdownMenuRadioItem>
                                      </DropdownMenuRadioGroup>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <span className="text-[10px] text-muted-foreground opacity-30">|</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">PDF • 1.2MB</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0">
                               <div className="flex gap-2">
                                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                                   <ExternalLink className="w-4 h-4" />
                                 </Button>
                                 <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all">
                                   <Download className="w-4 h-4" />
                                 </Button>
                               </div>
                               <button className="sm:hidden text-[10px] font-black tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 uppercase transition-all active:scale-95">
                                 View File
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-none p-4 md:p-6 border-t bg-background/60 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row lg:flex-row gap-2 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto h-11 md:h-12 px-6 rounded-2xl border-white/20 bg-background/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground gap-2 transition-all font-bold text-sm"
                >
                  <XCircle className="w-5 h-5 text-destructive" /> Request Changes
                </Button>
                <Button 
                  className="w-full sm:w-auto h-11 md:h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 gap-2 font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-5 h-5" /> Approve Documents
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

