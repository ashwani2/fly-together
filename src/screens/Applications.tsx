import React, { useEffect, useState } from 'react';
import {
  CheckCircle2, Clock, CreditCard, ShieldCheck, Loader2, GraduationCap, Plus, ChevronRight, XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api, type Application, type ApplicationTimelineEntry } from '@/lib/api';
import { useNavigate } from 'react-router-dom';

const prettyStatus: Record<string, string> = {
  CREATED: 'Created',
  REJECTED: 'Rejected',
  DOCUMENT_VERIFIED: 'Document Verified',
  SENT_TO_UNIVERSITY: 'Sent to University',
  PENDING_WITH_UNIVERSITY: 'Pending with University',
  VERIFIED_BY_UNIVERSITY: 'Verified by University',
  PAYMENT_PENDING: 'Payment Pending',
  COMPLETED: 'Completed',
};

const prettyAction = (action: string) => {
  const stripped = action.replace(/^STATUS_/, '').replace(/^PAYMENT_/, 'PAYMENT_');
  return prettyStatus[stripped] ?? stripped.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case 'COMPLETED':          return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'REJECTED':           return 'bg-red-500/10 text-red-600 border-red-500/20';
    case 'PAYMENT_PENDING':    return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'VERIFIED_BY_UNIVERSITY': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'PENDING_WITH_UNIVERSITY': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    case 'SENT_TO_UNIVERSITY': return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
    case 'DOCUMENT_VERIFIED':  return 'bg-teal-500/10 text-teal-600 border-teal-500/20';
    default:                   return 'bg-muted text-muted-foreground';
  }
};

export default function Applications() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<ApplicationTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApps = async (selectId?: string) => {
    setLoading(true);
    try {
      const list = await api.applications.list();
      setApps(list);
      const sel = (selectId && list.find((a) => a.id === selectId)) || list[0] || null;
      setSelected(sel);
      setTimeline(sel ? await api.applications.timeline(sel.id) : []);
    } catch (e) {
      console.error('Failed to load applications', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const selectApp = async (a: Application) => {
    setSelected(a);
    try { setTimeline(await api.applications.timeline(a.id)); } catch { setTimeline([]); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">My Applications</h1>
          <p className="text-muted-foreground">Track every application from submission to enrollment.</p>
        </div>
        <Button onClick={() => navigate('/search')} className="gap-2 rounded-full shrink-0">
          <Plus className="w-4 h-4" /> Create Application
        </Button>
      </div>

      {apps.length === 0 ? (
        <div className="text-center py-20 space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <GraduationCap className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">No applications yet</h2>
            <p className="text-muted-foreground">Create your first application to start your study-abroad journey.</p>
          </div>
          <Button onClick={() => navigate('/search')} size="lg" className="rounded-full px-8 gap-2">
            <Plus className="w-4 h-4" /> Create Application
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List */}
          <div className="lg:col-span-1 space-y-3">
            {apps.map((a) => (
              <button
                key={a.id}
                onClick={() => selectApp(a)}
                className={cn(
                  'w-full text-left rounded-2xl border p-4 transition-all hover:shadow-md',
                  selected?.id === a.id ? 'border-primary ring-1 ring-primary bg-primary/5' : 'border-border bg-card',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-sm leading-tight">{a.universityName}</span>
                  <ChevronRight className={cn('w-4 h-4 shrink-0 mt-0.5 transition-colors', selected?.id === a.id ? 'text-primary' : 'text-muted-foreground')} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{a.course}</p>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="secondary" className={cn('text-[10px] uppercase tracking-wide', statusBadgeClass(a.status))}>
                    {prettyAction(a.status)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {new Date(a.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Detail */}
          {selected && (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{selected.universityName}</CardTitle>
                  <CardDescription>
                    {selected.course} — <span className="font-medium text-foreground">{prettyAction(selected.status)}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {selected.status === 'REJECTED' && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                      <div>
                        <p className="text-sm font-semibold text-red-600">Application Rejected</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {selected.rejectionReason || 'No reason provided. Please contact your agent for more details.'}
                        </p>
                      </div>
                    </div>
                  )}
                  <h3 className="text-sm font-bold mb-4 text-muted-foreground uppercase tracking-wide">Journey Timeline</h3>
                  <div className="space-y-6">
                    {timeline.map((item, idx) => {
                      const isLast = idx === timeline.length - 1;
                      return (
                        <div key={item.id} className="relative flex gap-4">
                          <div
                            className={cn(
                              'flex items-center justify-center w-10 h-10 rounded-full border border-card shadow shrink-0 z-10',
                              isLast ? 'bg-background border-primary text-primary animate-pulse' : 'bg-primary text-primary-foreground',
                            )}
                          >
                            {isLast ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 p-4 rounded-xl border bg-card shadow-sm">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="font-bold text-foreground">{prettyAction(item.action)}</div>
                              <time className="font-mono text-xs text-primary">{new Date(item.createdAt).toLocaleDateString()}</time>
                            </div>
                            <div className="text-muted-foreground text-sm">
                              {item.action === 'CREATED' ? 'Your application was submitted.' : 'Status updated by the Fly Together team.'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Payment */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Payment
                  </CardTitle>
                  <CardDescription>Secure your enrollment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-xl bg-background border shadow-sm flex items-center justify-between">
                    <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Payment status</span>
                    <Badge
                      variant="secondary"
                      className={
                        selected.paymentStatus === 'COMPLETED'
                          ? 'bg-green-500/10 text-green-600 border-green-500/20'
                          : selected.paymentStatus === 'FAILED'
                            ? 'bg-red-500/10 text-red-600 border-red-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }
                    >
                      {selected.paymentStatus.charAt(0) + selected.paymentStatus.slice(1).toLowerCase()}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  {selected.paymentStatus === 'COMPLETED' ? (
                    <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500/10 py-3 text-sm font-bold text-green-600">
                      <CheckCircle2 className="h-5 w-5" /> Payment complete
                    </div>
                  ) : selected.paymentLink ? (
                    <>
                      <Button
                        className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                        onClick={() => window.open(selected.paymentLink!, '_blank', 'noopener,noreferrer')}
                      >
                        Pay Securely Now
                      </Button>
                      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                        <ShieldCheck className="w-3 h-3" />
                        Secured payment via Flywire
                      </div>
                    </>
                  ) : (
                    <div className="w-full rounded-xl border border-dashed border-border bg-muted/40 p-5 text-center">
                      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-amber-500/10 text-amber-600">
                        <Clock className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Awaiting payment link</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Your payment link will appear here once your application is reviewed and the university issues it. We'll notify you.
                      </p>
                    </div>
                  )}
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
