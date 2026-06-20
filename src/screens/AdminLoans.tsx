
import React, { useState, useEffect } from 'react';
import {
  FileText as FileIcon,
  Eye,
  ChevronDown,
  Download,
  ExternalLink,
  XCircle,
  CheckCircle2,
  Loader2,
  Clock,
  AlertTriangle,
  FileSearch,
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
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { api, resolveSignedUrl, type LoanApplication, type LoanStatus, type LoanDocumentGroup } from '@/lib/api';
import { swal } from '@/lib/swal';
import { toast } from '@/lib/toast';

// ── Pipeline ─────────────────────────────────────────────────────────────────
const PIPELINE: LoanStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'];

const STATUS_LABELS: Record<LoanStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  DOCUMENTS_REQUESTED: 'Docs Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
};

const STATUS_BADGE: Record<LoanStatus, string> = {
  SUBMITTED: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  UNDER_REVIEW: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  DOCUMENTS_REQUESTED: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  APPROVED: 'bg-green-500/10 text-green-500 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-500 border-red-500/20',
  DISBURSED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

function nextStatus(s: LoanStatus): LoanStatus | null {
  const idx = PIPELINE.indexOf(s);
  if (idx === -1 || idx === PIPELINE.length - 1) return null;
  return PIPELINE[idx + 1];
}

function pipelineProgress(s: LoanStatus): number {
  if (s === 'REJECTED') return 0;
  const idx = PIPELINE.indexOf(s);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / PIPELINE.length) * 100);
}

// ── All possible loan doc keys for doc-request checkboxes ───────────────────
const ALL_LOAN_DOCS = [
  { key: 'applicant_aadhar', label: 'Aadhar Card (Self)' },
  { key: 'applicant_pan', label: 'PAN Card (Self)' },
  { key: 'applicant_photo', label: 'Passport Photo' },
  { key: 'tenth_cert', label: '10th Marksheet' },
  { key: 'twelfth_cert', label: '12th Marksheet' },
  { key: 'ug_degree', label: 'UG Degree / Transcripts' },
  { key: 'offer_letter', label: 'University Offer Letter' },
  { key: 'guarantor_aadhar', label: 'Aadhar Card (Guarantor)' },
  { key: 'guarantor_pan', label: 'PAN Card (Guarantor)' },
  { key: 'bank_statement', label: 'Bank Statement (Last 6 Months)' },
  { key: 'income_proof', label: 'Income Proof' },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function studentName(l: LoanApplication) {
  const s = l.student;
  if (!s) return 'Student';
  return [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Student';
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

// ── Component ────────────────────────────────────────────────────────────────
export default function AdminLoans() {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Review dialog
  const [selected, setSelected] = useState<LoanApplication | null>(null);
  const [docGroups, setDocGroups] = useState<LoanDocumentGroup[]>([]);
  const [docBusyKey, setDocBusyKey] = useState<string | null>(null);

  // Advance
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<LoanApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Request-Documents dialog
  const [docReqTarget, setDocReqTarget] = useState<LoanApplication | null>(null);
  const [docReqReason, setDocReqReason] = useState('');
  const [docReqSelected, setDocReqSelected] = useState<Set<string>>(new Set());
  const [requesting, setRequesting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setLoans(await api.loans.list());
    } catch (e: any) {
      swal.error(e?.message || 'Failed to load loan applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Advance ────────────────────────────────────────────────────────────────
  const handleAdvance = async (loan: LoanApplication) => {
    const target = nextStatus(loan.status);
    if (!target) return;
    setAdvancingId(loan.id);
    // optimistic
    const patch = (prev: LoanApplication[]) => prev.map((l) => l.id === loan.id ? { ...l, status: target } : l);
    setLoans(patch);
    if (selected?.id === loan.id) setSelected((s) => s ? { ...s, status: target } : s);
    try {
      await api.loans.updateStatus(loan.id, target);
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
      toast.success(`${studentName(loan)}'s application moved to "${STATUS_LABELS[target]}".`, 'Application advanced');
    } catch (e: any) {
      swal.error(e?.message || 'Could not update status.');
      load();
    } finally {
      setAdvancingId(null);
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const openReject = (loan: LoanApplication) => { setRejectTarget(loan); setRejectReason(''); };
  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await api.loans.updateStatus(rejectTarget.id, 'REJECTED', undefined, rejectReason.trim());
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
      setLoans((prev) => prev.map((l) => l.id === rejectTarget.id ? { ...l, status: 'REJECTED' } : l));
      if (selected?.id === rejectTarget.id) setSelected((s) => s ? { ...s, status: 'REJECTED' } : s);
      toast.success(`Application rejected.`);
      setRejectTarget(null);
    } catch (e: any) {
      swal.error(e?.message || 'Could not reject application.');
    } finally {
      setRejecting(false);
    }
  };

  // ── Request Documents ──────────────────────────────────────────────────────
  const openDocRequest = (loan: LoanApplication) => {
    setDocReqTarget(loan);
    setDocReqReason('');
    setDocReqSelected(new Set());
  };
  const toggleDocReq = (key: string) =>
    setDocReqSelected((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });
  const submitDocRequest = async () => {
    if (!docReqTarget || !docReqReason.trim() || docReqSelected.size === 0) return;
    setRequesting(true);
    try {
      await api.loans.updateStatus(docReqTarget.id, 'DOCUMENTS_REQUESTED', {
        reason: docReqReason.trim(),
        docs: Array.from(docReqSelected),
      });
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
      setLoans((prev) => prev.map((l) => l.id === docReqTarget.id ? { ...l, status: 'DOCUMENTS_REQUESTED' } : l));
      if (selected?.id === docReqTarget.id) setSelected((s) => s ? { ...s, status: 'DOCUMENTS_REQUESTED' } : s);
      toast.success('Document request sent to student.');
      setDocReqTarget(null);
      setSelected(null);
    } catch (e: any) {
      swal.error(e?.message || 'Could not send document request.');
    } finally {
      setRequesting(false);
    }
  };

  // ── Open review dialog ─────────────────────────────────────────────────────
  const openReview = (loan: LoanApplication) => {
    setSelected(loan);
    setDocGroups(loan.details?.documentGroups ?? []);
  };

  // ── Per-doc status change ──────────────────────────────────────────────────
  const handleDocStatus = async (docKey: string, status: 'VERIFIED' | 'REJECTED' | 'PENDING') => {
    if (!selected) return;
    setDocBusyKey(docKey);
    // optimistic
    const patchGroups = (groups: LoanDocumentGroup[]) =>
      groups.map((g) => ({ ...g, documents: g.documents.map((d) => d.key === docKey ? { ...d, status } : d) }));
    setDocGroups((prev) => patchGroups(prev));
    setSelected((s) => s && s.details ? { ...s, details: { ...s.details, documentGroups: patchGroups(s.details.documentGroups ?? []) } } : s);
    try {
      await api.loans.updateDocumentStatus(selected.id, docKey, status);
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
      const label = status === 'VERIFIED' ? 'verified' : status === 'REJECTED' ? 'rejected' : 'reset to pending';
      toast.success(`Document ${label}.`);
    } catch (e: any) {
      swal.error(e?.message || 'Could not update document status.');
      // revert
      setDocGroups(selected.details?.documentGroups ?? []);
    } finally {
      setDocBusyKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Loan Management</h1>
        <p className="text-muted-foreground">Review and process student education loan applications.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle>Education Loan Applications</CardTitle>
          <CardDescription>Advance, reject, or request additional documents from students.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="px-6">Applicant</TableHead>
                  <TableHead>University / Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead className="text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : loans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                      No loan applications found.
                    </TableCell>
                  </TableRow>
                ) : loans.map((loan) => {
                  const name = studentName(loan);
                  const email = loan.student?.user?.email ?? '';
                  const uni = loan.details?.educationInfo?.universityName ?? '—';
                  const course = loan.details?.educationInfo?.course ?? '—';
                  const amount = loan.amount !== 'TBD' ? `₹${Number(loan.amount).toLocaleString('en-IN')}` : '—';
                  const advancing = advancingId === loan.id;
                  return (
                    <TableRow key={loan.id} className="group">
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{name}</span>
                          <span className="text-xs text-muted-foreground">{email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{uni}</span>
                          <span className="text-xs text-muted-foreground">{course}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{amount}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{fmtDate(loan.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn('text-[10px] uppercase', STATUS_BADGE[loan.status])}>
                          {STATUS_LABELS[loan.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={cn('h-full transition-all duration-500', loan.status === 'REJECTED' ? 'bg-red-500' : 'bg-primary')}
                              style={{ width: `${pipelineProgress(loan.status)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{pipelineProgress(loan.status)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title="Advance to next phase"
                            disabled={!nextStatus(loan.status) || advancing}
                            onClick={() => handleAdvance(loan)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-green-500 hover:bg-green-500/10 disabled:opacity-30"
                          >
                            {advancing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <button
                            title="Reject application"
                            disabled={loan.status === 'REJECTED' || loan.status === 'DISBURSED'}
                            onClick={() => openReject(loan)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-red-500 hover:bg-red-500/10 disabled:opacity-30"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                          <button
                            title="Review application"
                            onClick={() => openReview(loan)}
                            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Review dialog ── */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="sm:max-w-5xl w-[98vw] h-[95vh] md:h-[88vh] bg-background/60 backdrop-blur-3xl border-white/10 shadow-2xl p-0 overflow-hidden flex flex-col gap-0">
          <div className="flex-none p-6 border-b bg-background/40 backdrop-blur-xl">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <FileIcon className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {selected ? studentName(selected) : ''}
                  </DialogTitle>
                  <DialogDescription>
                    {selected?.details?.educationInfo?.universityName ?? ''}
                    {selected?.details?.educationInfo?.course ? ` — ${selected.details.educationInfo.course}` : ''}
                    {' '}
                    <Badge className={cn('text-[10px] ml-1', selected ? STATUS_BADGE[selected.status] : '')}>
                      {selected ? STATUS_LABELS[selected.status] : ''}
                    </Badge>
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-4 md:p-8 space-y-6">
              {/* Pipeline progress */}
              {selected && selected.status !== 'REJECTED' && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Application Progress</p>
                  <div className="relative flex justify-between items-start">
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10" />
                    <div
                      className="absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-500"
                      style={{ width: `${pipelineProgress(selected.status)}%` }}
                    />
                    {PIPELINE.map((step, idx) => {
                      const pidx = PIPELINE.indexOf(selected.status);
                      const done = idx < pidx;
                      const active = idx === pidx || (selected.status === 'DOCUMENTS_REQUESTED' && step === 'UNDER_REVIEW');
                      return (
                        <div key={step} className="flex flex-col items-center gap-1.5">
                          <div className={cn(
                            'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold',
                            done ? 'bg-primary border-primary text-primary-foreground' :
                            active ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20' :
                            'bg-background border-muted text-muted-foreground',
                          )}>
                            {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                          </div>
                          <span className={cn('text-[10px] font-medium hidden sm:block', active || done ? 'text-primary' : 'text-muted-foreground')}>
                            {STATUS_LABELS[step]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {selected.status === 'DOCUMENTS_REQUESTED' && (
                    <div className="mt-4 flex items-center gap-2 text-xs text-blue-600 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Waiting for student to submit requested documents before continuing.
                    </div>
                  )}
                </div>
              )}

              {selected?.status === 'REJECTED' && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-red-600">Application Rejected</p>
                    {selected.details?.rejectionReason && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{selected.details.rejectionReason}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Applicant summary */}
              {selected?.details && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ['Loan Amount', selected.amount !== 'TBD' ? `₹${Number(selected.amount).toLocaleString('en-IN')}` : '—'],
                    ['University', selected.details.educationInfo?.universityName || '—'],
                    ['Course', selected.details.educationInfo?.course || '—'],
                    ['Intake', [selected.details.educationInfo?.intakeSemester, selected.details.educationInfo?.intakeYear].filter(Boolean).join(' ') || '—'],
                    ['Monthly Income', selected.details.financialInfo?.monthlyIncome ? `₹${Number(selected.details.financialInfo.monthlyIncome).toLocaleString('en-IN')}` : '—'],
                    ['Collateral', selected.details.financialInfo?.collateral || '—'],
                    ['Guarantor', selected.details.guarantor?.name ? `${selected.details.guarantor.name} (${selected.details.guarantor.relation ?? ''})` : '—'],
                    ['Phone', selected.details.personalInfo?.phone || selected.student?.user?.phoneNumber || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="p-3 border rounded-xl bg-background/60">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{k}</p>
                      <p className="text-sm font-semibold truncate">{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Document groups */}
              {docGroups.length > 0 ? (
                <Accordion type="multiple" defaultValue={['item-0']} className="w-full space-y-4">
                  {docGroups.map((group, catIdx) => (
                    <AccordionItem key={group.category} value={`item-${catIdx}`} className="border rounded-2xl px-4 bg-muted/20 overflow-hidden">
                      <AccordionTrigger className="hover:no-underline py-5 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {catIdx + 1}
                          </div>
                          <span className="text-base font-bold">{group.label}</span>
                          <Badge variant="outline" className="ml-2 text-[10px] h-5 bg-background font-mono">
                            {group.documents.length} Files
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {group.documents.map((doc) => {
                            const busy = docBusyKey === doc.key;
                            const isVerified = doc.status === 'VERIFIED';
                            const isRejected = doc.status === 'REJECTED';
                            const url = doc.url ? resolveSignedUrl(doc.url) : undefined;
                            return (
                              <div key={doc.key} className={cn(
                                'flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border bg-background/50 backdrop-blur-sm gap-4',
                                isVerified && 'border-green-500/20',
                                isRejected && 'border-red-500/20',
                              )}>
                                <div className="flex items-center gap-4 overflow-hidden">
                                  <div className="p-3 rounded-xl bg-muted/80 border border-border/50 shrink-0">
                                    <FileIcon className="w-5 h-5 text-primary" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold truncate leading-tight mb-1">{doc.label}</span>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'text-[10px] w-fit',
                                        isVerified ? 'text-green-600 border-green-500/30 bg-green-500/10' :
                                        isRejected ? 'text-red-600 border-red-500/30 bg-red-500/10' :
                                        doc.url ? 'text-amber-600 border-amber-500/30 bg-amber-500/10' :
                                        'text-muted-foreground',
                                      )}
                                    >
                                      {isVerified ? 'Verified' : isRejected ? 'Rejected' : doc.url ? 'Pending Review' : 'Not Uploaded'}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {url ? (
                                    <>
                                      <a href={url} target="_blank" rel="noopener noreferrer">
                                        <button className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all" title="View">
                                          <ExternalLink className="w-4 h-4" />
                                        </button>
                                      </a>
                                      <a href={url} download>
                                        <button className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary transition-all" title="Download">
                                          <Download className="w-4 h-4" />
                                        </button>
                                      </a>
                                    </>
                                  ) : (
                                    <>
                                      <button disabled className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-muted/50 opacity-30 cursor-not-allowed"><ExternalLink className="w-4 h-4" /></button>
                                      <button disabled className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-muted/50 opacity-30 cursor-not-allowed"><Download className="w-4 h-4" /></button>
                                    </>
                                  )}
                                  <button
                                    title="Mark Verified"
                                    disabled={busy || isVerified || !url}
                                    onClick={() => handleDocStatus(doc.key, 'VERIFIED')}
                                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-green-600 hover:bg-green-500/10 disabled:opacity-30"
                                  >
                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                  </button>
                                  <button
                                    title="Reject document"
                                    disabled={busy || isRejected || !url}
                                    onClick={() => handleDocStatus(doc.key, 'REJECTED')}
                                    className="h-9 w-9 inline-flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 disabled:opacity-30"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                  <FileSearch className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Action footer */}
          <div className="flex-none p-4 md:p-6 border-t bg-background/60 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                disabled={selected?.status === 'UNDER_REVIEW' || selected?.status === 'DOCUMENTS_REQUESTED'}
                onClick={() => { if (selected) { api.loans.updateStatus(selected.id, 'UNDER_REVIEW').then(() => { setLoans((p) => p.map((l) => l.id === selected.id ? { ...l, status: 'UNDER_REVIEW' } : l)); setSelected((s) => s ? { ...s, status: 'UNDER_REVIEW' } : s); window.dispatchEvent(new CustomEvent('notifications:refresh')); }).catch((e: any) => swal.error(e?.message || 'Failed')); } }}
                className="h-10 px-4 rounded-xl text-sm font-semibold"
              >
                Mark Under Review
              </Button>
              <Button
                variant="outline"
                onClick={() => { if (selected) { openDocRequest(selected); setSelected(null); } }}
                disabled={selected?.status === 'REJECTED' || selected?.status === 'DISBURSED'}
                className="h-10 px-4 rounded-xl text-sm font-semibold text-blue-600 border-blue-300 hover:bg-blue-50"
              >
                <AlertTriangle className="w-4 h-4 mr-1.5" /> Request Documents
              </Button>
              <Button
                variant="outline"
                onClick={() => { if (selected) { openReject(selected); setSelected(null); } }}
                disabled={selected?.status === 'REJECTED' || selected?.status === 'DISBURSED'}
                className="h-10 px-4 rounded-xl text-sm font-semibold text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-1.5" /> Reject
              </Button>
              {selected && nextStatus(selected.status) && (
                <Button
                  onClick={() => { handleAdvance(selected); setSelected(null); }}
                  className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 text-sm font-semibold ml-auto"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Advance to {STATUS_LABELS[nextStatus(selected.status)!]}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Reject dialog ── */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" /> Reject Loan Application
            </DialogTitle>
            <DialogDescription>
              {rejectTarget ? studentName(rejectTarget) : ''} — {rejectTarget?.details?.educationInfo?.universityName ?? ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium">Rejection reason <span className="text-destructive">*</span></label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this application is being rejected…"
              rows={4}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason.trim() || rejecting} onClick={submitReject} className="gap-2">
              {rejecting && <Loader2 className="w-4 h-4 animate-spin" />} Reject Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Request Documents dialog ── */}
      <Dialog open={!!docReqTarget} onOpenChange={(o) => !o && setDocReqTarget(null)}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700">
              <AlertTriangle className="w-5 h-5" /> Request Documents
            </DialogTitle>
            <DialogDescription>
              Specify what's needed from {docReqTarget ? studentName(docReqTarget) : ''}. The student will be notified and asked to upload.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Reason / instructions <span className="text-destructive">*</span></label>
              <textarea
                value={docReqReason}
                onChange={(e) => setDocReqReason(e.target.value)}
                placeholder="e.g. Your offer letter appears to be expired. Please upload a valid one."
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Documents required <span className="text-destructive">*</span></label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {ALL_LOAN_DOCS.map((d) => (
                  <label key={d.key} className="flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={docReqSelected.has(d.key)}
                      onChange={() => toggleDocReq(d.key)}
                      className="rounded border-muted w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">{d.label}</span>
                  </label>
                ))}
              </div>
              {docReqSelected.size === 0 && (
                <p className="text-xs text-muted-foreground">Select at least one document.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDocReqTarget(null)}>Cancel</Button>
            <Button
              disabled={!docReqReason.trim() || docReqSelected.size === 0 || requesting}
              onClick={submitDocRequest}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {requesting && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
