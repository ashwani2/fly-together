
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
  Plus
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
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const mockAgentStudents = [
  { id: '1', name: 'Alex Johnson', university: 'Oxford', status: 'Verification', progress: 65, date: '2024-03-20', email: 'alex@example.com' },
  { id: '3', name: 'Chen Wei', university: 'Manchester', status: 'Documents', progress: 40, date: '2024-03-22', email: 'chen@example.com' },
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
  }
];

export default function Agent() {
  const [studentList, setStudentList] = useState(mockAgentStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [applicantDocs, setApplicantDocs] = useState(docCategories);

  const updateDocStatus = (catIdx: number, itemIdx: number, newStatus: string) => {
    const newDocs = [...applicantDocs];
    newDocs[catIdx].items[itemIdx].status = newStatus;
    setApplicantDocs(newDocs);
  };

  const filteredStudents = studentList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.university.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const agentStats = [
    { label: 'My Students', value: studentList.length.toString(), icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pending Docs', value: '8', icon: FileCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Estimated Commission', value: '£850', icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Success Rate', value: '100%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Agent Portal</h1>
          <p className="text-muted-foreground">Manage your students and their verification processes.</p>
        </div>
        <Button className="gap-2 rounded-xl h-11 px-6 shadow-lg shadow-primary/20">
          <Plus className="w-5 h-5" /> Add New Student
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agentStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-card/50 backdrop-blur group hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner", stat.bg, stat.color)}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Assigned Students</CardTitle>
              <CardDescription>Review and track the progress of students you brought in.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search students..." 
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
                      {statusFilter}
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                      <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Verification">Verification</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="Documents">Documents</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="px-6">Student Details</TableHead>
                  <TableHead>Target University</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id} className="group">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                          <AvatarFallback>{student.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{student.name}</span>
                          <span className="text-[10px] text-muted-foreground">{student.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{student.university}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-[10px]">
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${student.progress}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{student.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 gap-2"
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsReviewOpen(true);
                        }}
                      >
                        Verify Docs <Eye className="w-3 h-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-5xl w-[98vw] h-[85vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 border-b flex-none">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle>Verify Documents</DialogTitle>
                <DialogDescription>
                  Reviewing files for {selectedStudent?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <Accordion type="multiple" defaultValue={["cat-0"]} className="space-y-4">
              {applicantDocs.map((category, catIdx) => (
                <AccordionItem key={catIdx} value={`cat-${catIdx}`} className="border rounded-2xl px-4 bg-muted/20">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="font-bold">{category.title}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid gap-3">
                      {category.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex items-center justify-between p-4 bg-background rounded-xl border border-border/50 group">
                           <div className="flex items-center gap-4">
                             <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                               <FileIcon className="w-4 h-4" />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-sm font-medium">{item.name}</span>
                               <span className="text-[10px] text-muted-foreground">{item.status}</span>
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger render={
                                  <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                                    {item.status} <ChevronDown className="w-2.5 h-2.5" />
                                  </Button>
                                } />
                                <DropdownMenuContent align="end">
                                  <DropdownMenuGroup>
                                    <DropdownMenuRadioGroup value={item.status} onValueChange={(val) => updateDocStatus(catIdx, itemIdx, val)}>
                                      <DropdownMenuRadioItem value="Verified">Verify</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="Needs Review">Flag</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="Pending">Reset</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="p-6 border-t flex justify-end gap-3 bg-muted/10">
            <Button variant="outline" onClick={() => setIsReviewOpen(false)}>Close</Button>
            <Button onClick={() => {
              alert('Documents verified successfully! Student has been notified.');
              setIsReviewOpen(false);
            }}>Confirm Verification</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
