import React, { Fragment, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, Trash2, Loader2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { api, type StudentDocument, type DocType, type DocStatus, type AcademicSubType, type StudentProfile } from '@/lib/api';
import { swal } from '@/lib/swal';
import { DatePicker } from '@/components/DatePicker';
import { DocumentViewer } from '@/components/DocumentViewer';

// Single-slot documents (one of each).
const SINGLE_DOCS: { value: DocType; label: string }[] = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'AADHAR', label: 'Aadhar' },
  { value: 'IELTS', label: 'IELTS Certificate' },
];

// Academic certificates are subtypes of ACADEMICS. 10th/12th/graduation are
// single slots; "Other" allows multiple uploads.
const ACADEMIC_SINGLE: { value: AcademicSubType; label: string }[] = [
  { value: 'TENTH', label: '10th Certificate' },
  { value: 'TWELFTH', label: '12th Certificate' },
  { value: 'GRADUATION', label: 'Graduation Certificate' },
];

const statusStyles: Record<string, string> = {
  VERIFIED: 'bg-green-500/10 text-green-600 dark:text-green-400',
  REJECTED: 'bg-red-500/10 text-red-600 dark:text-red-400',
  UPLOADED: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  PENDING: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

function DocRow({
  label, doc, uploading, onView, onDelete, onUpload, onReupload,
}: {
  label: string;
  doc?: StudentDocument;
  uploading: boolean;
  onView: () => void;
  onDelete: () => void;
  onUpload: () => void;
  onReupload?: () => void;
}) {
  const status = doc?.status ?? null;
  const verified = status === 'VERIFIED';
  const rejected = status === 'REJECTED';
  const review = status === 'UPLOADED' || status === 'PENDING';
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'grid h-9 w-9 shrink-0 place-items-center rounded-lg',
            verified ? 'bg-green-500/10 text-green-600' :
            rejected ? 'bg-red-500/10 text-red-600' :
            review ? 'bg-blue-500/10 text-blue-600' :
            'bg-amber-500/10 text-amber-600',
          )}
        >
          {verified ? <CheckCircle2 className="h-5 w-5" /> :
           rejected ? <AlertCircle className="h-5 w-5" /> :
           review ? <Clock className="h-5 w-5" /> :
           <FileText className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">
            {doc
              ? `Uploaded on ${new Date(doc.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}${rejected ? ' · please re-upload' : ''}`
              : 'Pending upload'}
          </p>
        </div>
      </div>
      {doc ? (
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant="secondary" className={cn('shrink-0', statusStyles[doc.status])}>
            {doc.status.charAt(0) + doc.status.slice(1).toLowerCase()}
          </Badge>
          {rejected && onReupload && (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50" disabled={uploading} onClick={onReupload}>
              <Upload className="h-3.5 w-3.5" /> Re-upload
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={onView} aria-label={`View ${label}`} title="View document">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label={`Delete ${label}`} title="Delete document">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" disabled={uploading} onClick={onUpload}>
          <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
        </Button>
      )}
    </div>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'documents'>('personal');

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [docs, setDocs] = useState<StudentDocument[]>([]);
  const [form, setForm] = useState({ firstName: '', lastName: '', phoneNumber: '', dob: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const [uploadType, setUploadType] = useState<DocType>('PASSPORT');
  const [uploadSubType, setUploadSubType] = useState<AcademicSubType | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState<{ url: string; title: string; type: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocs = async () => {
    try { setDocs(await api.students.documents()); } catch (e) { console.error(e); }
  };

  useEffect(() => {
    (async () => {
      try {
        const [p, me] = await Promise.all([api.students.me(), api.auth.me()]);
        setProfile(p);
        setForm({
          firstName: p.firstName ?? '',
          lastName: p.lastName ?? '',
          phoneNumber: me.phoneNumber ?? '',
          dob: p.dob ? new Date(p.dob).toISOString().slice(0, 10) : '',
          address: p.address ?? '',
        });
      } catch (e) {
        console.error('Failed to load profile', e);
      }
      loadDocs();
    })();
  }, []);

  const completion = profile?.profileCompletion ?? 0;

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      const updated = await api.students.updateMe({
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
        dob: form.dob || undefined,
        address: form.address || undefined,
        phoneNumber: form.phoneNumber || undefined,
      });
      setProfile(updated);
      setSavedMsg('Saved!');
      setTimeout(() => setSavedMsg(''), 2500);
    } catch (e: any) {
      setSavedMsg(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.students.uploadDocument(uploadType, file, uploadSubType);
      await loadDocs();
    } catch (err: any) {
      swal.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadSubType(undefined);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.documents.remove(id);
      setDocs((d) => d.filter((x) => x.id !== id));
    } catch (e: any) {
      swal.error(e?.message || 'Delete failed');
    }
  };

  // Pre-select a document type (and academic subtype) and open the file picker.
  const quickUpload = (t: DocType, sub?: AcademicSubType) => {
    setUploadType(t);
    setUploadSubType(sub);
    setTimeout(() => fileRef.current?.click(), 0);
  };

  // Re-upload a rejected document: drop the old one, then pick a fresh file.
  const reupload = async (doc: StudentDocument, t: DocType, sub?: AcademicSubType) => {
    await handleDelete(doc.id);
    quickUpload(t, sub);
  };

  const viewDocument = async (id: string, title: string) => {
    try {
      const { url } = await api.students.documentViewUrl(id);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('Could not load the document.');
      const blob = await resp.blob();
      const objectUrl = URL.createObjectURL(blob);
      setViewer((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { url: objectUrl, title, type: blob.type };
      });
    } catch (e: any) {
      swal.error(e?.message || 'Could not open document');
    }
  };

  const closeViewer = () => {
    setViewer((v) => {
      if (v) URL.revokeObjectURL(v.url);
      return null;
    });
  };

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const ringOffset = 251.2 * (1 - completion / 100);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile & Documents</h1>
        <p className="text-muted-foreground">Manage your personal information and upload required documents.</p>
      </div>

      <div className="flex gap-4 border-b pb-px">
        <button
          onClick={() => setActiveTab('personal')}
          className={cn(
            'pb-4 px-2 text-sm font-medium transition-colors relative',
            activeTab === 'personal' ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Personal Information
          {activeTab === 'personal' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={cn(
            'pb-4 px-2 text-sm font-medium transition-colors relative',
            activeTab === 'documents' ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Documents
          {activeTab === 'documents' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {activeTab === 'personal' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Update your basic information for university applications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={form.firstName} onChange={set('firstName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={form.lastName} onChange={set('lastName')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="+44 7700 900000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <DatePicker
                    id="dob"
                    value={form.dob}
                    onChange={(v) => setForm((f) => ({ ...f, dob: v }))}
                    placeholder="Select your date of birth"
                    max={new Date()}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Current Address</Label>
                <Input id="address" value={form.address} onChange={set('address')} placeholder="123 Student Lane, London, UK" />
              </div>
              <div className="flex items-center gap-4">
                <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : 'Save Changes'}
                </Button>
                {savedMsg && <span className="text-sm text-green-600 font-medium">{savedMsg}</span>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-muted stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                    <circle
                      className="text-primary stroke-current transition-all duration-700"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                      transform="rotate(-90 50 50)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{completion}%</span>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {completion === 100 ? 'Your profile is complete!' : 'Fill in all details to reach 100%.'}
                </p>
              </div>
              <div className="space-y-3">
                <div className={cn('flex items-center gap-2 text-sm', form.firstName && form.lastName ? 'text-green-600' : 'text-muted-foreground')}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Name</span>
                </div>
                <div className={cn('flex items-center gap-2 text-sm', form.dob ? 'text-green-600' : 'text-muted-foreground')}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Date of Birth</span>
                </div>
                <div className={cn('flex items-center gap-2 text-sm', form.address ? 'text-green-600' : 'text-muted-foreground')}>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Address</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Identity & test documents */}
          <Card>
            <CardHeader>
              <CardTitle>Upload a document</CardTitle>
              <CardDescription>
                PDF, JPG, PNG (Max 10MB) · {docs.filter((d) => d.status === 'VERIFIED').length} of {docs.length} verified
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {SINGLE_DOCS.map((d) => {
                  const doc = docs.find((x) => x.docType === d.value);
                  return (
                    <Fragment key={d.value}>
                      <DocRow
                        label={d.label}
                        doc={doc}
                        uploading={uploading}
                        onView={() => doc && viewDocument(doc.id, d.label)}
                        onDelete={() => doc && handleDelete(doc.id)}
                        onUpload={() => quickUpload(d.value)}
                        onReupload={() => doc && reupload(doc, d.value)}
                      />
                    </Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Academic certificates (subtypes of Academics) */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Certificates</CardTitle>
              <CardDescription>Upload your 10th, 12th and graduation certificates. Add any other academic documents under “Other”.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ACADEMIC_SINGLE.map((a) => {
                  const doc = docs.find((x) => x.docType === 'ACADEMICS' && x.subType === a.value);
                  return (
                    <Fragment key={a.value}>
                      <DocRow
                        label={a.label}
                        doc={doc}
                        uploading={uploading}
                        onView={() => doc && viewDocument(doc.id, a.label)}
                        onDelete={() => doc && handleDelete(doc.id)}
                        onUpload={() => quickUpload('ACADEMICS', a.value)}
                        onReupload={() => doc && reupload(doc, 'ACADEMICS', a.value)}
                      />
                    </Fragment>
                  );
                })}

                {/* Other academic documents — multiple allowed */}
                <div className="rounded-xl border border-dashed bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">Other Academic Documents</p>
                      <p className="text-xs text-muted-foreground">Diplomas, mark sheets, certifications — add as many as you need.</p>
                    </div>
                    <Button variant="outline" size="sm" disabled={uploading} onClick={() => quickUpload('ACADEMICS', 'OTHER')}>
                      {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />} Add document
                    </Button>
                  </div>
                  {docs.filter((x) => x.docType === 'ACADEMICS' && (x.subType === 'OTHER' || x.subType == null)).map((doc) => {
                    const fileName = doc.docUrl.split('/').pop() || 'Document';
                    return (
                      <div key={doc.id} className="flex items-center justify-between gap-4 rounded-lg border bg-card px-3 py-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-4 w-4" />
                          </div>
                          <p className="text-sm font-medium truncate">{fileName}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="secondary" className={cn('shrink-0', statusStyles[doc.status])}>
                            {doc.status.charAt(0) + doc.status.slice(1).toLowerCase()}
                          </Badge>
                          {doc.status === 'REJECTED' && (
                            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-amber-600 border-amber-300 hover:bg-amber-50" disabled={uploading} onClick={() => reupload(doc, 'ACADEMICS', 'OTHER')}>
                              <Upload className="h-3.5 w-3.5" /> Re-upload
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => viewDocument(doc.id, 'Other Academic')} title="View document">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(doc.id)} title="Delete document">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hidden input used by the per-document Upload buttons */}
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
        </div>
      )}

      <DocumentViewer
        open={!!viewer}
        url={viewer?.url ?? null}
        title={viewer?.title ?? 'Document'}
        type={viewer?.type}
        onClose={closeViewer}
      />
    </div>
  );
}
