import { useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  Users,
  FileCheck,
  Search,
  Filter,
  Eye,
  ChevronDown,
  ShieldCheck,
  FileText as FileIcon,
  FileSearch,
  Loader2,
  CheckCircle2,
  XCircle,
  CreditCard,
  Mail,
  Phone,
  GraduationCap,
  Undo2,
  Video,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api, docLabel, type AgentApplication, type ApplicationStatus, type ApplicationTimelineEntry, type DocStatus, type StudentDocument } from '@/lib/api';
import { swal } from '@/lib/swal';
import { toast } from '@/lib/toast';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { BrandedLoader } from '@/components/BrandedLoader';
import { DocumentViewer } from '@/components/DocumentViewer';

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  CREATED: 'Created',
  REJECTED: 'Rejected',
  DOCUMENT_VERIFIED: 'Document Verified',
  SENT_TO_UNIVERSITY: 'Sent to University',
  PENDING_WITH_UNIVERSITY: 'Pending with University',
  VERIFIED_BY_UNIVERSITY: 'Verified by University',
  PAYMENT_PENDING: 'Payment Pending',
  COMPLETED: 'Completed',
};

const statusBadge: Record<ApplicationStatus, string> = {
  CREATED: 'bg-muted text-muted-foreground',
  REJECTED: 'bg-red-500/10 text-red-600',
  DOCUMENT_VERIFIED: 'bg-teal-500/10 text-teal-600',
  SENT_TO_UNIVERSITY: 'bg-sky-500/10 text-sky-600',
  PENDING_WITH_UNIVERSITY: 'bg-amber-500/10 text-amber-500',
  VERIFIED_BY_UNIVERSITY: 'bg-purple-500/10 text-purple-600',
  PAYMENT_PENDING: 'bg-blue-500/10 text-blue-500',
  COMPLETED: 'bg-green-500/10 text-green-600',
};

const STATUS_ORDER: ApplicationStatus[] = [
  'CREATED',
  'DOCUMENT_VERIFIED',
  'SENT_TO_UNIVERSITY',
  'PENDING_WITH_UNIVERSITY',
  'VERIFIED_BY_UNIVERSITY',
  'PAYMENT_PENDING',
  'COMPLETED',
];

const nextStatus = (s: ApplicationStatus): ApplicationStatus | null => {
  const idx = STATUS_ORDER.indexOf(s);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
};

// Previous phase in the pipeline — used to roll an application back a step.
const prevStatus = (s: ApplicationStatus): ApplicationStatus | null => {
  const idx = STATUS_ORDER.indexOf(s);
  if (idx <= 0) return null;
  return STATUS_ORDER[idx - 1];
};

const docBadge = (status: DocStatus) =>
  status === 'VERIFIED' ? 'bg-green-500/10 text-green-600' :
  status === 'REJECTED' ? 'bg-red-500/10 text-red-600' :
  'bg-amber-500/10 text-amber-600';

export default function Agent() {
  const [apps, setApps] = useState<AgentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>('All');

  // Verify-documents dialog
  const [selected, setSelected] = useState<AgentApplication | null>(null);
  const [timeline, setTimeline] = useState<ApplicationTimelineEntry[]>([]);

  // Load the selected application's activity timeline.
  useEffect(() => {
    if (!selected) { setTimeline([]); return; }
    let active = true;
    api.applications.timeline(selected.id)
      .then((entries) => { if (active) setTimeline(entries); })
      .catch(() => { if (active) setTimeline([]); });
    return () => { active = false; };
  }, [selected?.id]);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [savingDocId, setSavingDocId] = useState<string | null>(null);
  const [docViewer, setDocViewer] = useState<{ url: string; title: string; type: string } | null>(null);

  // Application phase actions (scoped to assigned students by the backend)
  const [rejectTarget, setRejectTarget] = useState<AgentApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [paymentLinkTarget, setPaymentLinkTarget] = useState<AgentApplication | null>(null);
  const [paymentLink, setPaymentLink] = useState('');
  const [savingPaymentLink, setSavingPaymentLink] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setApps(await api.agents.applications());
    } catch (e) {
      console.error('Failed to load applications', e);
      swal.error('Could not load your students’ applications. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdvance = async (a: AgentApplication) => {
    const target = nextStatus(a.status);
    if (!target) { toast.info('This application has reached the final phase.', 'Nothing to do'); return; }
    if (target === 'PAYMENT_PENDING') { setPaymentLinkTarget(a); setPaymentLink(''); return; }
    setApps((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: target } : x)));
    setSelected((cur) => (cur && cur.id === a.id ? { ...cur, status: target } : cur));
    try {
      await api.applications.setStatus(a.id, target);
      if (target === 'COMPLETED') {
        await api.applications.setPayment(a.id, 'COMPLETED');
        setApps((prev) => prev.map((x) => (x.id === a.id ? { ...x, paymentStatus: 'COMPLETED' } : x)));
        setSelected((cur) => (cur && cur.id === a.id ? { ...cur, paymentStatus: 'COMPLETED' } : cur));
      }
      toast.success(`${a.student.name}'s application moved to “${STATUS_LABELS[target]}”.`, 'Application advanced');
    } catch (e: any) {
      swal.error(e?.message || 'Could not update status.');
      load();
    }
  };

  const handleRollback = async (a: AgentApplication) => {
    const target = prevStatus(a.status);
    if (!target) return;
    const ok = await swal.confirm(
      `Move ${a.student.name}'s application back to “${STATUS_LABELS[target]}”? The student will be notified by email.`,
      { title: 'Roll back a phase?', confirmText: 'Roll back', variant: 'warning' },
    );
    if (!ok) return;
    setApps((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: target } : x)));
    setSelected((cur) => (cur && cur.id === a.id ? { ...cur, status: target } : cur));
    try {
      await api.applications.setStatus(a.id, target, undefined, true);
      toast.success(`${a.student.name}'s application moved back to “${STATUS_LABELS[target]}”.`, 'Phase rolled back');
    } catch (e: any) {
      swal.error(e?.message || 'Could not roll back the status.');
      load();
    }
  };

  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await api.applications.setStatus(rejectTarget.id, 'REJECTED', rejectReason.trim());
      setApps((prev) => prev.map((x) => (x.id === rejectTarget.id ? { ...x, status: 'REJECTED', rejectionReason: rejectReason.trim() } : x)));
      setSelected((cur) => (cur && cur.id === rejectTarget.id ? { ...cur, status: 'REJECTED', rejectionReason: rejectReason.trim() } : cur));
      toast.success(`${rejectTarget.student.name}'s application was rejected.`, 'Application rejected');
      setRejectTarget(null);
    } catch (e: any) {
      swal.error(e?.message || 'Could not reject the application.');
    } finally {
      setRejecting(false);
    }
  };

  const submitPaymentLink = async () => {
    if (!paymentLinkTarget || !paymentLink.trim()) return;
    setSavingPaymentLink(true);
    try {
      await api.applications.setStatus(paymentLinkTarget.id, 'PAYMENT_PENDING');
      await api.applications.setPayment(paymentLinkTarget.id, 'PENDING', paymentLink.trim());
      setApps((prev) => prev.map((x) => (x.id === paymentLinkTarget.id ? { ...x, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' } : x)));
      setSelected((cur) => (cur && cur.id === paymentLinkTarget.id ? { ...cur, status: 'PAYMENT_PENDING', paymentStatus: 'PENDING' } : cur));
      toast.success(`${paymentLinkTarget.student.name}'s application moved to “${STATUS_LABELS.PAYMENT_PENDING}”.`, 'Application advanced');
      setPaymentLinkTarget(null);
    } catch (e: any) {
      swal.error(e?.message || 'Could not save payment link.');
    } finally {
      setSavingPaymentLink(false);
    }
  };

  const closeDocViewer = () => setDocViewer((v) => { if (v) URL.revokeObjectURL(v.url); return null; });

  const previewDoc = async (doc: StudentDocument, studentId: string) => {
    setLoadingDocId(doc.id);
    try {
      const { url } = await api.agents.studentDocumentUrl(studentId, doc.id);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Could not load document.');
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      setDocViewer((prev) => { if (prev) URL.revokeObjectURL(prev.url); return { url: objectUrl, title: docLabel(doc), type: blob.type }; });
    } catch (e: any) { swal.error(e?.message ?? 'Could not load document.'); }
    finally { setLoadingDocId(null); }
  };

  const setDocStatus = async (doc: StudentDocument, status: DocStatus) => {
    if (doc.status === status) return;
    setSavingDocId(doc.id);
    // optimistic
    const apply = (list: AgentApplication[]) =>
      list.map((a) => a.id === selected?.id
        ? { ...a, documents: a.documents.map((d) => d.id === doc.id ? { ...d, status } : d) }
        : a);
    setApps(apply);
    setSelected((cur) => cur ? { ...cur, documents: cur.documents.map((d) => d.id === doc.id ? { ...d, status } : d) } : cur);
    try {
      await api.agents.verifyDocument(doc.id, status);
      toast.success(`${docLabel(doc)} marked ${status.toLowerCase()}.`, 'Document updated');
    } catch (e: any) {
      swal.error(e?.message || 'Could not update the document.');
      load(); // revert from source of truth
    } finally {
      setSavingDocId(null);
    }
  };

  const filteredApps = apps.filter((a) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      a.student.name.toLowerCase().includes(q) ||
      a.student.email.toLowerCase().includes(q) ||
      a.universityName.toLowerCase().includes(q) ||
      a.course.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const distinctStudents = new Set(apps.map((a) => a.student.id)).size;
  const allDocs = apps.flatMap((a) => a.documents);
  const pendingDocs = allDocs.filter((d) => d.status !== 'VERIFIED' && d.status !== 'REJECTED').length;
  const verifiedDocs = allDocs.filter((d) => d.status === 'VERIFIED').length;

  const agentStats = [
    { label: 'My Students', value: distinctStudents, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Applications', value: apps.length, icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Pending Docs', value: pendingDocs, icon: FileCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Verified Docs', value: verifiedDocs, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
  ];

  const docProgress = (a: AgentApplication) => {
    const total = a.documents.length;
    const verified = a.documents.filter((d) => d.status === 'VERIFIED').length;
    return { total, verified, pct: total ? Math.round((verified / total) * 100) : 0 };
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Agent Portal</h1>
        <p className="text-muted-foreground">Track your students’ course applications and verify their documents.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {agentStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-card/50 backdrop-blur group hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner', stat.bg, stat.color)}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold tracking-tight">{loading ? '—' : stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Course applications */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Course Applications</CardTitle>
              <CardDescription>Applications from the students assigned to you. Open one to verify its documents.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search student, course, university..."
                  className="pl-10 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="outline" size="sm" className="gap-2 h-9">
                    <Filter className="w-4 h-4" />
                    {statusFilter === 'All' ? 'All Phases' : STATUS_LABELS[statusFilter]}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-[220px]">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>Filter by Phase</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                      <DropdownMenuRadioItem value="All">All Phases</DropdownMenuRadioItem>
                      {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
                        <DropdownMenuRadioItem key={s} value={s}>{STATUS_LABELS[s]}</DropdownMenuRadioItem>
                      ))}
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
                  <TableHead className="w-[260px] px-6">Student</TableHead>
                  <TableHead>Application</TableHead>
                  <TableHead className="text-center">Phase</TableHead>
                  <TableHead className="text-center">Documents</TableHead>
                  <TableHead className="text-right px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <BrandedLoader label="Loading applications…" className="py-6" />
                    </TableCell>
                  </TableRow>
                ) : filteredApps.length > 0 ? (
                  filteredApps.map((a) => {
                    const dp = docProgress(a);
                    return (
                      <TableRow key={a.id} className="group">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar name={a.student.name} className="w-9 h-9" />
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">{a.student.name}</span>
                              <span className="text-[11px] text-muted-foreground">{a.student.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{a.universityName}</span>
                            <span className="text-[11px] text-muted-foreground">{a.course}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={cn('px-2 py-0.5 h-auto font-medium text-[10px] tracking-wide whitespace-nowrap', statusBadge[a.status])}>
                            {STATUS_LABELS[a.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all" style={{ width: `${dp.pct}%` }} />
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">{dp.verified}/{dp.total}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 gap-2"
                              onClick={() => setSelected(a)}
                            >
                              Verify Docs <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <button
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-amber-500 hover:bg-amber-500/10 disabled:opacity-30"
                              onClick={() => handleRollback(a)}
                              disabled={a.status === 'REJECTED' || !prevStatus(a.status)}
                              title="Roll back to previous phase"
                            >
                              <Undo2 className="w-4 h-4" />
                            </button>
                            <button
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-green-500 hover:bg-green-500/10 disabled:opacity-30"
                              onClick={() => handleAdvance(a)}
                              disabled={a.status === 'COMPLETED' || a.status === 'REJECTED' || !nextStatus(a.status)}
                              title="Advance to next phase"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              className="h-8 w-8 inline-flex items-center justify-center rounded-md text-red-500 hover:bg-red-500/10 disabled:opacity-30"
                              onClick={() => { setRejectTarget(a); setRejectReason(''); }}
                              disabled={a.status === 'COMPLETED' || a.status === 'REJECTED'}
                              title="Reject application"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-muted-foreground">
                      {apps.length === 0
                        ? 'No applications from your students yet.'
                        : 'No applications match your search or filter.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Verify documents dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); closeDocViewer(); } }}>
        <DialogContent className="sm:max-w-2xl w-[98vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <div className="flex-none p-6 border-b bg-muted/20">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <InitialsAvatar name={selected?.student.name ?? ''} className="w-12 h-12 text-base" />
                <div>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    {selected?.student.name}
                    {selected?.student.isProfileVerified && <ShieldCheck className="w-5 h-5 text-primary" />}
                  </DialogTitle>
                  <DialogDescription>{selected?.universityName} • {selected?.course}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Fact icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={selected?.student.email ?? '—'} />
              <Fact icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={selected?.student.phoneNumber || '—'} />
            </div>

            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Documents</h3>
              {!selected || selected.documents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                  <FileSearch className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selected.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{docLabel(doc)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{doc.docUrl.split('/').pop()}</p>
                      </div>
                      <Badge variant="secondary" className={cn('text-[10px] shrink-0', docBadge(doc.status))}>
                        {doc.status}
                      </Badge>
                      <button
                        onClick={() => selected && previewDoc(doc, selected.student.id)}
                        disabled={loadingDocId === doc.id}
                        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50 shrink-0"
                      >
                        {loadingDocId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                        View
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 shrink-0" disabled={savingDocId === doc.id}>
                            {savingDocId === doc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                            Set status <ChevronDown className="w-2.5 h-2.5" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuRadioGroup value={doc.status} onValueChange={(v) => setDocStatus(doc, v as DocStatus)}>
                              <DropdownMenuRadioItem value="VERIFIED">Verify</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="REJECTED">Reject</DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value="PENDING">Mark pending</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {timeline.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Activity Timeline</h3>
                <ol className="relative border-l border-border ml-2 space-y-4">
                  {timeline.map((t) => {
                    const isMeeting = t.action === 'MEETING_SCHEDULED';
                    const isRollback = t.action.startsWith('ROLLBACK_');
                    const rolledTo = isRollback
                      ? STATUS_LABELS[t.action.slice('ROLLBACK_'.length) as ApplicationStatus] ?? t.action.slice('ROLLBACK_'.length).replace(/_/g, ' ')
                      : '';
                    return (
                      <li key={t.id} className="ml-4">
                        <div className={cn('absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full', isRollback ? 'bg-amber-500' : 'bg-primary')} />
                        <div className="flex items-center gap-2">
                          {isMeeting
                            ? <Video className="w-3.5 h-3.5 text-primary" />
                            : isRollback
                              ? <Undo2 className="w-3.5 h-3.5 text-amber-500" />
                              : <ChevronRight className="w-3.5 h-3.5 text-primary" />}
                          <span className={cn('text-sm font-medium', isRollback && 'text-amber-600')}>
                            {isMeeting ? 'Google Meet scheduled' : isRollback ? `Rolled back to ${rolledTo}` : t.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {new Date(t.createdAt).toLocaleString()}
                        </p>
                        {isMeeting && t.meetingLink && (
                          <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
                            {t.meetingAt && <p className="text-xs font-medium text-foreground">{new Date(t.meetingAt).toLocaleString()}</p>}
                            <a
                              href={t.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                            >
                              <Video className="w-3.5 h-3.5" /> Join Google Meet
                            </a>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>

          <div className="flex-none p-4 border-t bg-muted/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Phase</span>
              {selected && (
                <Badge variant="secondary" className={cn('text-[10px]', statusBadge[selected.status])}>
                  {STATUS_LABELS[selected.status]}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => { setSelected(null); closeDocViewer(); }}>Close</Button>
              {selected && selected.status !== 'COMPLETED' && selected.status !== 'REJECTED' && (
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => { setRejectTarget(selected); setRejectReason(''); }}
                >
                  <XCircle className="w-4 h-4" /> Reject
                </Button>
              )}
              {selected && selected.status !== 'REJECTED' && prevStatus(selected.status) && (
                <Button variant="outline" className="gap-2" onClick={() => handleRollback(selected)}>
                  <Undo2 className="w-4 h-4" /> Roll back to {STATUS_LABELS[prevStatus(selected.status)!]}
                </Button>
              )}
              {selected && nextStatus(selected.status) && (
                <Button className="gap-2" onClick={() => handleAdvance(selected)}>
                  <CheckCircle2 className="w-4 h-4" /> Advance to {STATUS_LABELS[nextStatus(selected.status)!]}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onOpenChange={(o) => !o && setRejectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" /> Reject Application
            </DialogTitle>
            <DialogDescription>
              {rejectTarget?.student.name} — {rejectTarget?.universityName}, {rejectTarget?.course}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium">Rejection reason <span className="text-destructive">*</span></label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this application is being rejected..."
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

      {/* Payment link dialog */}
      <Dialog open={!!paymentLinkTarget} onOpenChange={(o) => !o && setPaymentLinkTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Add Payment Link
            </DialogTitle>
            <DialogDescription>
              {paymentLinkTarget?.student.name} — {paymentLinkTarget?.universityName}, {paymentLinkTarget?.course}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium">Payment link <span className="text-destructive">*</span></label>
            <input
              type="url"
              value={paymentLink}
              onChange={(e) => setPaymentLink(e.target.value)}
              placeholder="https://pay.flywire.com/..."
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Shown to the student so they can complete payment.</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setPaymentLinkTarget(null)}>Cancel</Button>
            <Button disabled={!paymentLink.trim() || savingPaymentLink} onClick={submitPaymentLink} className="gap-2">
              {savingPaymentLink && <Loader2 className="w-4 h-4 animate-spin" />} Save &amp; Advance
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DocumentViewer
        open={!!docViewer}
        url={docViewer?.url ?? null}
        title={docViewer?.title ?? 'Document'}
        type={docViewer?.type}
        onClose={closeDocViewer}
      />
    </div>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
        {icon} {label}
      </div>
      <p className="mt-1 text-sm font-medium break-words">{value}</p>
    </div>
  );
}
