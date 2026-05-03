
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_UNIVERSITIES = [
  { id: 'u1', name: 'University of Oxford', location: 'Oxford, UK', students: 450, status: 'Active' },
  { id: 'u2', name: 'Imperial College London', location: 'London, UK', students: 320, status: 'Active' },
  { id: 'u3', name: 'University of Manchester', location: 'Manchester, UK', students: 280, status: 'Hidden' },
  { id: 'u4', name: 'UCL', location: 'London, UK', students: 390, status: 'Active' },
];

export default function AdminUniversities() {
  const [unis, setUnis] = useState(INITIAL_UNIVERSITIES);
  const [isOpen, setIsOpen] = useState(false);
  const [newUni, setNewUni] = useState({ name: '', location: '', students: '', status: 'Active' });

  const handleAddUni = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `u${Date.now()}`;
    setUnis([...unis, { ...newUni, id, students: parseInt(newUni.students) || 0 }]);
    setNewUni({ name: '', location: '', students: '', status: 'Active' });
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setUnis(unis.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">University Management</h1>
          <p className="text-muted-foreground">Configure global university profiles and enrollment status.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add University
            </Button>
          } />
          <DialogContent>
            <form onSubmit={handleAddUni}>
              <DialogHeader>
                <DialogTitle>Add New University</DialogTitle>
                <DialogDescription>
                  Enter the details of the institution you want to add to the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    value={newUni.name}
                    onChange={(e) => setNewUni({...newUni, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">Location</Label>
                  <Input 
                    id="location" 
                    className="col-span-3"
                    value={newUni.location}
                    onChange={(e) => setNewUni({...newUni, location: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="students" className="text-right">Students</Label>
                  <Input 
                    id="students" 
                    type="number" 
                    className="col-span-3"
                    value={newUni.students}
                    onChange={(e) => setNewUni({...newUni, students: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save University</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="px-6 text-center">University Name</TableHead>
                <TableHead className="text-center">Location</TableHead>
                <TableHead className="text-center">Active Students</TableHead>
                <TableHead className="text-center">Portal Visibility</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unis.map((uni) => (
                <TableRow key={uni.id} className="group">
                  <TableCell className="font-medium text-center py-4">
                    <span className="underline decoration-primary/30 decoration-2 underline-offset-4">{uni.name}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm text-center">{uni.location}</TableCell>
                  <TableCell className="font-mono text-sm text-center font-bold text-primary">{uni.students}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={uni.status === 'Active' ? 'default' : 'secondary'} className={cn(
                      uni.status === 'Active' ? "bg-green-500 hover:bg-green-600" : "bg-muted text-muted-foreground border-none"
                    )}>
                      {uni.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">Edit</Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(uni.id)}
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
    </div>
  );
}
