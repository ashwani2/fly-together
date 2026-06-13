import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  X, GraduationCap, User, Mail, Phone, Calendar, MapPin, FileText,
  CheckCircle2, AlertCircle, Clock, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { swal } from '@/lib/swal';
import { api, type StudentProfile, type StudentDocument, type AuthUser, type DocType } from '@/lib/api';

interface ApplicationPreviewProps {
  open: boolean;
  universityName: string;
  course: string;
  onClose: () => void;
  onSubmitted: () => void;
}

const REQUIRED: { value: DocType; label: string }[] = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'AADHAR', label: 'Aadhar' },
  { value: 'ACADEMICS', label: 'Academic Transcripts' },
  { value: 'IELTS', label: 'IELTS Certificate' },
];

const statusStyles: Record<string, string> = {
  VERIFIED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  UPLOADED: 'bg-blue-100 text-blue-700',
  PENDING: 'bg-amber-100 text-amber-700',
};

export function ApplicationPreview({ open, universityName, course, onClose, onSubmitted }: ApplicationPreviewProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [docs, setDocs] = useState<StudentDocument[]>([]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const [p, me, d] = await Promise.all([api.students.me(), api.auth.me(), api.students.documents()]);
        setProfile(p);
        setAccount(me);
        setDocs(d);
      } catch (e) {
        console.error('Failed to load application preview', e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open]);

  const profileComplete = !!profile?.isProfileCompleted;
  const missingDocs = REQUIRED.filter((r) => !docs.some((d) => d.docType === r.value));
  const docsComplete = missingDocs.length === 0;
  const ready = !loading && profileComplete && docsComplete;

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || '—';

  const submit = async () => {
    setSubmitting(true);
    try {
      await api.applications.create({ universityName, course });
      onSubmitted();
    } catch (e: any) {
      swal.error(e?.message || 'Could not submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  const goFix = () => {
    onClose();
    navigate('/dashboard/profile');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b px-6 py-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Review your application</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">Confirm your details before submitting.</p>
              </div>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {loading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-6">
                  {/* Readiness banner */}
                  {ready ? (
                    <div className="flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-3 text-sm font-medium text-green-700">
                      <CheckCircle2 className="h-5 w-5 shrink-0" /> Everything looks good — you're ready to submit.
                    </div>
                  ) : (
                    <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                      <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle className="h-5 w-5 shrink-0" /> Action needed before you can apply
                      </div>
                      <ul className="mt-1.5 ml-7 list-disc space-y-0.5 text-xs">
                        {!profileComplete && <li>Complete your personal profile.</li>}
                        {!docsComplete && <li>Upload: {missingDocs.map((m) => m.label).join(', ')}.</li>}
                      </ul>
                    </div>
                  )}

                  {/* Application details */}
                  <Section icon={<GraduationCap className="h-4 w-4" />} title="Application">
                    <Row label="University" value={universityName} />
                    <Row label="Course" value={course} />
                  </Section>

                  {/* Personal details */}
                  <Section icon={<User className="h-4 w-4" />} title="Personal Details">
                    <Row label="Full name" value={fullName} icon={<User className="h-3.5 w-3.5" />} />
                    <Row label="Email" value={account?.email ?? '—'} icon={<Mail className="h-3.5 w-3.5" />} />
                    <Row label="Phone" value={account?.phoneNumber || '—'} icon={<Phone className="h-3.5 w-3.5" />} />
                    <Row
                      label="Date of birth"
                      value={profile?.dob ? format(new Date(profile.dob), 'PPP') : '—'}
                      icon={<Calendar className="h-3.5 w-3.5" />}
                    />
                    <Row label="Address" value={profile?.address || '—'} icon={<MapPin className="h-3.5 w-3.5" />} />
                  </Section>

                  {/* Documents */}
                  <Section icon={<FileText className="h-4 w-4" />} title="Documents">
                    <div className="space-y-2">
                      {REQUIRED.map((d) => {
                        const doc = docs.find((x) => x.docType === d.value);
                        return (
                          <div key={d.value} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={cn('grid h-8 w-8 place-items-center rounded-lg', doc ? 'bg-primary/5 text-primary' : 'bg-amber-500/10 text-amber-600')}>
                                {doc ? <FileText className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{d.label}</p>
                                {doc && (
                                  <p className="text-[11px] text-muted-foreground">
                                    Uploaded {new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </p>
                                )}
                              </div>
                            </div>
                            {doc ? (
                              <span className={cn('rounded-full px-2.5 py-0.5 text-[11px] font-semibold', statusStyles[doc.status])}>
                                {doc.status.charAt(0) + doc.status.slice(1).toLowerCase()}
                              </span>
                            ) : (
                              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">Missing</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
              <button onClick={onClose} className="h-11 rounded-full border border-border bg-background px-5 text-sm font-semibold transition-colors hover:bg-muted">
                Cancel
              </button>
              {ready ? (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Submit Application
                </button>
              ) : (
                <button
                  onClick={goFix}
                  disabled={loading}
                  className="h-11 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90 disabled:opacity-70"
                >
                  Complete Profile &amp; Documents
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-bold">
        <span className="text-primary">{icon}</span> {title}
      </div>
      <div className="rounded-xl border bg-muted/20 p-3">{children}</div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
