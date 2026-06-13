
import React, { useState, useEffect } from 'react';
import { 
  FileText as FileIcon, 
  Eye, 
  ChevronDown, 
  Download, 
  ExternalLink,
  XCircle,
  CheckCircle2,
  Filter,
  Banknote
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { api, type LoanApplication } from '@/lib/api';
import { swal } from '@/lib/swal';

interface LoanRow { id: string; applicantName: string; email: string; date: string; status: string; type: string }

function toLoanRow(l: LoanApplication): LoanRow {
  const d = (l.details ?? {}) as any;
  return {
    id: l.id,
    applicantName: d.applicantName || 'Student',
    email: d?.applicant?.email || '',
    date: l.createdAt ? new Date(l.createdAt).toISOString().slice(0, 10) : '',
    status: l.status,
    type: d.type || 'Education Loan',
  };
}

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

export default function AdminLoans() {
  const [loanList, setLoanList] = useState<LoanRow[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanRow | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [applicantDocs, setApplicantDocs] = useState(docCategories);

  const load = async () => {
    try {
      const list = await api.loans.list();
      setLoanList(list.map(toLoanRow));
    } catch (e) {
      console.error('Failed to load loans', e);
    }
  };

  useEffect(() => { load(); }, []);

  const updateLoanStatus = async (status: string) => {
    if (!selectedLoan) return;
    try {
      await api.loans.updateStatus(selectedLoan.id, status);
      await load();
    } catch (e: any) {
      swal.error(e?.message || 'Update failed');
    }
    setIsReviewOpen(false);
  };

  const updateDocStatus = (catIdx: number, itemIdx: number, newStatus: string) => {
    const newDocs = [...applicantDocs];
    newDocs[catIdx].items[itemIdx].status = newStatus;
    setApplicantDocs(newDocs);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Loan Management</h1>
        <p className="text-muted-foreground">Review and process student education loan applications.</p>
      </div>

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
                          loan.status === 'APPROVED'
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : loan.status === 'REJECTED'
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20",
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

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="sm:max-w-5xl w-[98vw] h-[95vh] md:h-[85vh] bg-background/60 backdrop-blur-3xl border-white/10 shadow-2xl p-0 overflow-hidden flex flex-col gap-0 transition-all duration-500">
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

          <div className="flex-none p-4 md:p-6 border-t bg-background/60 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
              <div className="flex flex-col sm:flex-row lg:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => updateLoanStatus('REJECTED')}
                  className="w-full sm:w-auto h-11 md:h-12 px-6 rounded-2xl border-white/20 bg-background/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 text-muted-foreground gap-2 transition-all font-bold text-sm"
                >
                  <XCircle className="w-5 h-5 text-destructive" /> Request Changes
                </Button>
                <Button
                  onClick={() => updateLoanStatus('APPROVED')}
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
