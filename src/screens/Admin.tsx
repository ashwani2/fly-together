
import React, { useState } from 'react';
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
  ChevronDown
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
import { cn } from '@/lib/utils';

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

const universities = [
  { id: 'u1', name: 'University of Oxford', location: 'Oxford, UK', students: 450, status: 'Active' },
  { id: 'u2', name: 'Imperial College London', location: 'London, UK', students: 320, status: 'Active' },
  { id: 'u3', name: 'University of Manchester', location: 'Manchester, UK', students: 280, status: 'Hidden' },
  { id: 'u4', name: 'UCL', location: 'London, UK', students: 390, status: 'Active' },
];

const accommodations = [
  { id: 'a1', name: 'Chapter Spitalfields', type: 'Studio/En-suite', price: '£350/pw', availability: 'High' },
  { id: 'a2', name: 'Scrape Shoreditch', type: 'Shared Flat', price: '£280/pw', availability: 'Medium' },
  { id: 'a3', name: 'Vita Student First Street', type: 'Studio', price: '£310/pw', availability: 'Low' },
];

const stats = [
  { label: 'Total Students', value: '1,284', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Pending Verification', value: '42', icon: FileCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { label: 'Total Commissions', value: '£4,190', icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'Success Rate', value: '94%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
];

export default function Admin() {
  const [studentList, setStudentList] = useState(students);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const stats = [
    { label: 'Total Students', value: '1,284', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pending Verification', value: '42', icon: FileCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Total Commissions', value: '£4,190', icon: DollarSign, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Success Rate', value: '94%', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

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
        {stats.map((stat) => (
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
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 h-9">
                    <Filter className="w-4 h-4" />
                    {statusFilter === 'All' ? 'Filter' : statusFilter}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
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
    </div>
  );
}

