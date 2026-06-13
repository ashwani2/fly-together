
import React, { useState, useEffect, useCallback } from 'react';
import {
  api,
  type AdminStats,
  type AdminApplication,
  type AgentSummary,
  type ApplicationStatus,
  type ApplicationTimelineEntry,
} from '@/lib/api';
import { swal } from '@/lib/swal';
import {
  Users,
  Search,
  CheckCircle2,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

const STATUS_ORDER: ApplicationStatus[] = ['PROFILE', 'DOCUMENTS', 'VERIFICATION', 'APPLICATION', 'PAYMENT', 'COMPLETED'];
const statusProgress = (s: ApplicationStatus) => Math.round(((STATUS_ORDER.indexOf(s) + 1) / STATUS_ORDER.length) * 100);
const nextStatus = (s: ApplicationStatus) => STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(s) + 1, STATUS_ORDER.length - 1)];

const statusBadge: Record<ApplicationStatus, string> = {
  PROFILE: 'bg-muted text-muted-foreground hover:bg-muted',
  DOCUMENTS: 'bg-slate-500/10 text-slate-500 hover:bg-slate-500/20',
  VERIFICATION: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
  APPLICATION: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  PAYMENT: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
  COMPLETED: 'bg-green-500/10 text-green-600 hover:bg-green-500/20',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

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
    if (target === application.status) {
      swal.info('This application has already reached the final phase.');
      return;
    }
    setApps((prev) => prev.map((a) => (a.id === application.id ? { ...a, status: target } : a)));
    try {
      await api.applications.setStatus(application.id, target);
    } catch (e: any) {
      swal.error(e?.message || 'Could not update status.');
      refreshApps();
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
        {STAT_DEFS.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-card/50 backdrop-blur group hover:shadow-md transition-all">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner', stat.bg, stat.color)}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold tracking-tight">{stats ? stats[stat.key] : '—'}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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
                        {statusFilter === 'All' ? 'All Phases' : statusFilter}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-[180px]">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Filter by Phase</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                          <DropdownMenuRadioItem value="All">All Phases</DropdownMenuRadioItem>
                          {STATUS_ORDER.map((s) => (
                            <DropdownMenuRadioItem key={s} value={s}>{s}</DropdownMenuRadioItem>
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
                              <Avatar className="w-9 h-9 border-2 border-background shadow-sm">
                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${a.student.name}`} />
                                <AvatarFallback>{a.student.name[0]?.toUpperCase()}</AvatarFallback>
                              </Avatar>
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
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${a.agent.name}`} />
                                      <AvatarFallback className="text-[9px]">{a.agent.name[0]?.toUpperCase()}</AvatarFallback>
                                    </Avatar>
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
                                          <Avatar className="h-7 w-7 shrink-0 border border-border">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.name}`} />
                                            <AvatarFallback className="text-[10px]">{agent.name[0]?.toUpperCase()}</AvatarFallback>
                                          </Avatar>
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
                            <Badge variant="secondary" className={cn('px-2 py-0 h-5 font-medium text-[10px] uppercase tracking-wider', statusBadge[a.status])}>
                              {a.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${statusProgress(a.status)}%` }} />
                              </div>
                              <span className="text-[10px] font-mono font-medium text-muted-foreground">{statusProgress(a.status)}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right px-6">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-green-500 hover:bg-green-500/10 disabled:opacity-30"
                                onClick={() => handleAdvance(a)}
                                disabled={a.status === 'COMPLETED'}
                                title="Advance to next phase"
                              >
                                <CheckCircle2 className="w-4 h-4" />
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
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.name}`} />
                              <AvatarFallback>{agent.name[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
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

      {/* ---------------- Application details ---------------- */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-3xl w-[98vw] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
          <div className="flex-none p-6 border-b bg-muted/20">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selected?.student.name}`} />
                  <AvatarFallback>{selected?.student.name[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
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
                <Badge variant="secondary" className={cn('uppercase tracking-wider', statusBadge[selected.status])}>{selected.status}</Badge>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary transition-all" style={{ width: `${statusProgress(selected.status)}%` }} />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{statusProgress(selected.status)}%</span>
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
            {selected && selected.status !== 'COMPLETED' && (
              <Button
                className="gap-2"
                onClick={() => {
                  handleAdvance(selected);
                  setSelected(null);
                }}
              >
                <CheckCircle2 className="w-4 h-4" /> Advance to {nextStatus(selected.status)}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
