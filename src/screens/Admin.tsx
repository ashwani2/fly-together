
import React, { useState, useEffect, useCallback } from 'react';
import {
  api,
  docLabel,
  type AdminStats,
  type AdminApplication,
  type AdminStudentSummary,
  type AdminStudentDetail,
  type AgentSummary,
  type ApplicationStatus,
  type ApplicationTimelineEntry,
  type StudentDocument,
  type DocStatus,
  type SopLead,
} from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import { DocumentViewer } from '@/components/DocumentViewer';
import { swal } from '@/lib/swal';
import { toast } from '@/lib/toast';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  FileText as FileIcon,
  GraduationCap,
  FileCheck,
  Mail,
  Phone,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  CreditCard,
  UserX,
  FileSearch,
  BadgeCheck,
  CalendarDays,
  MapPin,
  Sparkles,
  Copy,
  Download,
  Check,
  Pencil,
  Undo2,
  Video,
} from 'lucide-react';
import { Markdown } from '@/lib/markdown';
import { downloadSopPdf, downloadSopDocx } from '@/lib/sopExport';
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
  DropdownMenuItem,
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
import { BrandedLoader } from '@/components/BrandedLoader';

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

// Previous phase in the pipeline — used to roll an application back a step.
const prevStatus = (s: ApplicationStatus): ApplicationStatus | null => {
  const idx = STATUS_ORDER.indexOf(s);
  if (idx <= 0) return null;
  return STATUS_ORDER[idx - 1];
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
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ApplicationStatus>('All');

  // Server-side pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [appsLoading, setAppsLoading] = useState(true);
  const [pageSizeMenuOpen, setPageSizeMenuOpen] = useState(false);

  const [selected, setSelected] = useState<AdminApplication | null>(null);
  const [timeline, setTimeline] = useState<ApplicationTimelineEntry[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<StudentDocument[]>([]);
  const [selectedDocsLoading, setSelectedDocsLoading] = useState(false);

  const [rejectTarget, setRejectTarget] = useState<AdminApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const [paymentLinkTarget, setPaymentLinkTarget] = useState<AdminApplication | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [savingPaymentLink, setSavingPaymentLink] = useState(false);

  // Student list dialog (server-side paginated + searched)
  const [studentListOpen, setStudentListOpen] = useState(false);
  const [studentList, setStudentList] = useState<AdminStudentSummary[]>([]);
  const [studentListLoading, setStudentListLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDebouncedSearch, setStudentDebouncedSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentPageSize, setStudentPageSize] = useState(10);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentTotalPages, setStudentTotalPages] = useState(1);
  const [studentPageSizeMenuOpen, setStudentPageSizeMenuOpen] = useState(false);

  // Student detail dialog
  const [studentDetail, setStudentDetail] = useState<AdminStudentDetail | null>(null);
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [docActionId, setDocActionId] = useState<string | null>(null);
  const [docBulkBusy, setDocBulkBusy] = useState(false);
  const [docViewer, setDocViewer] = useState<{ url: string; title: string; type: string } | null>(null);

  // SOP generation dialog
  const [sopTarget, setSopTarget] = useState<AdminApplication | null>(null);
  const [sopPhase, setSopPhase] = useState<'form' | 'result'>('form');
  const [sopForm, setSopForm] = useState({ fullName: '', country: '', university: '', campus: '', course: '' });
  const [sopLoading, setSopLoading] = useState(false);
  const [sopContent, setSopContent] = useState('');
  const [sopMode, setSopMode] = useState<'view' | 'edit'>('view');
  const [sopCopied, setSopCopied] = useState(false);

  // SOP Leads dialog (server-side paginated + searched) — captured from the
  // public landing-page SOP generator.
  const [sopLeadsOpen, setSopLeadsOpen] = useState(false);
  const [sopLeads, setSopLeads] = useState<SopLead[]>([]);
  const [sopLeadsLoading, setSopLeadsLoading] = useState(false);
  const [sopLeadSearch, setSopLeadSearch] = useState('');
  const [sopLeadDebouncedSearch, setSopLeadDebouncedSearch] = useState('');
  const [sopLeadPage, setSopLeadPage] = useState(1);
  const [sopLeadPageSize, setSopLeadPageSize] = useState(10);
  const [sopLeadTotal, setSopLeadTotal] = useState(0);
  const [sopLeadTotalPages, setSopLeadTotalPages] = useState(1);
  const [sopLeadPageSizeMenuOpen, setSopLeadPageSizeMenuOpen] = useState(false);

  // Schedule Google Meet dialog
  const [meetTarget, setMeetTarget] = useState<AdminApplication | null>(null);
  const [meetDate, setMeetDate] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [meetNote, setMeetNote] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Stats + agent network — loaded once.
  const loadMeta = useCallback(async () => {
    try {
      const [s, ag] = await Promise.all([api.admin.stats(), api.agents.list()]);
      setStats(s);
      setAgents(ag);
    } catch (e) {
      console.error('Failed to load admin data', e);
      swal.error('Could not load admin data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  // Course applications — paginated/searched/filtered server-side.
  const fetchApps = useCallback(async () => {
    setAppsLoading(true);
    try {
      const res = await api.admin.applications({ page, pageSize, search: debouncedSearch, status: statusFilter });
      setApps(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      // Clamp if we ran past the last page (e.g. after filtering or deletions).
      if (res.page > res.totalPages) setPage(res.totalPages);
    } catch (e: any) {
      swal.error(e?.message || 'Could not load applications.');
    } finally {
      setAppsLoading(false);
    }
  }, [page, pageSize, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // Debounce the search box → reset to first page when the query settles.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const refreshApps = () => { fetchApps(); };

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
    // Advancing to PAYMENT_PENDING initializes a Flywire payment first.
    if (target === 'PAYMENT_PENDING') {
      setPaymentLinkTarget(application);
      setPaymentAmount('');
      return;
    }
    setApps((prev) => prev.map((a) => (a.id === application.id ? { ...a, status: target } : a)));
    // Keep the open details modal (if any) in sync — it stays open until the admin closes it.
    setSelected((cur) => (cur && cur.id === application.id ? { ...cur, status: target } : cur));
    try {
      await api.applications.setStatus(application.id, target);
      // When marking COMPLETED, also close out the payment status.
      if (target === 'COMPLETED') {
        await api.applications.setPayment(application.id, 'COMPLETED', application.paymentLink ?? undefined);
        setApps((prev) => prev.map((a) => (a.id === application.id ? { ...a, paymentStatus: 'COMPLETED' } : a)));
        setSelected((cur) => (cur && cur.id === application.id ? { ...cur, paymentStatus: 'COMPLETED' } : cur));
      }
      // Refresh the timeline shown in the open modal so the new phase appears.
      if (selected?.id === application.id) {
        api.applications.timeline(application.id).then(setTimeline).catch(() => {});
      }
      toast.success(
        `${application.student.name}'s application moved to “${STATUS_LABELS[target]}”.`,
        'Application advanced',
      );
    } catch (e: any) {
      swal.error(e?.message || 'Could not update status.');
      refreshApps();
    }
  };

  const handleRollback = async (application: AdminApplication) => {
    const target = prevStatus(application.status);
    if (!target) return;
    const ok = await swal.confirm(
      `Move ${application.student.name}'s application back to “${STATUS_LABELS[target]}”? The student will be notified by email.`,
      { title: 'Roll back a phase?', confirmText: 'Roll back', variant: 'warning' },
    );
    if (!ok) return;
    setApps((prev) => prev.map((a) => (a.id === application.id ? { ...a, status: target } : a)));
    setSelected((cur) => (cur && cur.id === application.id ? { ...cur, status: target } : cur));
    try {
      await api.applications.setStatus(application.id, target, undefined, true);
      if (selected?.id === application.id) {
        api.applications.timeline(application.id).then(setTimeline).catch(() => {});
      }
      toast.success(
        `${application.student.name}'s application moved back to “${STATUS_LABELS[target]}”.`,
        'Phase rolled back',
      );
    } catch (e: any) {
      swal.error(e?.message || 'Could not roll back the status.');
      refreshApps();
    }
  };

  const openMeetDialog = (application: AdminApplication) => {
    setMeetTarget(application);
    setMeetDate('');
    setMeetLink('');
    setMeetNote('');
  };

  const submitMeeting = async () => {
    if (!meetTarget || !meetDate || !meetLink.trim()) return;
    setScheduling(true);
    try {
      const scheduledAt = new Date(meetDate).toISOString();
      await api.applications.scheduleMeeting(meetTarget.id, {
        scheduledAt,
        meetLink: meetLink.trim(),
        note: meetNote.trim() || undefined,
      });
      // Refresh the open details timeline so the meeting appears immediately.
      if (selected?.id === meetTarget.id) {
        api.applications.timeline(meetTarget.id).then(setTimeline).catch(() => {});
      }
      toast.success(
        `Google Meet scheduled for ${meetTarget.student.name}. The student has been emailed the link.`,
        'Meeting scheduled',
      );
      setMeetTarget(null);
    } catch (e: any) {
      swal.error(e?.message || 'Could not schedule the meeting.');
    } finally {
      setScheduling(false);
    }
  };

  const submitPaymentLink = async () => {
    const amount = Number(paymentAmount);
    if (!paymentLinkTarget || !(amount > 0)) return;
    setSavingPaymentLink(true);
    try {
      // Initialize a real Flywire payment — this advances the application to
      // PAYMENT_PENDING and stores the pay link returned by Flywire.
      const updated = await api.applications.initializeFlywire(paymentLinkTarget.id, amount);
      setApps((prev) =>
        prev.map((a) =>
          a.id === paymentLinkTarget.id
            ? { ...a, status: 'PAYMENT_PENDING' as ApplicationStatus, paymentLink: updated.paymentLink, paymentStatus: updated.paymentStatus }
            : a,
        ),
      );
      setSelected((cur) =>
        cur && cur.id === paymentLinkTarget.id
          ? { ...cur, status: 'PAYMENT_PENDING' as ApplicationStatus, paymentLink: updated.paymentLink, paymentStatus: updated.paymentStatus }
          : cur,
      );
      if (selected?.id === paymentLinkTarget.id) {
        api.applications.timeline(paymentLinkTarget.id).then(setTimeline).catch(() => {});
      }
      toast.success(
        `Flywire payment initialized for ${paymentLinkTarget.student.name}. Application moved to “${STATUS_LABELS.PAYMENT_PENDING}”.`,
        'Payment initialized',
      );
      setPaymentLinkTarget(null);
    } catch (e: any) {
      swal.error(e?.message || 'Could not initialize the Flywire payment.');
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
    setSelectedDocs([]);
    setTimelineLoading(true);
    setSelectedDocsLoading(true);
    // Timeline + the applicant's documents, in parallel.
    api.applications.timeline(application.id)
      .then(setTimeline)
      .catch(() => { /* ignore */ })
      .finally(() => setTimelineLoading(false));
    api.admin.studentDetail(application.student.id)
      .then((detail) => setSelectedDocs(detail.documents))
      .catch(() => { /* ignore */ })
      .finally(() => setSelectedDocsLoading(false));
  };

  const openStudentList = () => {
    setStudentSearch('');
    setStudentDebouncedSearch('');
    setStudentPage(1);
    setStudentListOpen(true);
  };

  const fetchStudents = useCallback(async () => {
    setStudentListLoading(true);
    try {
      const res = await api.admin.students({ page: studentPage, pageSize: studentPageSize, search: studentDebouncedSearch });
      setStudentList(res.items);
      setStudentTotal(res.total);
      setStudentTotalPages(res.totalPages);
      if (res.page > res.totalPages) setStudentPage(res.totalPages);
    } catch { swal.error('Could not load students.'); }
    finally { setStudentListLoading(false); }
  }, [studentPage, studentPageSize, studentDebouncedSearch]);

  useEffect(() => {
    if (studentListOpen) fetchStudents();
  }, [studentListOpen, fetchStudents]);

  // Debounce the student search → reset to first page.
  useEffect(() => {
    const t = setTimeout(() => {
      setStudentDebouncedSearch(studentSearch.trim());
      setStudentPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [studentSearch]);

  const openSopLeads = () => {
    setSopLeadSearch('');
    setSopLeadDebouncedSearch('');
    setSopLeadPage(1);
    setSopLeadsOpen(true);
  };

  const fetchSopLeads = useCallback(async () => {
    setSopLeadsLoading(true);
    try {
      const res = await api.sopLeads.list({ page: sopLeadPage, pageSize: sopLeadPageSize, search: sopLeadDebouncedSearch });
      setSopLeads(res.items);
      setSopLeadTotal(res.total);
      setSopLeadTotalPages(res.totalPages);
      if (res.page > res.totalPages) setSopLeadPage(res.totalPages);
    } catch { swal.error('Could not load SOP leads.'); }
    finally { setSopLeadsLoading(false); }
  }, [sopLeadPage, sopLeadPageSize, sopLeadDebouncedSearch]);

  useEffect(() => {
    if (sopLeadsOpen) fetchSopLeads();
  }, [sopLeadsOpen, fetchSopLeads]);

  // Debounce the SOP-lead search → reset to first page.
  useEffect(() => {
    const t = setTimeout(() => {
      setSopLeadDebouncedSearch(sopLeadSearch.trim());
      setSopLeadPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [sopLeadSearch]);

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

  const previewDoc = async (doc: StudentDocument, studentId: string) => {
    setLoadingDocId(doc.id);
    try {
      const { url } = await api.admin.studentDocumentUrl(studentId, doc.id);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Could not load document.');
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      setDocViewer((prev) => { if (prev) URL.revokeObjectURL(prev.url); return { url: objectUrl, title: docLabel(doc), type: blob.type }; });
    } catch (e: any) { swal.error(e?.message ?? 'Could not load document.'); }
    finally { setLoadingDocId(null); }
  };

  // Reflect a document status change in whichever open list holds it.
  const applyDocStatusLocal = (docId: string, status: DocStatus) => {
    setSelectedDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, status } : d)));
    setStudentDetail((prev) => prev ? { ...prev, documents: prev.documents.map((d) => (d.id === docId ? { ...d, status } : d)) } : prev);
  };

  const reviewDoc = async (doc: StudentDocument, status: DocStatus) => {
    setDocActionId(doc.id);
    try {
      await api.documents.verify(doc.id, status);
      applyDocStatusLocal(doc.id, status);
      toast.success(`${docLabel(doc)} ${status === 'VERIFIED' ? 'verified' : 'rejected'}.`, 'Document updated');
      // A rejection prompts the student to re-upload — refresh the open timeline so it shows.
      if (status === 'REJECTED' && selected) api.applications.timeline(selected.id).then(setTimeline).catch(() => {});
    } catch (e: any) {
      swal.error(e?.message || 'Could not update the document.');
    } finally {
      setDocActionId(null);
    }
  };

  const reviewAllDocs = async (docs: StudentDocument[], status: DocStatus) => {
    const targets = docs.filter((d) => d.status !== status);
    if (!targets.length) return;
    setDocBulkBusy(true);
    try {
      await Promise.all(targets.map((d) => api.documents.verify(d.id, status)));
      targets.forEach((d) => applyDocStatusLocal(d.id, status));
      toast.success(`All documents ${status === 'VERIFIED' ? 'verified' : 'rejected'}.`, 'Documents updated');
      if (status === 'REJECTED' && selected) api.applications.timeline(selected.id).then(setTimeline).catch(() => {});
    } catch (e: any) {
      swal.error(e?.message || 'Could not update the documents.');
    } finally {
      setDocBulkBusy(false);
    }
  };

  const openSopDialog = (application: AdminApplication) => {
    setSopTarget(application);
    setSopPhase('form');
    setSopContent('');
    setSopMode('view');
    setSopCopied(false);
    setSopForm({
      fullName: application.student.name,
      country: '',
      university: application.universityName,
      campus: '',
      course: application.course,
    });
  };

  const runSopGeneration = async () => {
    if (!sopForm.fullName.trim() || !sopForm.university.trim() || !sopForm.course.trim()) return;
    setSopLoading(true);
    try {
      const sop = await api.sop.generate({
        fullName: sopForm.fullName.trim(),
        country: sopForm.country.trim() || undefined,
        university: sopForm.university.trim(),
        campus: sopForm.campus.trim() || undefined,
        course: sopForm.course.trim(),
      });
      setSopContent(sop);
      setSopMode('view');
      setSopPhase('result');
    } catch (e: any) {
      swal.error(e?.message || 'Could not generate the SOP. Please try again.');
    } finally {
      setSopLoading(false);
    }
  };

  const copySop = async () => {
    try {
      await navigator.clipboard.writeText(sopContent);
      setSopCopied(true);
      setTimeout(() => setSopCopied(false), 2000);
    } catch {
      swal.error('Could not copy to clipboard.');
    }
  };

  const downloadSop = async (format: 'pdf' | 'docx') => {
    if (!sopTarget) return;
    const base = `SOP-${sopTarget.student.name.replace(/\s+/g, '_')}`;
    try {
      if (format === 'pdf') await downloadSopPdf(sopContent, `${base}.pdf`);
      else await downloadSopDocx(sopContent, `${base}.docx`);
    } catch (e: any) {
      swal.error(e?.message || `Could not export the SOP as ${format.toUpperCase()}.`);
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-muted-foreground">Manage student applications, assign agents, and grow your agent network.</p>
        </div>
        <Button variant="outline" className="gap-2 self-start" onClick={openSopLeads}>
          <Sparkles className="w-4 h-4 text-violet-500" /> SOP Leads
        </Button>
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

      <div className="space-y-6">
        {/* ---------------- Applications ---------------- */}
        <div>
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
                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
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
                    {appsLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-40 text-center">
                          <BrandedLoader label="Loading applications…" className="py-6" />
                        </TableCell>
                      </TableRow>
                    ) : apps.length > 0 ? (
                      apps.map((a) => (
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
                                    <p className="text-[11px] text-muted-foreground/70">Onboard one from the Agent Network page.</p>
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
                                onClick={() => openReject(a)}
                                disabled={a.status === 'COMPLETED' || a.status === 'REJECTED'}
                                title="Reject application"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-violet-500 hover:bg-violet-500/10 disabled:opacity-30"
                                onClick={() => openSopDialog(a)}
                                title="Generate SOP"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                              <button
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-sky-500 hover:bg-sky-500/10 disabled:opacity-30"
                                onClick={() => openMeetDialog(a)}
                                title="Schedule Interview"
                              >
                                <Video className="w-4 h-4" />
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
                          {debouncedSearch || statusFilter !== 'All'
                            ? 'No applications match your search or filter.'
                            : 'No applications have been submitted yet.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t bg-muted/10 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>
                    {total === 0
                      ? 'No results'
                      : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">Rows per page</span>
                    <DropdownMenu open={pageSizeMenuOpen} onOpenChange={setPageSizeMenuOpen}>
                      <DropdownMenuTrigger render={
                        <Button variant="outline" size="sm" className="h-8 gap-1.5">
                          {pageSize}
                          <ChevronDown className="w-3 h-3 opacity-50" />
                        </Button>
                      } />
                      <DropdownMenuContent align="start" className="min-w-[80px]">
                        <DropdownMenuRadioGroup
                          value={String(pageSize)}
                          onValueChange={(v) => { setPageSize(Number(v)); setPage(1); setPageSizeMenuOpen(false); }}
                        >
                          {[5, 10, 20, 50].map((n) => (
                            <DropdownMenuRadioItem key={n} value={String(n)}>{n}</DropdownMenuRadioItem>
                          ))}
                        </DropdownMenuRadioGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={page <= 1 || appsLoading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1"
                    disabled={page >= totalPages || appsLoading}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
              <BrandedLoader label="Loading students…" className="py-16" />
            ) : studentList.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-16">
                {studentDebouncedSearch ? `No students match "${studentDebouncedSearch}".` : 'No students yet.'}
              </p>
            ) : (
              studentList.map((s) => {
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

          {/* Student pagination */}
          <div className="flex-none flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                {studentTotal === 0
                  ? 'No results'
                  : `${(studentPage - 1) * studentPageSize + 1}–${Math.min(studentPage * studentPageSize, studentTotal)} of ${studentTotal}`}
              </span>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">Rows</span>
                <DropdownMenu open={studentPageSizeMenuOpen} onOpenChange={setStudentPageSizeMenuOpen}>
                  <DropdownMenuTrigger render={
                    <Button variant="outline" size="sm" className="h-8 gap-1.5">
                      {studentPageSize}
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  } />
                  <DropdownMenuContent align="start" className="min-w-[80px]">
                    <DropdownMenuRadioGroup
                      value={String(studentPageSize)}
                      onValueChange={(v) => { setStudentPageSize(Number(v)); setStudentPage(1); setStudentPageSizeMenuOpen(false); }}
                    >
                      {[5, 10, 20, 50].map((n) => (
                        <DropdownMenuRadioItem key={n} value={String(n)}>{n}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page {studentPage} of {studentTotalPages}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                disabled={studentPage <= 1 || studentListLoading}
                onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                disabled={studentPage >= studentTotalPages || studentListLoading}
                onClick={() => setStudentPage((p) => Math.min(studentTotalPages, p + 1))}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------- SOP Leads dialog ---------------- */}
      <Dialog open={sopLeadsOpen} onOpenChange={(o) => { setSopLeadsOpen(o); if (!o) setSopLeadSearch(''); }}>
        <DialogContent className="sm:max-w-2xl w-[98vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <div className="flex-none p-6 border-b bg-muted/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-500" /> SOP Leads</DialogTitle>
              <DialogDescription>Prospective students who generated a Statement of Purpose from the website.</DialogDescription>
            </DialogHeader>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={sopLeadSearch}
                onChange={(e) => setSopLeadSearch(e.target.value)}
                placeholder="Search by name, university, course..."
                className="w-full pl-10 pr-4 h-10 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sopLeadsLoading ? (
              <BrandedLoader label="Loading SOP leads…" className="py-16" />
            ) : sopLeads.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-16">
                {sopLeadDebouncedSearch ? `No leads match "${sopLeadDebouncedSearch}".` : 'No SOP leads captured yet.'}
              </p>
            ) : (
              sopLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-4">
                    <InitialsAvatar name={lead.fullName} className="w-10 h-10" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{lead.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {lead.course} · {lead.university}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {lead.country && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <MapPin className="w-3 h-3" /> {lead.country}
                          </span>
                        )}
                        {lead.campus && (
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                            {lead.campus}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
                      <CalendarDays className="w-3.5 h-3.5" /> {fmtDate(lead.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SOP-lead pagination */}
          <div className="flex-none flex flex-col gap-3 border-t bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                {sopLeadTotal === 0
                  ? 'No results'
                  : `${(sopLeadPage - 1) * sopLeadPageSize + 1}–${Math.min(sopLeadPage * sopLeadPageSize, sopLeadTotal)} of ${sopLeadTotal}`}
              </span>
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">Rows</span>
                <DropdownMenu open={sopLeadPageSizeMenuOpen} onOpenChange={setSopLeadPageSizeMenuOpen}>
                  <DropdownMenuTrigger render={
                    <Button variant="outline" size="sm" className="h-8 gap-1.5">
                      {sopLeadPageSize}
                      <ChevronDown className="w-3 h-3 opacity-50" />
                    </Button>
                  } />
                  <DropdownMenuContent align="start" className="min-w-[80px]">
                    <DropdownMenuRadioGroup
                      value={String(sopLeadPageSize)}
                      onValueChange={(v) => { setSopLeadPageSize(Number(v)); setSopLeadPage(1); setSopLeadPageSizeMenuOpen(false); }}
                    >
                      {[5, 10, 20, 50].map((n) => (
                        <DropdownMenuRadioItem key={n} value={String(n)}>{n}</DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Page {sopLeadPage} of {sopLeadTotalPages}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                disabled={sopLeadPage <= 1 || sopLeadsLoading}
                onClick={() => setSopLeadPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                disabled={sopLeadPage >= sopLeadTotalPages || sopLeadsLoading}
                onClick={() => setSopLeadPage((p) => Math.min(sopLeadTotalPages, p + 1))}
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------- Student detail dialog ---------------- */}
      <Dialog open={!!studentDetail || studentDetailLoading} onOpenChange={(o) => { if (!o) { setStudentDetail(null); closeDocViewer(); } }}>
        <DialogContent className="sm:max-w-2xl w-[98vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          {studentDetailLoading || !studentDetail ? (
            <div className="flex justify-center items-center h-64">
              <BrandedLoader label="Loading student…" />
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

                {/* Documents — preview & verify/reject */}
                <DocReviewList
                  docs={studentDetail.documents}
                  studentId={studentDetail.id}
                  previewingId={loadingDocId}
                  busyId={docActionId}
                  bulkBusy={docBulkBusy}
                  onPreview={previewDoc}
                  onSetStatus={reviewDoc}
                  onSetAll={reviewAllDocs}
                />
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

      {/* ---------------- Flywire payment dialog ---------------- */}
      <Dialog open={!!paymentLinkTarget} onOpenChange={(o) => !o && setPaymentLinkTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Initialize Flywire Payment
            </DialogTitle>
            <DialogDescription>
              {paymentLinkTarget?.student.name} — {paymentLinkTarget?.universityName}, {paymentLinkTarget?.course}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium">Amount <span className="text-destructive">*</span></label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="e.g. 4800"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              We'll create the payment with Flywire and generate a secure pay link for the student.
              The amount is charged in the destination's currency.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setPaymentLinkTarget(null)}>Cancel</Button>
            <Button
              disabled={!(Number(paymentAmount) > 0) || savingPaymentLink}
              onClick={submitPaymentLink}
              className="gap-2"
            >
              {savingPaymentLink && <Loader2 className="w-4 h-4 animate-spin" />}
              Initialize &amp; Advance
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
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setSelectedDocs([]); closeDocViewer(); } }}>
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

            {/* Documents — preview & verify/reject */}
            {selected && (
              <DocReviewList
                docs={selectedDocs}
                studentId={selected.student.id}
                loading={selectedDocsLoading}
                previewingId={loadingDocId}
                busyId={docActionId}
                bulkBusy={docBulkBusy}
                onPreview={previewDoc}
                onSetStatus={reviewDoc}
                onSetAll={reviewAllDocs}
              />
            )}

            {/* Timeline */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Activity Timeline</h3>
              {timelineLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : timeline.length > 0 ? (
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
                          <Clock className="w-3 h-3" /> {fmtDate(t.createdAt)}
                        </p>
                        {isMeeting && t.meetingLink && (
                          <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
                            {t.meetingAt && (
                              <p className="text-xs font-medium text-foreground">{new Date(t.meetingAt).toLocaleString()}</p>
                            )}
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
            {selected && selected.status !== 'REJECTED' && prevStatus(selected.status) && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleRollback(selected)}
              >
                <Undo2 className="w-4 h-4" /> Roll back to {STATUS_LABELS[prevStatus(selected.status)!]}
              </Button>
            )}
            {selected && nextStatus(selected.status) && (
              <Button
                className="gap-2"
                onClick={() => handleAdvance(selected)}
              >
                <CheckCircle2 className="w-4 h-4" /> Advance to {STATUS_LABELS[nextStatus(selected.status)!]}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------- Schedule Google Meet dialog ---------------- */}
      <Dialog open={!!meetTarget} onOpenChange={(o) => { if (!o) setMeetTarget(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-sky-500" /> Schedule Interview
            </DialogTitle>
            <DialogDescription>
              {meetTarget?.student.name} — {meetTarget?.universityName}, {meetTarget?.course}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Date &amp; time</label>
              <Input type="datetime-local" value={meetDate} onChange={(e) => setMeetDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Google Meet link</label>
                <a
                  href="https://meet.google.com/new"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                >
                  <Video className="w-3.5 h-3.5" /> Create a meeting
                </a>
              </div>
              <Input
                placeholder="https://meet.google.com/abc-defg-hij"
                value={meetLink}
                onChange={(e) => setMeetLink(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Click “Create a meeting”, copy the link from Google Meet, and paste it here.
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Note <span className="text-muted-foreground">(optional)</span></label>
              <textarea
                value={meetNote}
                onChange={(e) => setMeetNote(e.target.value)}
                rows={2}
                placeholder="Anything the student should prepare or know."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setMeetTarget(null)}>Cancel</Button>
            <Button
              className="gap-2"
              disabled={!meetDate || !meetLink.trim() || scheduling}
              onClick={submitMeeting}
            >
              {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
              Schedule &amp; Email Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------- SOP generator dialog ---------------- */}
      <Dialog open={!!sopTarget} onOpenChange={(o) => { if (!o) { setSopTarget(null); setSopContent(''); } }}>
        <DialogContent className="sm:max-w-3xl w-[98vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <div className="flex-none p-6 border-b bg-muted/20">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-500" /> Statement of Purpose
              </DialogTitle>
              <DialogDescription>
                {sopTarget?.student.name} — {sopTarget?.universityName}, {sopTarget?.course}
              </DialogDescription>
            </DialogHeader>
          </div>

          {sopLoading ? (
            /* Branded fly-together loader */
            <BrandedLoader label="Generating Statement of Purpose…" logoClassName="h-14 md:h-16" className="py-20 gap-8" />
          ) : sopPhase === 'form' ? (
            /* Step 1 — confirm / fill the details used to generate the SOP */
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Review the details below and fill in anything that's missing. These are used to generate the Statement of Purpose.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SopField label="Full Name" required value={sopForm.fullName} onChange={(v) => setSopForm((f) => ({ ...f, fullName: v }))} placeholder="e.g. John Doe" />
                  <SopField label="Country" value={sopForm.country} onChange={(v) => setSopForm((f) => ({ ...f, country: v }))} placeholder="e.g. United Kingdom" />
                  <SopField label="University" required value={sopForm.university} onChange={(v) => setSopForm((f) => ({ ...f, university: v }))} placeholder="e.g. University of Hull" />
                  <SopField label="Campus" value={sopForm.campus} onChange={(v) => setSopForm((f) => ({ ...f, campus: v }))} placeholder="e.g. London Campus" />
                  <div className="sm:col-span-2">
                    <SopField label="Course" required value={sopForm.course} onChange={(v) => setSopForm((f) => ({ ...f, course: v }))} placeholder="e.g. MSc Computer Science" />
                  </div>
                </div>
              </div>
              <div className="flex-none p-4 border-t bg-muted/20 flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setSopTarget(null); setSopContent(''); }}>Cancel</Button>
                <Button
                  className="gap-2"
                  disabled={!sopForm.fullName.trim() || !sopForm.university.trim() || !sopForm.course.trim()}
                  onClick={runSopGeneration}
                >
                  <Sparkles className="w-4 h-4" /> Generate SOP
                </Button>
              </div>
            </>
          ) : (
            /* Step 2 — view / edit the generated SOP */
            <>
              <div className="flex-none flex items-center justify-between gap-2 px-6 py-3 border-b">
                <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
                  <button
                    onClick={() => setSopMode('view')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      sopMode === 'view' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => setSopMode('edit')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      sopMode === 'edit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={copySop}>
                    {sopCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {sopCopied ? 'Copied' : 'Copy'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="outline" size="sm" className="gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Download
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => downloadSop('pdf')} className="gap-2">
                        <FileIcon className="w-4 h-4 text-red-500" /> PDF document
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadSop('docx')} className="gap-2">
                        <FileIcon className="w-4 h-4 text-blue-500" /> Word (.docx)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {sopMode === 'view' ? (
                  <Markdown content={sopContent} className="text-sm text-foreground" />
                ) : (
                  <textarea
                    value={sopContent}
                    onChange={(e) => setSopContent(e.target.value)}
                    rows={20}
                    className="w-full h-full min-h-[24rem] rounded-xl border border-input bg-background px-4 py-3 font-mono text-sm leading-relaxed shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                )}
              </div>

              <div className="flex-none p-4 border-t bg-muted/20 flex justify-between gap-3">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSopPhase('form')}>
                    <Pencil className="w-3.5 h-3.5" /> Edit details
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={runSopGeneration}>
                    <Sparkles className="w-3.5 h-3.5" /> Regenerate
                  </Button>
                </div>
                <Button variant="outline" onClick={() => { setSopTarget(null); setSopContent(''); }}>Close</Button>
              </div>
            </>
          )}
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

function DocReviewList({
  docs,
  studentId,
  loading,
  previewingId,
  busyId,
  bulkBusy,
  onPreview,
  onSetStatus,
  onSetAll,
}: {
  docs: StudentDocument[];
  studentId: string;
  loading?: boolean;
  previewingId: string | null;
  busyId: string | null;
  bulkBusy: boolean;
  onPreview: (doc: StudentDocument, studentId: string) => void;
  onSetStatus: (doc: StudentDocument, status: DocStatus) => void;
  onSetAll: (docs: StudentDocument[], status: DocStatus) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Documents</h3>
        {docs.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm" className="h-7 gap-1.5 text-green-600 border-green-300 hover:bg-green-50"
              disabled={bulkBusy || docs.every((d) => d.status === 'VERIFIED')}
              onClick={() => onSetAll(docs, 'VERIFIED')}
            >
              {bulkBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Verify all
            </Button>
            <Button
              variant="outline" size="sm" className="h-7 gap-1.5 text-red-600 border-red-300 hover:bg-red-50"
              disabled={bulkBusy || docs.every((d) => d.status === 'REJECTED')}
              onClick={() => onSetAll(docs, 'REJECTED')}
            >
              <XCircle className="w-3.5 h-3.5" /> Reject all
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading documents…
        </div>
      ) : docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
          <FileSearch className="w-7 h-7 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => {
            const busy = busyId === doc.id;
            return (
              <div key={doc.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <FileIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{docLabel(doc)}</p>
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
                  onClick={() => onPreview(doc, studentId)}
                  disabled={previewingId === doc.id}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50 shrink-0"
                >
                  {previewingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                  View
                </button>
                <button
                  onClick={() => onSetStatus(doc, 'VERIFIED')}
                  disabled={busy || doc.status === 'VERIFIED'}
                  title="Verify"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md text-green-600 hover:bg-green-500/10 disabled:opacity-30 shrink-0"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onSetStatus(doc, 'REJECTED')}
                  disabled={busy || doc.status === 'REJECTED'}
                  title="Reject (asks student to re-upload)"
                  className="h-8 w-8 inline-flex items-center justify-center rounded-md text-red-600 hover:bg-red-500/10 disabled:opacity-30 shrink-0"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SopField({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
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
