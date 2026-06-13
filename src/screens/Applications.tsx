import React, { useEffect, useState } from 'react';
import {
  CheckCircle2, Clock, CreditCard, ShieldCheck, Loader2, GraduationCap, Plus, X, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { swal } from '@/lib/swal';
import { api, type Application, type ApplicationTimelineEntry, type University } from '@/lib/api';
import { ApplicationPreview } from '@/components/ApplicationPreview';

const prettyAction = (action: string) =>
  action
    .replace(/^STATUS_/, '')
    .replace(/^PAYMENT_/, 'Payment ')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const statusBadgeClass = (status: string) =>
  status === 'COMPLETED'
    ? 'bg-green-500/10 text-green-600 border-green-500/20'
    : status === 'PAYMENT'
      ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      : status === 'VERIFICATION'
        ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        : 'bg-muted text-muted-foreground';

export default function Applications() {
  const [apps, setApps] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<ApplicationTimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ universityName: '', course: '' });
  const [universities, setUniversities] = useState<University[]>([]);
  const [preview, setPreview] = useState<{ universityName: string; course: string } | null>(null);

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
    api.universities.list().then(setUniversities).catch(() => {});
  }, []);

  const selectApp = async (a: Application) => {
    setSelected(a);
    try { setTimeline(await api.applications.timeline(a.id)); } catch { setTimeline([]); }
  };

  const openCreate = () => {
    const uni = universities[0];
    setForm({ universityName: uni?.name ?? '', course: uni?.courses[0] ?? '' });
    setCreateOpen(true);
  };

  const reviewCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.universityName || !form.course) return;
    setCreateOpen(false);
    setPreview({ universityName: form.universityName, course: form.course });
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
        <Button onClick={openCreate} className="gap-2 rounded-full shrink-0">
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
          <Button onClick={openCreate} size="lg" className="rounded-full px-8 gap-2">
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

      {/* Create Application — university + course, then review */}
      {createOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Create Application</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Where would you like to apply?</p>
              </div>
              <button onClick={() => setCreateOpen(false)} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            {universities.length === 0 ? (
              <div className="mt-6 rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                No universities are available right now. Please check back later.
              </div>
            ) : (
              <form onSubmit={reviewCreate} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="uniName">University</Label>
                  <select
                    id="uniName"
                    value={form.universityName}
                    onChange={(e) => {
                      const u = universities.find((x) => x.name === e.target.value);
                      setForm({ universityName: e.target.value, course: u?.courses[0] ?? '' });
                    }}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {universities.map((u) => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course">Course</Label>
                  <select
                    id="course"
                    value={form.course}
                    onChange={(e) => setForm((f) => ({ ...f, course: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {(universities.find((u) => u.name === form.universityName)?.courses ?? []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button type="submit">Review &amp; Continue</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ApplicationPreview
        open={!!preview}
        universityName={preview?.universityName ?? ''}
        course={preview?.course ?? ''}
        onClose={() => setPreview(null)}
        onSubmitted={() => {
          setPreview(null);
          swal.success('Your application has been submitted successfully.', 'Application submitted');
          loadApps();
        }}
      />
    </div>
  );
}
