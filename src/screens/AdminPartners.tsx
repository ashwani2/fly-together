
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Handshake, ArrowUpRight, Trash2 } from 'lucide-react';
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

const INITIAL_PARTNERS = [
  { id: 'p1', name: 'Global Logistics co.', service: 'Visa Processing', status: 'Active', commissions: '£4,500' },
  { id: 'p2', name: 'Swift Move', service: 'Shipping', status: 'Under Review', commissions: '£850' },
  { id: 'p3', name: 'TransferWise', service: 'Payments', status: 'Active', commissions: '£12,300' },
  { id: 'p4', name: 'Student Comforts', service: 'Accommodation', status: 'Active', commissions: '£2,100' },
];

export default function AdminPartners() {
  const [data, setData] = useState(INITIAL_PARTNERS);
  const [isOpen, setIsOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({ name: '', service: '', status: 'Active', commissions: '£0' });

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `p${Date.now()}`;
    setData([...data, { ...newPartner, id }]);
    setNewPartner({ name: '', service: '', status: 'Active', commissions: '£0' });
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setData(data.filter(p => p.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Partner Ecosystem</h1>
          <p className="text-muted-foreground">Configure service level agreements and revenue sharing.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Handshake className="w-4 h-4" />
              Invite Partner
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleAddPartner}>
              <DialogHeader>
                <DialogTitle>Invite New Partner</DialogTitle>
                <DialogDescription>
                  Send an invitation to a service provider to join the ecosystem.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Company Name</Label>
                  <Input 
                    id="name" 
                    className="col-span-3" 
                    value={newPartner.name}
                    onChange={(e) => setNewPartner({...newPartner, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="service" className="text-right">Service Type</Label>
                  <Input 
                    id="service" 
                    placeholder="e.g. Health Insurance"
                    className="col-span-3"
                    value={newPartner.service}
                    onChange={(e) => setNewPartner({...newPartner, service: e.target.value})}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Send Invitation</Button>
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
                <TableHead className="px-6 text-center">Provider Name</TableHead>
                <TableHead className="text-center">Service Category</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Accrued Revenue</TableHead>
                <TableHead className="text-right px-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((partner) => (
                <TableRow key={partner.id} className="group">
                  <TableCell className="font-medium text-center py-4">{partner.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm text-center">{partner.service}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={partner.status === 'Active' ? 'default' : 'outline'} className={cn(
                      partner.status === 'Active' ? "bg-green-500 hover:bg-green-600 text-white border-none" : ""
                    )}>
                      {partner.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-center font-bold text-primary">{partner.commissions}</TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-3 h-3" />
                        Reports
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(partner.id)}
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
