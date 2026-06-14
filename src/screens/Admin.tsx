
import React, { useState, useEffect, useCallback } from 'react';
import {
  api,
  type AdminStats,
  type AdminApplication,
  type AdminStudentSummary,
  type AdminStudentDetail,
  type AgentSummary,
  type ApplicationStatus,
  type ApplicationTimelineEntry,
} from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { DocumentViewer } from '@/components/DocumentViewer';
import { swal } from '@/lib/swal';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  FileText as FileIcon,
  GraduationCap,
  Plus,
  Trash2,
  FileCheck,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  Loader2,
  Clock,
  CreditCard,
  UserX,
  FileSearch,
  BadgeCheck,
  CalendarDays,
  MapPin,
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
  TableRow,
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
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PasswordField } from '@/components/PasswordField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const agentSchema = z.object({
  name: z.string().trim().min(1, 'Agent name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type AgentFormValues = z.infer<typeof agentSchema>;

const STAT_DEFS: { key: keyof AdminStats; label: string; icon: any; color: string; bg: string }[] = [
  { key: 'students', label: 'Total Students', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { key: 'applications', label: 'Applications', icon: FileCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { key: 'universities', label: 'Universities', icon: GraduationCap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { key: 'agents', label: 'Agents', icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
];

const STATUS_ORDER: ApplicationStatus[] = [
  'CREATED',
  'DOCUMENT_VERIFIED',
  'SENT_TO_UNIVERSITY',
  'PENDING_WITH_UNIVERSITY',
  'VERIFIED_BY_UNIVERSITY',
  'PAYMENT_PENDING',
  'COMPLETED',
];

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

const statusProgress = (s: ApplicationStatus) => {
  if (s === 'REJECTED') return 0;
  const idx = STATUS_ORDER.indexOf(s);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / STATUS_ORDER.length) * 100);
};

const nextStatus = (s: ApplicationStatus): ApplicationStatus | null => {
  const idx = STATUS_ORDER.indexOf(s);
  if (idx === -1 || idx === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1];
};

const statusBadge: Record<ApplicationStatus, string> = {
  CREATED: 'bg-muted text-muted-foreground hover:bg-muted',
  REJECTED: 'bg-red-500/10 text-red-600 hover:bg-red-500/20',
  DOCUMENT_VERIFIED: 'bg-teal-500/10 text-teal-600 hover:bg-teal-500/20',
  SENT_TO_UNIVERSITY: 'bg-sky-500/10 text-sky-600 hover:bg-sky-500/20',
  PENDING_WITH_UNIVERSITY: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
  VERIFIED_BY_UNIVERSITY: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20',
  PAYMENT_PENDING: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  COMPLETED: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const AVATAR_COLORS = [
  'bg-rose-500', 'bg-pink-500', 'bg-fuchsia-500', 'bg-purple-500',
  'bg-violet-500', 'bg-indigo-500', 'bg-blue-500', 'bg-sky-500',
  'bg-cyan-500', 'bg-teal-500', 'bg-emerald-500', 'bg-green-500',
  'bg-lime-500', 'bg-yellow-500', 'bg-amber-500', 'bg-orange-500',
];

function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

function avatarColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-center rounded-full text-white font-bold text-sm select-none shrink-0', avatarColor(name), className)}>
      {nameInitials(name)}
    </div>
  );
}

export default function Admin() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>('All');

  const [selected, setSelected] = useState<AdminApplication | null>(null);
  const [timeline, setTimeline] = useState<ApplicationTimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<AdminApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [paymentLinkTarget, setPaymentLinkTarget] = useState<AdminApplication | null>(null);
  const [paymentLink, setPaymentLink] = useState('');
  const [savingPaymentLink, setSavingPaymentLink] = useState(false);

  // Student list dialog
  const [studentListOpen, setStudentListOpen] = useState(false);
  const [studentList, setStudentList] = useState<AdminStudentSummary[]>([]);
  const [studentListLoading, setStudentListLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // Student detail dialog
  const [studentDetail, setStudentDetail] = useState<AdminStudentDetail | null>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [docViewer, setDocViewer] = useState<{ url: string; title: string; type: string } | null>(null);

  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const {
    register: registerAgent,
    handleSubmit: handleAgentSubmit,
    reset: resetAgentForm,
    formState: { errors: agentErrors, isSubmitting: savingAgent },
  } = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '' },
  });

  const load = useCallback(async () => {
    try {
      const [s, a, ag] = await Promise.all([api.admin.stats(), api.admin.applications(), api.agents.list()]);
      setStats(s);
      setApps(a);
      setAgents(ag);
    } catch (e) {
      console.error('Failed to load admin data', e);
      swal.error('Could not load admin data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refreshApps = async () => {
    try {
      const a = await api.admin.applications();
      setApps(a);
    } catch { /* ignore */ }
  };

  const handleAssignAgent = async (application: AdminApplication, agentId: string) => {
    const next = agentId === 'unassigned' ? null : agentId;
    // optimistic
    const agentObj = next ? agents.find((a) => a.id === next) ?? null : null;
    setApps((prev) =>
      prev.map((a) => (a.id === application.id ? { ...a, agent: agentObj ? { id: agentObj.id, name: agentObj.name } : null } : a)),
    );
    try {
      await api.admin.assignAgent(application.id, next);
      // agent student counts change → refresh agents too
      const ag = await api.agents.list();
      setAgents(ag);
    } catch (e: any) {
      swal.error(e?.message || 'Could not assign agent.');
      refreshApps();
    }
  };

  const handleAdvance = async (application: AdminApplication) => {
    const target = nextStatus(application.status);
    if (!target) {
      swal.info('This application has already reached the final phase.');
      return;
    }
    // Advancing to PAYMENT_PENDING requires a payment link first.
    if (target === 'PAYMENT_PENDING') {
      setPaymentLinkTarget(application);
      setPaymentLink('');
      return;
    }
    setApps((prev) => prev.map((a) => (a.id === application.id ? { ...a, status: target } : a)));
    try {
      await api.applications.setStatus(application.id, target);
      // When marking COMPLETED, also close out the payment status.
      if (target === 'COMPLETED') {
        await api.applications.setPayment(application.id, 'COMPLETED', application.paymentLink ?? undefined);
        setApps((prev) => prev.map((a) => (a.id === application.id ? { ...a, paymentStatus: 'COMPLETED' } : a)));
      }
    } catch (e: any) {
      swal.error(e?.message || 'Could not update status.');
      refreshApps();
    }
  };

  const submitPaymentLink = async () => {
    if (!paymentLinkTarget || !paymentLink.trim()) return;
    setSavingPaymentLink(true);
    try {
      await api.applications.setStatus(paymentLinkTarget.id, 'PAYMENT_PENDING');
      await api.applications.setPayment(paymentLinkTarget.id, 'PENDING', paymentLink.trim());
      setApps((prev) =>
        prev.map((a) =>
          a.id === paymentLinkTarget.id
            ? { ...a, status: 'PAYMENT_PENDING' as ApplicationStatus, paymentLink: paymentLink.trim(), paymentStatus: 'PENDING' }
            : a,
        ),
      );
      setPaymentLinkTarget(null);
    } catch (e: any) {
      swal.error(e?.message || 'Could not save payment link.');
    } finally {
      setSavingPaymentLink(false);
    }
  };

  const openReject = (application: AdminApplication) => {
    setRejectTarget(application);
    setRejectReason('');
  };

  const submitReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    setRejecting(true);
    try {
      await api.applications.setStatus(rejectTarget.id, 'REJECTED', rejectReason.trim());
      setApps((prev) =>
        prev.map((a) => a.id === rejectTarget.id ? { ...a, status: 'REJECTED' as ApplicationStatus, rejectionReason: rejectReason.trim() } : a),
      );
      if (selected?.id === rejectTarget.id) setSelected((s) => s ? { ...s, status: 'REJECTED', rejectionReason: rejectReason.trim() } : s);
      setRejectTarget(null);
    } catch (e: any) {
      swal.error(e?.message || 'Could not reject application.');
    } finally {
      setRejecting(false);
    }
  };

  const openDetails = async (application: AdminApplication) => {
    setSelected(application);
    setTimeline([]);
    setTimelineLoading(true);
    try {
      setTimeline(await api.applications.timeline(application.id));
    } catch { /* ignore */ } finally {
      setTimelineLoading(false);
    }
  };

  const onCreateAgent = async (values: AgentFormValues) => {
    try {
      await api.agents.create(values);
      setIsAgentDialogOpen(false);
      resetAgentForm({ name: '', email: '', password: '' });
      const ag = await api.agents.list();
      setAgents(ag);
      swal.success('Agent onboarded successfully. They can now log in with the credentials you set.');
    } catch (e: any) {
      swal.error(e?.message || 'Could not onboard agent.');
    }
  };

  const handleDeleteAgent = async (agent: AgentSummary) => {
    if (!(await swal.confirm('This removes the agent and unassigns their students.', { title: `Delete ${agent.name}?`, confirmText: 'Delete', variant: 'error' }))) return;
    try {
      await api.agents.remove(agent.id);
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      refreshApps();
    } catch (e: any) {
      swal.error(e?.message || 'Could not delete agent.');
    }
  };

  const openStudentList = async () => {
    setStudentListOpen(true);
    setStudentSearch('');
    if (studentList.length) return;
    setStudentListLoading(true);
    try { setStudentList(await api.admin.students()); }
    catch { swal.error('Could not load students.'); }
    finally { setStudentListLoading(false); }
  };

  const openStudentDetail = async (s: AdminStudentSummary) => {
    setStudentDetail(null);
    closeDocViewer();
    setStudentDetailLoading(true);
    try { setStudentDetail(await api.admin.studentDetail(s.id)); }
    catch { swal.error('Could not load student details.'); }
    finally { setStudentDetailLoading(false); }
  };

  const closeDocViewer = () => {
    setDocViewer((v) => { if (v) URL.revokeObjectURL(v.url); return null; });
  };

  const previewDoc = async (doc: { id: string; docUrl: string; docType: string }, studentId: string) => {
    setLoadingDocId(doc.id);
    try {
      const { url } = await api.admin.studentDocumentUrl(studentId, doc.id);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Could not load document.');
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      setDocViewer((prev) => { if (prev) URL.revokeObjectURL(prev.url); return { url: objectUrl, title: doc.docType.replace(/_/g, ' '), type: blob.type }; });
    } catch (e: any) { swal.error(e?.message ?? 'Could not load document.'); }
    finally { setLoadingDocId(null); }
  };

  const filteredStudents = studentList.filter((s) => {
    const q = studentSearch.toLowerCase();
    const name = [s.firstName, s.lastName].filter(Boolean).join(' ');
    return name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

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

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
        <p className="text-muted-foreground">Manage student applications, assign agents, and grow your agent network.</p>
      </div>

      {/* Stat cards — live from DB */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STAT_DEFS.map((stat) => {
          const clickable = stat.key === 'students';
          return (
            <Card
              key={stat.label}
              onClick={clickable ? openStudentList : undefined}
              className={cn(
                'border-none shadow-sm bg-card/50 backdrop-blur group hover:shadow-md transition-all',
                clickable && 'cursor-pointer hover:ring-2 hover:ring-primary/30',
              )}
            >
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner', stat.bg, stat.color)}>
                  <stat.icon className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold tracking-tight">{stats ? stats[stat.key] : '—'}</p>
                  {clickable && <p className="text-[11px] text-primary/70 font-medium">Click to view</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="applications" className="space-y-6">
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="bg-muted/50 p-1 inline-flex w-auto md:w-full justify-start md:justify-center min-w-max">
            <TabsTrigger value="applications" className="gap-2">
              <FileCheck className="w-4 h-4" /> Course Applications
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <ShieldCheck className="w-4 h-4" /> Agent Network
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ---------------- Applications ---------------- */}
        <TabsContent value="applications">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Course Applications</CardTitle>
                  <CardDescription>Every student application, with assigned agent and current phase.</CardDescription>
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
                        {statusFilter === 'All' ? 'All Phases' : STATUS_LABELS[statusFilter as ApplicationStatus]}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-[220px]">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Filter by Phase</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                          <DropdownMenuRadioItem value="All">All Phases</DropdownMenuRadioItem>
                          {([...STATUS_ORDER, 'REJECTED'] as ApplicationStatus[]).map((s) => (
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
                      <TableHead className="text-center">Agent</TableHead>
                      <TableHead className="text-center">Phase</TableHead>
                      <TableHead className="text-center">Progress</TableHead>
                      <TableHead className="text-right px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : filteredApps.length > 0 ? (
                      filteredApps.map((a) => (
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
                            <DropdownMenu>
                              <DropdownMenuTrigger render={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    'h-8 max-w-[170px] gap-2 rounded-full border transition-colors',
                                    a.agent
                                      ? 'border-primary/20 bg-primary/5 text-primary hover:bg-primary/10'
                                      : 'border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/15',
                                  )}
                                >
                                  {a.agent ? (
                                    <InitialsAvatar name={a.agent.name} className="h-5 w-5 text-[8px]" />
                                  ) : (
                                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                  )}
                                  <span className="truncate text-xs font-medium">{a.agent ? a.agent.name : 'Unassigned'}</span>
                                  <ChevronDown className="w-3 h-3 shrink-0 opacity-50" />
                                </Button>
                              } />
                              <DropdownMenuContent align="end" sideOffset={6} className="w-72 p-1.5 shadow-xl">
                                <DropdownMenuGroup>
                                <DropdownMenuLabel className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                  <ShieldCheck className="h-3.5 w-3.5" /> Assign an Agent
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {agents.length === 0 ? (
                                  <div className="px-2 py-4 text-center">
                                    <p className="text-xs text-muted-foreground">No agents yet.</p>
                                    <p className="text-[11px] text-muted-foreground/70">Onboard one from the Agent Network tab.</p>
                                  </div>
                                ) : (
                                  <DropdownMenuRadioGroup
                                    value={a.agent?.id || 'unassigned'}
                                    onValueChange={(val) => handleAssignAgent(a, val)}
                                  >
                                    <div className="max-h-64 overflow-y-auto">
                                      {agents.map((agent) => (
                                        <DropdownMenuRadioItem
                                          key={agent.id}
                                          value={agent.id}
                                          className="gap-2.5 rounded-lg py-2 pr-9 pl-2 data-[checked]:bg-primary/5"
                                        >
                                          <InitialsAvatar name={agent.name} className="h-7 w-7 text-[10px]" />
                                          <div className="flex min-w-0 flex-col leading-tight">
                                            <span className="truncate text-sm font-medium">{agent.name}</span>
                                            <span className="truncate text-[11px] text-muted-foreground">
                                              {agent.numberOfStudents} student{agent.numberOfStudents === 1 ? '' : 's'}
                                            </span>
                                          </div>
                                        </DropdownMenuRadioItem>
                                      ))}
                                    </div>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuRadioItem
                                      value="unassigned"
                                      className="gap-2.5 rounded-lg py-2 pr-9 pl-2 text-destructive focus:bg-destructive/10 focus:text-destructive data-[checked]:bg-destructive/5"
                                    >
                                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-destructive/10">
                                        <UserX className="h-3.5 w-3.5" />
                                      </div>
                                      <div className="flex flex-col leading-tight">
                                        <span className="text-sm font-medium">Unassign agent</span>
                                        <span className="text-[11px] text-destructive/70">Remove the current agent</span>
                                      </div>
                                    </DropdownMenuRadioItem>
                                  </DropdownMenuRadioGroup>
                                )}
                                </DropdownMenuGroup>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className={cn('px-2 py-0.5 h-auto font-medium text-[10px] tracking-wide whitespace-nowrap', statusBadge[a.status])}>
                              {STATUS_LABELS[a.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn('h-full transition-all duration-1000', a.status === 'REJECTED' ? 'bg-red-500' : 'bg-primary')}
                                  style={{ width: `${statusProgress(a.status)}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono font-medium text-muted-foreground">{statusProgress(a.status)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <div className="flex items-center justify-end gap-1">
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
                                onClick={() => openReject(a)}
                                disabled={a.status === 'COMPLETED' || a.status === 'REJECTED'}
                                title="Reject application"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                                onClick={() => openDetails(a)}
                                title="Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                          {apps.length === 0 ? 'No applications have been submitted yet.' : `No applications match "${searchQuery}".`}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------- Agents ---------------- */}
        <TabsContent value="agents">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Agent Network</CardTitle>
                  <CardDescription>Onboard agents and see how many students each is handling.</CardDescription>
                </div>
                <Dialog open={isAgentDialogOpen} onOpenChange={(open) => {
                  setIsAgentDialogOpen(open);
                  if (!open) resetAgentForm({ name: '', email: '', password: '' });
                }}>
                  <DialogTrigger render={
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" /> Onboard Agent
                    </Button>
                  } />
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Onboard New Agent</DialogTitle>
                      <DialogDescription>
                        Creates a login for the agent. They can sign in with the email and password you set below.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAgentSubmit(onCreateAgent)} noValidate className="space-y-4 pt-4">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Agent Name</label>
                        <Input {...registerAgent('name')} placeholder="Full Name" />
                        {agentErrors.name && <p className="px-1 text-xs font-medium text-red-600">{agentErrors.name.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Email Address</label>
                        <Input type="email" {...registerAgent('email')} placeholder="agent@example.com" />
                        {agentErrors.email && <p className="px-1 text-xs font-medium text-red-600">{agentErrors.email.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Temporary Password</label>
                        <PasswordField {...registerAgent('password')} placeholder="At least 8 characters" />
                        {agentErrors.password && <p className="px-1 text-xs font-medium text-red-600">{agentErrors.password.message}</p>}
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAgentDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={savingAgent} className="gap-2">
                          {savingAgent && <Loader2 className="w-4 h-4 animate-spin" />} Onboard Agent
                        </Button>
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
                    <TableHead className="px-6">Agent</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Active Students</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : agents.length > 0 ? (
                    agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <InitialsAvatar name={agent.name} className="h-8 w-8 text-xs" />
                            <span className="font-semibold text-sm">{agent.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{agent.email}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="px-2 py-0.5">{agent.numberOfStudents} Students</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={cn('text-[10px]', agent.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground')}>
                            {agent.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteAgent(agent)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No agents yet. Use “Onboard Agent” to add your first one.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---------------- Student list dialog ---------------- */}
      <Dialog open={studentListOpen} onOpenChange={(o) => { setStudentListOpen(o); if (!o) setStudentSearch(''); }}>
        <DialogContent className="sm:max-w-2xl w-[98vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <div className="flex-none p-6 border-b bg-muted/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> All Students</DialogTitle>
              <DialogDescription>Click any student to view their full profile and documents.</DialogDescription>
            </DialogHeader>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {studentListLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : filteredStudents.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-16">
                {studentSearch ? `No students match "${studentSearch}".` : 'No students yet.'}
              </p>
            ) : (
              filteredStudents.map((s) => {
                const name = [s.firstName, s.lastName].filter(Boolean).join(' ') || s.email;
                return (
                  <button
                    key={s.id}
                    onClick={() => openStudentDetail(s)}
                    className="w-full text-left rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <InitialsAvatar name={name} className="w-10 h-10" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm truncate">{name}</span>
                          {s.isProfileVerified && (
                            <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>
                      <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${s.profileCompletion}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{s.profileCompletion}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{s.documentCount} doc{s.documentCount !== 1 ? 's' : ''}</span>
                          {s.agent && <span className="text-primary/80">· {s.agent.name}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------- Student detail dialog ---------------- */}
      <Dialog open={!!studentDetail || studentDetailLoading} onOpenChange={(o) => { if (!o) { setStudentDetail(null); closeDocViewer(); } }}>
        <DialogContent className="sm:max-w-2xl w-[98vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {studentDetailLoading || !studentDetail ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex-none p-6 border-b bg-muted/20">
                <DialogHeader>
                  <div className="flex items-center gap-4">
                    <InitialsAvatar name={[studentDetail.firstName, studentDetail.lastName].filter(Boolean).join(' ') || studentDetail.email} className="w-12 h-12 text-base" />
                    <div>
                      <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {[studentDetail.firstName, studentDetail.lastName].filter(Boolean).join(' ') || studentDetail.email}
                        {studentDetail.isProfileVerified && <BadgeCheck className="w-5 h-5 text-primary" />}
                      </DialogTitle>
                      <DialogDescription>{studentDetail.email}</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile completion */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground uppercase tracking-wider text-[11px]">Profile Completion</span>
                    <span className="font-mono text-xs font-bold text-primary">{studentDetail.profileCompletion}%</span>
                  </div>
                  <Progress value={studentDetail.profileCompletion} className="h-2" />
                </div>

                {/* Key facts */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Fact icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={studentDetail.email} />
                  <Fact icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={studentDetail.phoneNumber || '—'} />
                  <Fact icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Agent" value={studentDetail.agent?.name || 'Unassigned'} />
                  <Fact icon={<CalendarDays className="w-3.5 h-3.5" />} label="Date of Birth" value={studentDetail.dob ? new Date(studentDetail.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
                  <Fact icon={<MapPin className="w-3.5 h-3.5" />} label="Address" value={studentDetail.address || '—'} />
                  <Fact icon={<BadgeCheck className="w-3.5 h-3.5" />} label="Verified" value={studentDetail.isProfileVerified ? 'Yes' : 'No'} />
                </div>

                {/* Documents */}
                <div className="space-y-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Documents</h3>
                  {studentDetail.documents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                      <FileSearch className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {studentDetail.documents.map((doc) => {
                        return (
                          <div key={doc.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                              <FileIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold">{doc.docType.replace(/_/g, ' ')}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{doc.docUrl.split('/').pop()}</p>
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] shrink-0',
                                doc.status === 'VERIFIED' ? 'bg-green-500/10 text-green-600' :
                                doc.status === 'REJECTED' ? 'bg-red-500/10 text-red-600' :
                                'bg-amber-500/10 text-amber-600',
                              )}
                            >
                              {doc.status}
                            </Badge>
                            <button
                              onClick={() => previewDoc(doc, studentDetail.id)}
                              disabled={loadingDocId === doc.id}
                              className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50 shrink-0"
                            >
                              {loadingDocId === doc.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Eye className="w-3.5 h-3.5" />}
                              Preview
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-none p-4 border-t bg-muted/20 flex justify-between gap-3">
                <Button variant="ghost" size="sm" onClick={() => { setStudentDetail(null); closeDocViewer(); }}>
                  ← Back to list
                </Button>
                <Button variant="outline" onClick={() => { setStudentDetail(null); closeDocViewer(); }}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------------- Payment link dialog ---------------- */}
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
            <p className="text-xs text-muted-foreground">
              This link will be shown to the student on their application page so they can complete payment.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setPaymentLinkTarget(null)}>Cancel</Button>
            <Button
              disabled={!paymentLink.trim() || savingPaymentLink}
              onClick={submitPaymentLink}
              className="gap-2"
            >
              {savingPaymentLink && <Loader2 className="w-4 h-4 animate-spin" />}
              Save &amp; Advance
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------- Reject dialog ---------------- */}
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
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejecting}
              onClick={submitReject}
              className="gap-2"
            >
              {rejecting && <Loader2 className="w-4 h-4 animate-spin" />}
              Reject Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------- Application details ---------------- */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-3xl w-[98vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <div className="flex-none p-6 border-b bg-muted/20">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <InitialsAvatar name={selected?.student.name ?? ''} className="w-12 h-12 text-base" />
                <div className="flex flex-col items-start gap-1">
                  <DialogTitle className="text-xl font-bold tracking-tight">{selected?.student.name}</DialogTitle>
                  <DialogDescription>
                    {selected?.universityName} • {selected?.course}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Key facts */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Fact icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={selected?.student.email ?? '—'} />
              <Fact icon={<Phone className="w-3.5 h-3.5" />} label="Phone" value={selected?.student.phoneNumber || '—'} />
              <Fact icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Agent" value={selected?.agent?.name || 'Unassigned'} />
              <Fact icon={<FileIcon className="w-3.5 h-3.5" />} label="Documents" value={`${selected?.student.documentCount ?? 0} uploaded`} />
              <Fact icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Profile" value={selected?.student.isProfileCompleted ? `Complete (${selected?.student.profileCompletion}%)` : 'Incomplete'} />
              <Fact icon={<CreditCard className="w-3.5 h-3.5" />} label="Payment" value={selected?.paymentStatus ?? '—'} />
            </div>

            {selected && (
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className={cn('tracking-wide whitespace-nowrap', statusBadge[selected.status])}>
                  {STATUS_LABELS[selected.status]}
                </Badge>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full transition-all', selected.status === 'REJECTED' ? 'bg-red-500' : 'bg-primary')}
                    style={{ width: `${statusProgress(selected.status)}%` }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{statusProgress(selected.status)}%</span>
              </div>
            )}
            {selected?.status === 'REJECTED' && selected.rejectionReason && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Rejection Reason</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{selected.rejectionReason}</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Activity Timeline</h3>
              {timelineLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : timeline.length > 0 ? (
                <ol className="relative border-l border-border ml-2 space-y-4">
                  {timeline.map((t) => (
                    <li key={t.id} className="ml-4">
                      <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-primary" />
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-3.5 h-3.5 text-primary" />
                        <span className="text-sm font-medium">{t.action.replace(/_/g, ' ')}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {fmtDate(t.createdAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              )}
            </div>
          </div>

          <div className="p-4 border-t bg-muted/20 flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
            {selected && selected.status !== 'COMPLETED' && selected.status !== 'REJECTED' && (
              <Button
                variant="destructive"
                className="gap-2"
                onClick={() => { openReject(selected); setSelected(null); }}
              >
                <XCircle className="w-4 h-4" /> Reject
              </Button>
            )}
            {selected && nextStatus(selected.status) && (
              <Button
                className="gap-2"
                onClick={() => { handleAdvance(selected); setSelected(null); }}
              >
                <CheckCircle2 className="w-4 h-4" /> Advance to {STATUS_LABELS[nextStatus(selected.status)!]}
              </Button>
            )}
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

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
        {icon} {label}
      </div>
      <p className="mt-1 text-sm font-medium break-words">{value}</p>
    </div>
  );
}
