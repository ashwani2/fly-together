import { useState, useEffect, useCallback } from 'react';
import { api, type AgentSummary } from '@/lib/api';
import { swal } from '@/lib/swal';
import { toast } from '@/lib/toast';
import { ShieldCheck, Plus, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PasswordField } from '@/components/PasswordField';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { BrandedLoader } from '@/components/BrandedLoader';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const agentSchema = z.object({
  name: z.string().trim().min(1, 'Agent name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type AgentFormValues = z.infer<typeof agentSchema>;

export default function AdminAgents() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
      setAgents(await api.agents.list());
    } catch {
      swal.error('Could not load agents. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onCreateAgent = async (values: AgentFormValues) => {
    try {
      await api.agents.create(values);
      setIsAgentDialogOpen(false);
      resetAgentForm({ name: '', email: '', password: '' });
      setAgents(await api.agents.list());
      toast.success('Agent onboarded. They can now log in with the credentials you set.', 'Agent added');
    } catch (e: any) {
      swal.error(e?.message || 'Could not onboard agent.');
    }
  };

  const handleDeleteAgent = async (agent: AgentSummary) => {
    if (!(await swal.confirm('This removes the agent and unassigns their students.', { title: `Delete ${agent.name}?`, confirmText: 'Delete', variant: 'error' }))) return;
    try {
      await api.agents.remove(agent.id);
      setAgents((prev) => prev.filter((a) => a.id !== agent.id));
      toast.success(`${agent.name} was removed.`, 'Agent deleted');
    } catch (e: any) {
      swal.error(e?.message || 'Could not delete agent.');
    }
  };

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Agent Network</h1>
        <p className="text-muted-foreground">Onboard agents and see how many students each is handling.</p>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Agents</CardTitle>
              <CardDescription>Every agent and the number of students they handle.</CardDescription>
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
          {loading ? (
            <BrandedLoader label="Loading agents…" />
          ) : (
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
                {agents.length > 0 ? (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
