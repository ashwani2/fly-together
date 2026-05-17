
import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Search, 
  CheckCircle2,
  Eye,
  ShieldCheck,
  FileText as FileIcon, 
  Truck, 
  Home, 
  GraduationCap, 
  Clock,
  Plus,
  Trash2,
  FileCheck,
  DollarSign,
  Filter,
  ChevronDown,
  XCircle
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

const mockAgents = [
  { id: 'agent-1', name: 'James Wilson', email: 'james@agent.com', studentsCount: 12 },
  { id: 'agent-2', name: 'Sarah Parker', email: 'sarah@agent.com', studentsCount: 8 },
  { id: 'agent-3', name: 'Michael Ross', email: 'michael@agent.com', studentsCount: 15 },
];

const initialStudents = [
  { id: '1', name: 'Alex Johnson', university: 'Oxford', status: 'Verification', progress: 65, date: '2024-03-20', agentId: 'agent-1' },
  { id: '2', name: 'Maria Garcia', university: 'Imperial', status: 'Application', progress: 80, date: '2024-03-18', agentId: 'agent-2' },
  { id: '3', name: 'Chen Wei', university: 'Manchester', status: 'Documents', progress: 40, date: '2024-03-22', agentId: null },
  { id: '4', name: 'Sarah Miller', university: 'UCL', status: 'Payment', progress: 95, date: '2024-03-15', agentId: 'agent-1' },
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
  const [studentList, setStudentList] = useState(initialStudents);
  const [agents, setAgents] = useState(mockAgents);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isStudentDetailsOpen, setIsStudentDetailsOpen] = useState(false);

  const handleApprove = (id: string) => {
    setStudentList(prev => prev.map(s => s.id === id ? { ...s, status: 'Application', progress: 85 } : s));
  };

  const handleReject = (id: string) => {
    setStudentList(prev => prev.filter(s => s.id !== id));
  };

  const handleAddEditAgent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    };

    if (editingAgent) {
      setAgents(prev => prev.map(a => a.id === editingAgent.id ? { ...a, ...data } : a));
    } else {
      const newAgent = {
        id: `agent-${Date.now()}`,
        ...data,
        studentsCount: 0
      };
      setAgents(prev => [...prev, newAgent]);
    }
    setIsAgentDialogOpen(false);
    setEditingAgent(null);
  };

  const handleDeleteAgent = (id: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      setAgents(prev => prev.filter(a => a.id !== id));
      setStudentList(prev => prev.map(s => s.agentId === id ? { ...s, agentId: null } : s));
    }
  };

  const handleAssignAgent = (studentId: string, agentId: string) => {
    setStudentList(prev => prev.map(s => s.id === studentId ? { ...s, agentId: agentId === 'unassigned' ? null : agentId } : s));
  };

  const filteredStudents = studentList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.university.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [applicantDocs, setApplicantDocs] = useState(docCategories);

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-muted-foreground">Comprehensive management of services, institutions, and applications.</p>
        </div>
      </div>

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

      <Tabs defaultValue="students" className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="bg-muted/50 p-1 inline-flex w-auto md:w-full justify-start md:justify-center min-w-max">
            <TabsTrigger value="students" className="gap-2">
              <Users className="w-4 h-4" /> Admission Queue
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <ShieldCheck className="w-4 h-4" /> Agent Network
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
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                          <DropdownMenuRadioItem value="All">All Statuses</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Verification">Verification</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Application">Application</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Documents">Documents</DropdownMenuRadioItem>
                          <DropdownMenuRadioItem value="Payment">Payment</DropdownMenuRadioItem>
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
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[280px] px-6 text-center">Student Details</TableHead>
                      <TableHead className="text-center">Agent</TableHead>
                      <TableHead className="text-center">Phase</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead className="text-right px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => {
                        const assignedAgent = agents.find(a => a.id === student.agentId);
                        
                        return (
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
                              <DropdownMenu>
                                <DropdownMenuTrigger render={
                                  <Button variant="ghost" size="sm" className={cn("h-8 gap-2 rounded-full", !assignedAgent && "text-red-500 bg-red-500/10")}>
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    {assignedAgent ? assignedAgent.name : 'Unassigned'}
                                    <ChevronDown className="w-3 h-3 opacity-50" />
                                  </Button>
                                } />
                                <DropdownMenuContent align="center" className="w-[200px]">
                                  <DropdownMenuGroup>
                                    <DropdownMenuLabel>Assign Agent</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioGroup 
                                      value={student.agentId || 'unassigned'}
                                      onValueChange={(val) => handleAssignAgent(student.id, val)}
                                    >
                                      {agents.map((agent) => (
                                        <DropdownMenuRadioItem 
                                          key={agent.id} 
                                          value={agent.id}
                                          className="text-xs"
                                        >
                                          {agent.name}
                                        </DropdownMenuRadioItem>
                                      ))}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuRadioItem 
                                        value="unassigned" 
                                        className="text-xs text-destructive"
                                      >
                                        Unassign Agent
                                      </DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuGroup>
                                </DropdownMenuContent>
                              </DropdownMenu>
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
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:bg-muted" 
                                  title="Details"
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setIsStudentDetailsOpen(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
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

        <TabsContent value="agents">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Agent Network</CardTitle>
                  <CardDescription>Onboard and manage agents who assist students with their applications.</CardDescription>
                </div>
                <Dialog open={isAgentDialogOpen} onOpenChange={(open) => {
                  setIsAgentDialogOpen(open);
                  if (!open) setEditingAgent(null);
                }}>
                  <DialogTrigger render={
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" /> Onboard Agent
                    </Button>
                  } />
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingAgent ? 'Edit Agent Profile' : 'Onboard New Agent'}</DialogTitle>
                      <DialogDescription>
                        Agents can bring their own students and help verify their documents.
                      </DialogDescription>
                    </DialogHeader>
                    <form key={editingAgent?.id || 'new-agent-form'} onSubmit={handleAddEditAgent} className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Agent Name</label>
                        <Input name="name" defaultValue={editingAgent?.name} required placeholder="Full Name" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input name="email" type="email" defaultValue={editingAgent?.email} required placeholder="agent@example.com" />
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAgentDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">{editingAgent ? 'Update Profile' : 'Onboard Agent'}</Button>
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
                    <TableHead className="px-6">Agent Details</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Active Students</TableHead>
                    <TableHead className="text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.name}`} />
                            <AvatarFallback>{agent.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-sm">{agent.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{agent.email}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="px-2 py-0.5">
                          {studentList.filter(s => s.agentId === agent.id).length} Students
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingAgent(agent);
                              setIsAgentDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteAgent(agent.id)}
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
        </TabsContent>
      </Tabs>

      <Dialog open={isStudentDetailsOpen} onOpenChange={setIsStudentDetailsOpen}>
        <DialogContent className="sm:max-w-5xl w-[98vw] h-[95vh] md:h-[85vh] bg-background/60 backdrop-blur-3xl border-white/10 shadow-2xl p-0 overflow-hidden flex flex-col gap-0 transition-all duration-500">
          <div className="flex-none p-6 border-b bg-background/40 backdrop-blur-xl">
            <DialogHeader>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-start gap-1">
                    <DialogTitle className="text-xl md:text-2xl font-bold tracking-tight">
                      Student Overview
                    </DialogTitle>
                    <DialogDescription className="text-sm md:text-base font-medium">
                      Reviewing profile for <span className="text-foreground">{selectedStudent?.name}</span> • <span className="font-mono text-primary">ID: {selectedStudent?.id}9823</span>
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-6">
                <Card className="border-none shadow-md overflow-hidden">
                  <div className="h-32 bg-primary/10 relative">
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                      <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedStudent?.name}`} />
                        <AvatarFallback>{selectedStudent?.name?.[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="pt-12 pb-6 px-6 text-center">
                    <h3 className="text-xl font-bold">{selectedStudent?.name}</h3>
                    <p className="text-muted-foreground text-sm">{selectedStudent?.university}</p>
                    <div className="mt-4">
                      <Badge variant="secondary" className="capitalize">
                        {selectedStudent?.status}
                      </Badge>
                    </div>
                  </div>
                </Card>

                <div className="space-y-4">
                  <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Assigned Agent</h4>
                  {selectedStudent?.agentId ? (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${agents.find(a => a.id === selectedStudent?.agentId)?.name}`} />
                        <AvatarFallback>A</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{agents.find(a => a.id === selectedStudent?.agentId)?.name}</span>
                        <span className="text-[10px] text-muted-foreground">Premium Agent</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4" /> No Agent Assigned
                    </div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">Verification Progress</h3>
                  <span className="text-sm font-mono font-bold text-primary">{selectedStudent?.progress}%</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${selectedStudent?.progress}%` }} />
                </div>

                <div className="space-y-4 pt-4">
                  <h3 className="text-lg font-bold">Documents Checklist</h3>
                  <Accordion type="multiple" className="w-full space-y-3">
                    {applicantDocs.map((category, catIdx) => (
                      <AccordionItem key={catIdx} value={`student-cat-${catIdx}`} className="border rounded-xl px-4 bg-muted/10">
                        <AccordionTrigger className="hover:no-underline py-3">
                          <span className="font-bold text-sm">{category.title}</span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-3">
                          <div className="grid gap-2">
                            {category.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50">
                                <div className="flex items-center gap-3">
                                  <FileIcon className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm">{item.name}</span>
                                </div>
                                <Badge variant={item.status === 'Verified' ? 'default' : 'secondary'} className="text-[10px]">
                                  {item.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t bg-background/60 backdrop-blur-xl flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsStudentDetailsOpen(false)}>Close</Button>
            <Button className="gap-2" onClick={() => {
               handleApprove(selectedStudent.id);
               setIsStudentDetailsOpen(false);
            }}>
              <CheckCircle2 className="w-4 h-4" /> Move to Next Phase
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

