import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Banknote,
  Plus,
  ChevronRight,
  XCircle,
  FileText,
  Upload,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api, resolveSignedUrl, type LoanApplication, type LoanApplicationTimeline, type LoanStatus } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { swal } from '@/lib/swal';
import { toast } from '@/lib/toast';

const STATUS_LABELS: Record<LoanStatus, string> = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  DOCUMENTS_REQUESTED: 'Documents Requested',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  DISBURSED: 'Disbursed',
};

const ACTION_LABELS: Record<string, string> = {
  SUBMITTED: 'Application submitted',
  UNDER_REVIEW: 'Application under review',
  DOCUMENTS_REQUESTED: 'Additional documents requested',
  DOCUMENTS_SUBMITTED: 'Documents submitted — resuming review',
  APPROVED: 'Loan approved',
  REJECTED: 'Application rejected',
  DISBURSED: 'Loan disbursed',
};

const STATUS_BADGE: Record<LoanStatus, string> = {
  SUBMITTED: 'bg-muted text-muted-foreground',
  UNDER_REVIEW: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  DOCUMENTS_REQUESTED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  APPROVED: 'bg-green-500/10 text-green-600 border-green-500/20',
  REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20',
  DISBURSED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const PIPELINE_STEPS: { status: LoanStatus; label: string }[] = [
  { status: 'SUBMITTED', label: 'Submitted' },
  { status: 'UNDER_REVIEW', label: 'Under Review' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'DISBURSED', label: 'Disbursed' },
];
const PIPELINE_ORDER: LoanStatus[] = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED'];

function prettyAction(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Inline upload component for reupload flows ───────────────────────────────
type UploadSlot = { key: string; signedPath: string; fileName: string };

function DocSlot({
  docKey,
  label,
  slot,
  uploadingDoc,
  onUpload,
  required,
}: {
  docKey: string;
  label: string;
  slot: UploadSlot | undefined;
  uploadingDoc: string | null;
  onUpload: (docKey: string, file: File) => void;
  required?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isUploading = uploadingDoc === docKey;
  return (
    <div className={cn(
      'flex items-center justify-between gap-3 p-3 rounded-lg border text-sm',
      slot ? 'border-green-500/30 bg-green-500/5' : 'bg-muted/10',
    )}>
      <span className="flex-1 min-w-0">
        {label}
        {required && !slot && <span className="text-destructive ml-1">*</span>}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {slot && (
          <a href={resolveSignedUrl(slot.signedPath)} target="_blank" rel="noopener noreferrer"
            className="text-xs text-primary flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> View
          </a>
        )}
        <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(docKey, f); e.target.value = ''; }}
          disabled={isUploading} />
        {slot ? (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <Button type="button" variant="outline" size="sm" disabled={isUploading}
              onClick={() => inputRef.current?.click()} className="text-xs h-7 px-2">
              {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reupload'}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="secondary" size="sm" disabled={isUploading}
            onClick={() => inputRef.current?.click()}>
            {isUploading
              ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Uploading…</>
              : <><Upload className="w-3 h-3 mr-1.5" />Upload</>}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function MyLoanApplications() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [selected, setSelected] = useState<LoanApplication | null>(null);
  const [timeline, setTimeline] = useState<LoanApplicationTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadedSlots, setUploadedSlots] = useState<Record<string, UploadSlot>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const loadLoans = async (selectId?: string) => {
    setLoading(true);
    try {
      const list = await api.loans.list();
      setLoans(list);
      const sel = (selectId && list.find((l) => l.id === selectId)) || list[0] || null;
      setSelected(sel);
      setTimeline(sel ? await api.loans.timeline(sel.id) : []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLoans(); }, []);

  const selectLoan = async (loan: LoanApplication) => {
    setSelected(loan);
    setUploadedSlots({});
    try { setTimeline(await api.loans.timeline(loan.id)); } catch { setTimeline([]); }
  };

  const handleDocUpload = async (docKey: string, file: File) => {
    setUploadingDoc(docKey);
    try {
      const result = await api.loans.uploadDocument(file, docKey);
      setUploadedSlots((prev) => ({ ...prev, [docKey]: { key: result.key, signedPath: result.signedPath, fileName: file.name } }));
    } catch (e: any) {
      swal.error(e?.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleResume = async () => {
    if (!selected) return;
    const req = selected.details?.documentRequest;
    const requiredDocs = req?.docs ?? [];
    const missing = requiredDocs.filter((d) => !uploadedSlots[d]);
    if (missing.length > 0) {
      swal.error(`Please upload all requested documents before submitting.`);
      return;
    }
    setResuming(true);
    try {
      await api.loans.resume(selected.id);
      toast.success('Documents submitted — application resumed.');
      loadLoans(selected.id);
    } catch (e: any) {
      swal.error(e?.message || 'Could not resume application.');
    } finally {
      setResuming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentStepIndex = selected
    ? selected.status === 'REJECTED'
      ? -1
      : PIPELINE_ORDER.indexOf(selected.status as LoanStatus) !== -1
        ? PIPELINE_ORDER.indexOf(selected.status as LoanStatus)
        : -1
    : -1;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Loan Applications</h1>
          <p className="text-muted-foreground">Track every loan application from submission to disbursal.</p>
        </div>
        <Button onClick={() => navigate('/dashboard/loan-application')} className="gap-2 rounded-full shrink-0">
          <Plus className="w-4 h-4" /> New Application
        </Button>
      </div>

      {loans.length === 0 ? (
        <div className="text-center py-20 space-y-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <Banknote className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">No loan applications yet</h2>
            <p className="text-muted-foreground">Apply for an education loan to start your study-abroad journey.</p>
          </div>
          <Button onClick={() => navigate('/dashboard/loan-application')} size="lg" className="rounded-full px-8 gap-2">
            <Plus className="w-4 h-4" /> Apply for Loan
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Applications list */}
          <div className="lg:col-span-1 space-y-3">
            {loans.map((loan) => {
              const d = loan.details;
              const loanLabel = d?.loanPurpose || 'Education Loan';
              const uniName = d?.educationInfo?.universityName || '—';
              return (
                <button
                  key={loan.id}
                  onClick={() => selectLoan(loan)}
                  className={cn(
                    'w-full text-left rounded-2xl border p-4 transition-all hover:shadow-md',
                    selected?.id === loan.id
                      ? 'border-primary ring-1 ring-primary bg-primary/5'
                      : 'border-border bg-card',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm leading-tight">{loanLabel}</span>
                    <ChevronRight className={cn('w-4 h-4 shrink-0 mt-0.5 transition-colors', selected?.id === loan.id ? 'text-primary' : 'text-muted-foreground')} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{uniName}</p>
                  <p className="text-xs text-muted-foreground">
                    {loan.amount && loan.amount !== 'TBD' ? `₹${Number(loan.amount).toLocaleString('en-IN')}` : ''}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="secondary" className={cn('text-[10px] uppercase tracking-wide', STATUS_BADGE[loan.status])}>
                      {STATUS_LABELS[loan.status]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(loan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected loan detail */}
          {selected && (
            <div className="lg:col-span-2 space-y-6">
              {/* Pipeline progress bar — hidden when DOCUMENTS_REQUESTED or REJECTED */}
              {selected.status !== 'REJECTED' && selected.status !== 'DOCUMENTS_REQUESTED' && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Application Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative flex justify-between items-start">
                      <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-10" />
                      <div
                        className="absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-500"
                        style={{ width: currentStepIndex >= 0 ? `${(currentStepIndex / (PIPELINE_ORDER.length - 1)) * 100}%` : '0%' }}
                      />
                      {PIPELINE_STEPS.map((step, idx) => {
                        const done = idx < currentStepIndex;
                        const active = idx === currentStepIndex;
                        return (
                          <div key={step.status} className="flex flex-col items-center gap-2 relative">
                            <div className={cn(
                              'w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all',
                              done ? 'bg-primary border-primary text-primary-foreground' :
                              active ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20' :
                              'bg-background border-muted text-muted-foreground',
                            )}>
                              {done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span className={cn('text-[10px] font-medium text-center max-w-[70px] leading-tight hidden sm:block', active || done ? 'text-primary' : 'text-muted-foreground')}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* DOCUMENTS_REQUESTED — action required block */}
              {selected.status === 'DOCUMENTS_REQUESTED' && (
                <Card className="border-blue-500/30">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base text-blue-700">Action Required — Documents Requested</CardTitle>
                        {selected.details?.documentRequest && (
                          <CardDescription className="mt-1 text-sm font-medium text-foreground">
                            Reason: {selected.details.documentRequest.reason}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Please upload the documents listed below. Once all documents are uploaded, click <strong>Submit Documents</strong> to resume your application.
                    </p>
                    {selected.details?.documentRequest?.docs && selected.details.documentRequest.docs.length > 0 ? (
                      <div className="space-y-2">
                        {selected.details.documentRequest.docs.map((docKey) => {
                          // Try to find a nice label from the document groups
                          const entry = selected.details?.documentGroups
                            ?.flatMap((g) => g.documents)
                            .find((d) => d.key === docKey);
                          const label = entry?.label ?? docKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                          return (
                            <React.Fragment key={docKey}>
                              <DocSlot
                                docKey={docKey}
                                label={label}
                                slot={uploadedSlots[docKey]}
                                uploadingDoc={uploadingDoc}
                                onUpload={handleDocUpload}
                                required
                              />
                            </React.Fragment>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Your advisor will contact you about which documents are needed.</p>
                    )}
                    <Button
                      onClick={handleResume}
                      disabled={resuming || !!uploadingDoc}
                      className="w-full mt-2"
                    >
                      {resuming
                        ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting…</>
                        : 'Submit Documents & Resume Application'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Main detail card */}
              <Card>
                <CardHeader>
                  <CardTitle>{selected.details?.loanPurpose || 'Education Loan'}</CardTitle>
                  <CardDescription>
                    {selected.details?.educationInfo?.universityName
                      ? `${selected.details.educationInfo.universityName} — ${selected.details.educationInfo.course || ''}`
                      : 'Loan details'}{' '}
                    <span className="font-medium text-foreground">{STATUS_LABELS[selected.status]}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selected.status === 'REJECTED' && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                      <div>
                        <p className="text-sm font-semibold text-red-600">Application Rejected</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Please contact your advisor for more details.
                        </p>
                      </div>
                    </div>
                  )}

                  {selected.status === 'APPROVED' && (
                    <div className="flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold text-green-600">Loan Approved!</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          Congratulations! Your loan has been approved. Disbursal will happen soon.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div>
                    <h3 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wide">Application Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        ['Loan Amount', selected.amount !== 'TBD' ? `₹${Number(selected.amount).toLocaleString('en-IN')}` : 'TBD'],
                        ['University', selected.details?.educationInfo?.universityName || '—'],
                        ['Course', selected.details?.educationInfo?.course || '—'],
                        ['Intake', selected.details?.educationInfo?.intakeSemester && selected.details.educationInfo.intakeYear
                          ? `${selected.details.educationInfo.intakeSemester} ${selected.details.educationInfo.intakeYear}`
                          : '—'],
                        ['Guarantor', selected.details?.guarantor?.name
                          ? `${selected.details.guarantor.name} (${selected.details.guarantor.relation || ''})`
                          : '—'],
                        ['Submitted', new Date(selected.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
                      ].map(([k, v]) => (
                        <div key={k} className="p-3 border rounded-xl bg-card">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{k}</p>
                          <p className="font-semibold text-sm truncate">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Document checklist with status + reupload for REJECTED */}
                  {selected.details?.documentGroups && selected.details.documentGroups.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wide">Document Status</h3>
                      <div className="space-y-3">
                        {selected.details.documentGroups.map((group) => (
                          <div key={group.category} className="border rounded-xl p-4 bg-muted/10">
                            <p className="text-sm font-semibold mb-2">{group.label}</p>
                            <div className="space-y-2">
                              {group.documents.map((doc) => {
                                const isRejected = doc.status === 'REJECTED';
                                const isVerified = doc.status === 'VERIFIED';
                                const slot = uploadedSlots[doc.key];
                                return (
                                  <div key={doc.key} className={cn(
                                    'flex items-center justify-between gap-2 p-2 rounded-lg text-sm',
                                    isRejected ? 'bg-red-500/5 border border-red-500/20' :
                                    isVerified ? 'bg-green-500/5 border border-green-500/20' : 'bg-background border',
                                  )}>
                                    <span className="flex-1 text-muted-foreground truncate">{doc.label}</span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {doc.url && !isRejected && (
                                        <a href={resolveSignedUrl(doc.url)} target="_blank" rel="noopener noreferrer"
                                          className="text-xs text-primary flex items-center gap-1">
                                          <ExternalLink className="w-3 h-3" />
                                        </a>
                                      )}
                                      {isVerified && <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30 bg-green-500/10">Verified</Badge>}
                                      {isRejected && (
                                        <div className="flex items-center gap-2">
                                          <Badge variant="outline" className="text-[10px] text-red-600 border-red-500/30 bg-red-500/10">Rejected</Badge>
                                          {isRejected && (
                                            <React.Fragment>
                                              <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                className="hidden"
                                                id={`reupload-${doc.key}`}
                                                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(doc.key, f); e.target.value = ''; }}
                                              />
                                              {slot ? (
                                                <div className="flex items-center gap-1">
                                                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                  <label htmlFor={`reupload-${doc.key}`} className="text-xs text-primary cursor-pointer underline">
                                                    {uploadingDoc === doc.key ? 'Uploading…' : 'Reupload'}
                                                  </label>
                                                </div>
                                              ) : (
                                                <label htmlFor={`reupload-${doc.key}`}
                                                  className="text-xs text-red-600 underline cursor-pointer flex items-center gap-1">
                                                  {uploadingDoc === doc.key
                                                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</>
                                                    : <><Upload className="w-3 h-3" /> Upload new</>}
                                                </label>
                                              )}
                                            </React.Fragment>
                                          )}
                                        </div>
                                      )}
                                      {!isVerified && !isRejected && (
                                        <Badge variant="outline" className="text-[10px]">
                                          {doc.url ? 'Pending Review' : 'Not Uploaded'}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div>
                    <h3 className="text-sm font-bold mb-4 text-muted-foreground uppercase tracking-wide">Journey Timeline</h3>
                    {timeline.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No timeline entries yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {timeline.map((entry, idx) => {
                          const isLast = idx === timeline.length - 1;
                          return (
                            <div key={entry.id} className="relative flex gap-4">
                              <div className={cn(
                                'flex items-center justify-center w-10 h-10 rounded-full border shadow shrink-0 z-10',
                                isLast
                                  ? 'bg-background border-primary text-primary animate-pulse'
                                  : 'bg-primary text-primary-foreground border-primary',
                              )}>
                                {isLast ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                              </div>
                              <div className="flex-1 p-4 rounded-xl border bg-card shadow-sm">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="font-bold text-foreground">{prettyAction(entry.action)}</div>
                                  <time className="font-mono text-xs text-primary">
                                    {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </time>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
