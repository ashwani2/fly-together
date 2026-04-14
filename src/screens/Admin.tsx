
import React from 'react';
import { 
  Users, 
  FileCheck, 
  MessageSquare, 
  TrendingUp, 
  Search, 
  Filter, 
  CheckCircle2,
  XCircle,
  Eye
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const students = [
  { id: '1', name: 'Alex Johnson', university: 'Oxford', status: 'Verification', progress: 65, date: '2024-03-20' },
  { id: '2', name: 'Maria Garcia', university: 'Imperial', status: 'Application', progress: 80, date: '2024-03-18' },
  { id: '3', name: 'Chen Wei', university: 'Manchester', status: 'Documents', progress: 40, date: '2024-03-22' },
  { id: '4', name: 'Sarah Miller', university: 'UCL', status: 'Payment', progress: 95, date: '2024-03-15' },
];

const stats = [
  { label: 'Total Students', value: '1,284', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  { label: 'Pending Verification', value: '42', icon: FileCheck, color: 'text-amber-600', bg: 'bg-amber-100' },
  { label: 'Unread Messages', value: '18', icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-100' },
  { label: 'Success Rate', value: '94%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
];

export default function Admin() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Consultant Dashboard</h1>
        <p className="text-muted-foreground">Manage student applications and partner services.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg, stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student Management */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Student Applications</CardTitle>
              <CardDescription>Review and verify incoming student documents.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search students..." className="pl-10" />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>University</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} />
                        <AvatarFallback>{student.name[0]}</AvatarFallback>
                      </Avatar>
                      {student.name}
                    </div>
                  </TableCell>
                  <TableCell>{student.university}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary"
                      className={cn(
                        "px-2 py-0.5",
                        student.status === 'Verification' ? "bg-amber-100 text-amber-700" :
                        student.status === 'Application' ? "bg-blue-100 text-blue-700" :
                        student.status === 'Payment' ? "bg-green-100 text-green-700" :
                        "bg-slate-100 text-slate-700"
                      )}
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 w-24">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${student.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{student.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{student.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="text-green-600 hover:bg-green-50">
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50">
                        <XCircle className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
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
