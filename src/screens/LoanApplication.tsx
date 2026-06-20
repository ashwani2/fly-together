import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  User,
  Users,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  GraduationCap,
  Info,
  XCircle,
  Upload,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { api, docLabel, resolveSignedUrl, type LoanDetails, type LoanDocumentGroup } from '@/lib/api';
import { swal } from '@/lib/swal';

const steps = [
  { id: 'personal', title: 'Personal Details', icon: User },
  { id: 'education', title: 'Education & Loan', icon: GraduationCap },
  { id: 'guarantor', title: 'Guarantor Details', icon: ShieldCheck },
  { id: 'coapplicant', title: 'Co-applicant', icon: Users },
  { id: 'review', title: 'Review & Submit', icon: FileText },
];

const DEFAULT_DOCUMENT_GROUPS: LoanDocumentGroup[] = [
  {
    category: 'personal',
    label: 'Personal Documents',
    documents: [
      { key: 'applicant_aadhar', label: 'Aadhar Card (Self)', status: 'PENDING' },
      { key: 'applicant_pan', label: 'PAN Card (Self)', status: 'PENDING' },
      { key: 'applicant_photo', label: 'Passport Photo', status: 'PENDING' },
    ],
  },
  {
    category: 'education',
    label: 'Education Documents',
    documents: [
      { key: 'tenth_cert', label: '10th Certificate', status: 'PENDING' },
      { key: 'twelfth_cert', label: '12th Certificate', status: 'PENDING' },
      { key: 'ug_degree', label: 'UG Degree / Transcripts (if any)', status: 'PENDING' },
      { key: 'offer_letter', label: 'University Offer Letter', status: 'PENDING' },
    ],
  },
  {
    category: 'financial',
    label: 'Financial Documents',
    documents: [
      { key: 'guarantor_aadhar', label: 'Aadhar Card (Guarantor)', status: 'PENDING' },
      { key: 'guarantor_pan', label: 'PAN Card (Guarantor)', status: 'PENDING' },
      { key: 'guarantor_photo', label: 'Guarantor Passport Photo', status: 'PENDING' },
      { key: 'bank_statement', label: 'Bank Statement (Last 6 Months)', status: 'PENDING' },
      { key: 'itr', label: 'ITR / Form 16 (Last 3 Years)', status: 'PENDING' },
      { key: 'income_proof', label: 'Income Proof (Salary Slip / Business Docs)', status: 'PENDING' },
    ],
  },
  {
    category: 'coapplicant',
    label: 'Co-applicant Documents',
    documents: [
      { key: 'coapplicant_aadhar', label: 'Aadhar Card (Co-applicant)', status: 'PENDING' },
      { key: 'coapplicant_pan', label: 'PAN Card (Co-applicant)', status: 'PENDING' },
      { key: 'coapplicant_photo', label: 'Co-applicant Passport Photo', status: 'PENDING' },
    ],
  },
];

type FormData = {
  personal: {
    firstName: string;
    lastName: string;
    dob: string;
    address: string;
    email: string;
    phone: string;
  };
  education: {
    universityName: string;
    course: string;
    country: string;
    intakeYear: string;
    intakeSemester: string;
    loanAmount: string;
    loanPurpose: string;
  };
  financial: {
    monthlyIncome: string;
    existingEMIs: string;
    collateral: string;
  };
  guarantor: {
    relation: string;
    name: string;
    email: string;
    mobile: string;
  };
  coApplicant: {
    relation: string;
    name: string;
    email: string;
    mobile: string;
  };
};

const INITIAL_FORM: FormData = {
  personal: { firstName: '', lastName: '', dob: '', address: '', email: '', phone: '' },
  education: { universityName: '', course: '', country: 'United Kingdom', intakeYear: '', intakeSemester: '', loanAmount: '', loanPurpose: 'Education Loan' },
  financial: { monthlyIncome: '', existingEMIs: '', collateral: '' },
  guarantor: { relation: '', name: '', email: '', mobile: '' },
  coApplicant: { relation: '', name: '', email: '', mobile: '' },
};

type Errors = Record<string, string>;

function Field({ label, children, required, error }: { label: string; children: React.ReactNode; required?: boolean; error?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required && <span className="text-destructive ml-0.5"> *</span>}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const REQUIRED_DOCS: Record<number, { docKey: string; label: string }[]> = {
  0: [
    { docKey: 'applicant_aadhar', label: 'Aadhar Card (Self)' },
    { docKey: 'applicant_pan', label: 'PAN Card (Self)' },
    { docKey: 'applicant_photo', label: 'Passport Photo' },
  ],
  1: [
    { docKey: 'offer_letter', label: 'University Offer Letter' },
  ],
  2: [
    { docKey: 'guarantor_aadhar', label: 'Aadhar Card (Guarantor)' },
    { docKey: 'guarantor_pan', label: 'PAN Card (Guarantor)' },
    { docKey: 'bank_statement', label: 'Bank Statement (Last 6 Months)' },
    { docKey: 'income_proof', label: 'Income Proof' },
  ],
};

type UploadedDoc = { key: string; signedPath: string; fileName: string; fromProfile?: boolean };

function DocUpload({
  docKey,
  label,
  required,
  error,
  uploadedDocs,
  uploadingDoc,
  onUpload,
}: {
  docKey: string;
  label: string;
  required?: boolean;
  error?: string;
  uploadedDocs: Record<string, UploadedDoc>;
  uploadingDoc: string | null;
  onUpload: (docKey: string, file: File) => void | Promise<void>;
}) {
  const uploaded = uploadedDocs[docKey];
  const isUploading = uploadingDoc === docKey;
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className={`flex flex-col gap-1 p-3 rounded-lg border bg-muted/10 transition-colors ${error ? 'border-destructive/60 bg-destructive/5' : uploaded ? 'border-green-500/30' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm flex-1 min-w-0">
          {label}
          {required && !uploaded && <span className="text-destructive ml-1">*</span>}
          {uploaded?.fromProfile && (
            <span className="ml-2 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">From Profile</span>
          )}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {uploaded && (
            <a
              href={resolveSignedUrl(uploaded.signedPath)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary flex items-center gap-1"
              title={uploaded.fileName}
            >
              <ExternalLink className="w-3 h-3" />
              View
            </a>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(docKey, file);
              e.target.value = '';
            }}
            disabled={isUploading}
          />
          {uploaded ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => inputRef.current?.click()}
                className="text-xs h-7 px-2"
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reupload'}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? (
                <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Uploading…</>
              ) : (
                <><Upload className="w-3 h-3 mr-1.5" />Upload</>
              )}
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function validateStep(step: number, formData: FormData, uploadedDocs: Record<string, UploadedDoc>): Errors {
  const errs: Errors = {};
  const p = formData.personal;
  const e = formData.education;
  const g = formData.guarantor;

  if (step === 0) {
    if (!p.firstName.trim()) errs.firstName = 'First name is required';
    if (!p.lastName.trim()) errs.lastName = 'Last name is required';
    if (!p.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errs.email = 'Enter a valid email address';
    if (!p.phone.trim()) errs.phone = 'Mobile number is required';
    if (!p.dob) errs.dob = 'Date of birth is required';
    if (!p.address.trim()) errs.address = 'Address is required';
  }

  if (step === 1) {
    if (!e.universityName.trim()) errs.universityName = 'University name is required';
    if (!e.course.trim()) errs.course = 'Course / programme is required';
    if (!e.intakeYear) errs.intakeYear = 'Intake year is required';
    if (!e.loanAmount.trim()) errs.loanAmount = 'Loan amount is required';
    else if (isNaN(Number(e.loanAmount)) || Number(e.loanAmount) <= 0) errs.loanAmount = 'Enter a valid positive amount';
    if (formData.financial.monthlyIncome && isNaN(Number(formData.financial.monthlyIncome)))
      errs.monthlyIncome = 'Enter a valid amount';
  }

  if (step === 2) {
    if (!g.relation) errs['guarantor.relation'] = 'Relation is required';
    if (!g.name.trim()) errs['guarantor.name'] = 'Guarantor name is required';
    if (!g.email.trim()) errs['guarantor.email'] = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email)) errs['guarantor.email'] = 'Enter a valid email address';
    if (!g.mobile.trim()) errs['guarantor.mobile'] = 'Mobile number is required';
  }

  if (step === 3) {
    const ca = formData.coApplicant;
    if (!ca.relation) errs['coApplicant.relation'] = 'Relation is required';
    if (ca.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ca.email)) errs['coApplicant.email'] = 'Enter a valid email address';
  }

  // Mandatory document checks
  for (const { docKey, label } of (REQUIRED_DOCS[step] ?? [])) {
    if (!uploadedDocs[docKey]) errs[`doc_${docKey}`] = `Please upload ${label}`;
  }

  return errs;
}

export default function LoanApplication() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, UploadedDoc>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [uniSuggestions, setUniSuggestions] = useState<{ universityName: string; course: string }[]>([]);

  const handleDocUpload = async (docKey: string, file: File) => {
    setUploadingDoc(docKey);
    try {
      const result = await api.loans.uploadDocument(file, docKey);
      setUploadedDocs((prev) => ({ ...prev, [docKey]: { ...result, fileName: file.name } }));
    } catch (e: any) {
      swal.error(e?.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingDoc(null);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const [profile, me, studentDocs, applications] = await Promise.all([
          api.students.me(),
          api.auth.me(),
          api.students.documents().catch(() => [] as Awaited<ReturnType<typeof api.students.documents>>),
          api.applications.list().catch(() => [] as Awaited<ReturnType<typeof api.applications.list>>),
        ]);
        setUniSuggestions(
          applications
            .filter((a) => a.universityName && a.course)
            .map((a) => ({ universityName: a.universityName, course: a.course }))
            .filter((a, i, arr) =>
              arr.findIndex((x) => x.universityName === a.universityName && x.course === a.course) === i
            ),
        );
        setFormData((prev) => ({
          ...prev,
          personal: {
            ...prev.personal,
            firstName: profile.firstName ?? '',
            lastName: profile.lastName ?? '',
            dob: profile.dob ? new Date(profile.dob).toISOString().slice(0, 10) : '',
            address: profile.address ?? '',
            email: me.email ?? '',
            phone: me.phoneNumber ?? '',
          },
        }));

        // Map student profile docs → loan doc slots
        const SLOT_MAP: Partial<Record<string, string>> = {
          AADHAR: 'applicant_aadhar',
        };
        const ACADEMIC_SLOT_MAP: Partial<Record<string, string>> = {
          TENTH: 'tenth_cert',
          TWELFTH: 'twelfth_cert',
          GRADUATION: 'ug_degree',
        };
        const relevantDocs = studentDocs.filter((d) => {
          if (d.removed) return false;
          if (SLOT_MAP[d.docType]) return true;
          if (d.docType === 'ACADEMICS' && d.subType && ACADEMIC_SLOT_MAP[d.subType]) return true;
          return false;
        });
        if (relevantDocs.length > 0) {
          const urlResults = await Promise.allSettled(
            relevantDocs.map((d) => api.students.documentViewUrl(d.id)),
          );
          const prefill: Record<string, UploadedDoc> = {};
          relevantDocs.forEach((doc, i) => {
            const res = urlResults[i];
            if (res.status !== 'fulfilled') return;
            const slotKey =
              doc.docType === 'ACADEMICS' && doc.subType
                ? ACADEMIC_SLOT_MAP[doc.subType]
                : SLOT_MAP[doc.docType];
            if (!slotKey) return;
            prefill[slotKey] = {
              key: doc.id,
              signedPath: res.value.url,
              fileName: docLabel(doc),
              fromProfile: true,
            };
          });
          setUploadedDocs((prev) => ({ ...prefill, ...prev }));
        }
      } catch {
        // non-fatal
      } finally {
        setProfileLoading(false);
      }
    })();
  }, []);

  const set = <S extends keyof FormData>(section: S, field: keyof FormData[S]) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: e.target.value } }));
      setErrors((prev) => { const next = { ...prev }; delete next[field as string]; delete next[`${section}.${field as string}`]; return next; });
    };

  const setSelect = <S extends keyof FormData>(section: S, field: keyof FormData[S]) =>
    (value: string) => {
      setFormData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
      setErrors((prev) => { const next = { ...prev }; delete next[field as string]; delete next[`${section}.${field as string}`]; return next; });
    };

  const nextStep = () => {
    const errs = validateStep(currentStep, formData, uploadedDocs);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setCurrentStep((p) => Math.min(p + 1, steps.length - 1));
  };

  const prevStep = () => {
    setErrors({});
    setCurrentStep((p) => Math.max(p - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all steps before submitting
    const allErrs = { ...validateStep(0, formData, uploadedDocs), ...validateStep(1, formData, uploadedDocs), ...validateStep(2, formData, uploadedDocs), ...validateStep(3, formData, uploadedDocs) };
    if (Object.keys(allErrs).length > 0) {
      setErrors(allErrs);
      swal.error('Please complete all required fields before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const details: LoanDetails = {
        loanPurpose: formData.education.loanPurpose,
        personalInfo: {
          firstName: formData.personal.firstName || null,
          lastName: formData.personal.lastName || null,
          dob: formData.personal.dob || null,
          address: formData.personal.address || null,
          email: formData.personal.email,
          phone: formData.personal.phone || null,
        },
        educationInfo: {
          universityName: formData.education.universityName,
          course: formData.education.course,
          country: formData.education.country,
          intakeYear: formData.education.intakeYear,
          intakeSemester: formData.education.intakeSemester,
        },
        financialInfo: {
          monthlyIncome: formData.financial.monthlyIncome,
          existingEMIs: formData.financial.existingEMIs,
          collateral: formData.financial.collateral,
        },
        guarantor: {
          relation: formData.guarantor.relation,
          name: formData.guarantor.name,
          email: formData.guarantor.email,
          mobile: formData.guarantor.mobile,
        },
        coApplicant: {
          relation: formData.coApplicant.relation,
          name: formData.coApplicant.name,
          email: formData.coApplicant.email,
          mobile: formData.coApplicant.mobile,
        },
        documentGroups: DEFAULT_DOCUMENT_GROUPS.map((group) => ({
          ...group,
          documents: group.documents.map((doc) => {
            const up = uploadedDocs[doc.key];
            return up ? { ...doc, url: up.signedPath } : doc;
          }),
        })),
      };

      await api.loans.create({ amount: formData.education.loanAmount || 'TBD', details });
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
      setIsSubmitted(true);
    } catch (err: any) {
      swal.error(err?.message || 'Could not submit loan application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto py-12 space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold">Application Submitted!</h1>
          <p className="text-muted-foreground">
            Your loan application has been received. Our advisors will review it within 24–48 business hours.
          </p>
        </motion.div>

        {/* Uploaded documents summary */}
        {Object.keys(uploadedDocs).length > 0 && (
          <div className="border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold">Documents Uploaded</p>
            <div className="space-y-2">
              {Object.values(uploadedDocs).map((doc: UploadedDoc) => (
                <div key={doc.key} className="flex items-center justify-between gap-3 text-sm p-2 rounded-lg bg-muted/20">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="truncate text-muted-foreground">{doc.fileName}</span>
                  </div>
                  <a
                    href={resolveSignedUrl(doc.signedPath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center gap-1 shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" /> View
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={() => navigate('/dashboard/my-loans')} className="w-full h-12">
            Track Loan Status
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard/services')} className="w-full h-12">
            Back to Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/services')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Education Loan Application</h1>
          <p className="text-muted-foreground">Complete all sections to initiate your funding process.</p>
        </div>
      </div>

      {/* Step progress */}
      <div className="relative flex justify-between before:absolute before:top-5 before:left-0 before:w-full before:h-0.5 before:bg-muted before:-z-10 h-20">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
              index < currentStep
                ? 'bg-primary border-primary text-primary-foreground'
                : index === currentStep
                  ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20'
                  : 'bg-background border-muted text-muted-foreground'
            }`}>
              {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
            </div>
            <span className={`text-xs font-medium hidden md:block ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                {React.createElement(steps[currentStep].icon, { className: 'w-6 h-6 text-primary' })}
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription>Fields marked * are mandatory.</CardDescription>
              {Object.keys(errors).length > 0 && (
                <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm text-destructive">
                  <XCircle className="w-4 h-4 shrink-0" />
                  Please fix {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} before continuing.
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Step 0 — Personal Details */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-primary">
                    <Info className="w-4 h-4 shrink-0" />
                    Pre-filled from your profile. Update here if anything has changed.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="First Name" required error={errors.firstName}>
                      <Input value={formData.personal.firstName} onChange={set('personal', 'firstName')} placeholder="John" className={errors.firstName ? 'border-destructive' : ''} />
                    </Field>
                    <Field label="Last Name" required error={errors.lastName}>
                      <Input value={formData.personal.lastName} onChange={set('personal', 'lastName')} placeholder="Doe" className={errors.lastName ? 'border-destructive' : ''} />
                    </Field>
                    <Field label="Email Address" required error={errors.email}>
                      <Input type="email" value={formData.personal.email} onChange={set('personal', 'email')} placeholder="email@example.com" className={errors.email ? 'border-destructive' : ''} />
                    </Field>
                    <Field label="Mobile Number" required error={errors.phone}>
                      <Input value={formData.personal.phone} onChange={set('personal', 'phone')} placeholder="+91 9999999999" className={errors.phone ? 'border-destructive' : ''} />
                    </Field>
                    <Field label="Date of Birth" required error={errors.dob}>
                      <Input type="date" value={formData.personal.dob} onChange={set('personal', 'dob')} max={new Date().toISOString().slice(0, 10)} className={errors.dob ? 'border-destructive' : ''} />
                    </Field>
                    <Field label="Current Address" required error={errors.address}>
                      <Input value={formData.personal.address} onChange={set('personal', 'address')} placeholder="123 Student Lane, London" className={errors.address ? 'border-destructive' : ''} />
                    </Field>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Personal Documents <span className="text-xs font-normal text-muted-foreground">(PDF / JPG / PNG, max 10 MB each)</span></p>
                    {[
                      { docKey: 'applicant_aadhar', label: 'Aadhar Card (Self)', required: true },
                      { docKey: 'applicant_pan', label: 'PAN Card (Self)', required: true },
                      { docKey: 'applicant_photo', label: 'Passport Photo', required: true },
                    ].map((d) => (
                      <React.Fragment key={d.docKey}>
                        <DocUpload docKey={d.docKey} label={d.label} required={d.required} error={errors[`doc_${d.docKey}`]} uploadedDocs={uploadedDocs} uploadingDoc={uploadingDoc} onUpload={handleDocUpload} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 1 — Education & Loan */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="University Name" required error={errors.universityName}>
                      {uniSuggestions.length > 0 ? (
                        <Select
                          value={formData.education.universityName}
                          onValueChange={(v) => {
                            const match = uniSuggestions.find((s) => s.universityName === v);
                            setFormData((prev) => ({
                              ...prev,
                              education: {
                                ...prev.education,
                                universityName: v,
                                course: match ? match.course : prev.education.course,
                              },
                            }));
                            setErrors((prev) => { const n = { ...prev }; delete n.universityName; delete n.course; return n; });
                          }}
                        >
                          <SelectTrigger className={errors.universityName ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select university" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniSuggestions.map((s, i) => (
                              <SelectItem key={i} value={s.universityName}>{s.universityName}</SelectItem>
                            ))}
                            <SelectItem value="__other__">Other (type below)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={formData.education.universityName} onChange={set('education', 'universityName')} placeholder="University of Oxford" className={errors.universityName ? 'border-destructive' : ''} />
                      )}
                      {formData.education.universityName === '__other__' && (
                        <Input
                          className="mt-2"
                          placeholder="Enter university name"
                          onChange={(e) => setFormData((prev) => ({ ...prev, education: { ...prev.education, universityName: e.target.value } }))}
                        />
                      )}
                    </Field>
                    <Field label="Course / Programme" required error={errors.course}>
                      {uniSuggestions.length > 0 && formData.education.universityName && formData.education.universityName !== '__other__' ? (
                        <Select value={formData.education.course} onValueChange={setSelect('education', 'course')}>
                          <SelectTrigger className={errors.course ? 'border-destructive' : ''}>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniSuggestions
                              .filter((s) => s.universityName === formData.education.universityName)
                              .map((s, i) => <SelectItem key={i} value={s.course}>{s.course}</SelectItem>)}
                            <SelectItem value="__other__">Other (type below)</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input value={formData.education.course} onChange={set('education', 'course')} placeholder="MSc Computer Science" className={errors.course ? 'border-destructive' : ''} />
                      )}
                      {formData.education.course === '__other__' && (
                        <Input
                          className="mt-2"
                          placeholder="Enter course name"
                          onChange={(e) => setFormData((prev) => ({ ...prev, education: { ...prev.education, course: e.target.value } }))}
                        />
                      )}
                    </Field>
                    <Field label="Country">
                      <Input value={formData.education.country} onChange={set('education', 'country')} placeholder="United Kingdom" />
                    </Field>
                    <Field label="Intake Year" required error={errors.intakeYear}>
                      <Select onValueChange={setSelect('education', 'intakeYear')} value={formData.education.intakeYear}>
                        <SelectTrigger className={errors.intakeYear ? 'border-destructive' : ''}><SelectValue placeholder="Select year" /></SelectTrigger>
                        <SelectContent>
                          {['2025', '2026', '2027'].map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Semester / Intake">
                      <Select onValueChange={setSelect('education', 'intakeSemester')} value={formData.education.intakeSemester}>
                        <SelectTrigger><SelectValue placeholder="Select intake" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="September">September</SelectItem>
                          <SelectItem value="January">January</SelectItem>
                          <SelectItem value="May">May</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Loan Amount Required (₹)" required error={errors.loanAmount}>
                      <Input value={formData.education.loanAmount} onChange={set('education', 'loanAmount')} placeholder="e.g. 3500000" type="number" min={0} className={errors.loanAmount ? 'border-destructive' : ''} />
                    </Field>
                    <div className="md:col-span-2">
                      <Field label="Monthly Family Income (₹)" error={errors.monthlyIncome}>
                        <Input value={formData.financial.monthlyIncome} onChange={set('financial', 'monthlyIncome')} placeholder="e.g. 80000" type="number" min={0} className={errors.monthlyIncome ? 'border-destructive' : ''} />
                      </Field>
                    </div>
                    <Field label="Existing EMIs (₹/month)">
                      <Input value={formData.financial.existingEMIs} onChange={set('financial', 'existingEMIs')} placeholder="0 if none" type="number" min={0} />
                    </Field>
                    <Field label="Collateral / Property (if any)">
                      <Input value={formData.financial.collateral} onChange={set('financial', 'collateral')} placeholder="e.g. Residential property worth ₹50 lakh" />
                    </Field>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Education Documents <span className="text-xs font-normal text-muted-foreground">(PDF / JPG / PNG, max 10 MB each)</span></p>
                    {[
                      { docKey: 'tenth_cert', label: '10th Certificate', required: false },
                      { docKey: 'twelfth_cert', label: '12th Certificate', required: false },
                      { docKey: 'ug_degree', label: 'UG Degree / Transcripts (if any)', required: false },
                      { docKey: 'offer_letter', label: 'University Offer Letter', required: true },
                    ].map((d) => (
                      <React.Fragment key={d.docKey}>
                        <DocUpload docKey={d.docKey} label={d.label} required={d.required} error={errors[`doc_${d.docKey}`]} uploadedDocs={uploadedDocs} uploadingDoc={uploadingDoc} onUpload={handleDocUpload} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 — Guarantor Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Relation to Applicant" required error={errors['guarantor.relation']}>
                      <Select onValueChange={setSelect('guarantor', 'relation')} value={formData.guarantor.relation}>
                        <SelectTrigger className={errors['guarantor.relation'] ? 'border-destructive' : ''}><SelectValue placeholder="Select relation" /></SelectTrigger>
                        <SelectContent>
                          {['Father', 'Mother', 'Spouse', 'Sibling', 'Other'].map((r) => (
                            <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">Only blood relations are eligible as guarantors.</p>
                    </Field>
                    <Field label="Full Name" required error={errors['guarantor.name']}>
                      <Input value={formData.guarantor.name} onChange={set('guarantor', 'name')} placeholder="Guarantor full name" className={errors['guarantor.name'] ? 'border-destructive' : ''} />
                    </Field>
                    <Field label="Email ID" required error={errors['guarantor.email']}>
                      <Input type="email" value={formData.guarantor.email} onChange={set('guarantor', 'email')} placeholder="guarantor@email.com" className={errors['guarantor.email'] ? 'border-destructive' : ''} />
                    </Field>
                    <Field label="Mobile Number" required error={errors['guarantor.mobile']}>
                      <Input value={formData.guarantor.mobile} onChange={set('guarantor', 'mobile')} placeholder="+91 9999999999" className={errors['guarantor.mobile'] ? 'border-destructive' : ''} />
                    </Field>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Guarantor & Financial Documents <span className="text-xs font-normal text-muted-foreground">(PDF / JPG / PNG, max 10 MB each)</span></p>
                    {[
                      { docKey: 'guarantor_aadhar', label: 'Aadhar Card (Guarantor)', required: true },
                      { docKey: 'guarantor_pan', label: 'PAN Card (Guarantor)', required: true },
                      { docKey: 'guarantor_photo', label: 'Guarantor Passport Photo', required: false },
                      { docKey: 'bank_statement', label: 'Bank Statement (Last 6 Months)', required: true },
                      { docKey: 'itr', label: 'ITR / Form 16 (Last 3 Years)', required: false },
                      { docKey: 'income_proof', label: 'Income Proof (Salary Slip / Business Docs)', required: true },
                    ].map((d) => (
                      <React.Fragment key={d.docKey}>
                        <DocUpload docKey={d.docKey} label={d.label} required={d.required} error={errors[`doc_${d.docKey}`]} uploadedDocs={uploadedDocs} uploadingDoc={uploadingDoc} onUpload={handleDocUpload} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3 — Co-applicant Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Relation to Applicant" required error={errors['coApplicant.relation']}>
                      <Select onValueChange={setSelect('coApplicant', 'relation')} value={formData.coApplicant.relation}>
                        <SelectTrigger className={errors['coApplicant.relation'] ? 'border-destructive' : ''}><SelectValue placeholder="Select relation" /></SelectTrigger>
                        <SelectContent>
                          {['Father', 'Mother', 'Brother', 'Sister', 'Spouse'].map((r) => (
                            <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-muted-foreground">Only blood relations are eligible.</p>
                    </Field>
                    <Field label="Full Name">
                      <Input value={formData.coApplicant.name} onChange={set('coApplicant', 'name')} placeholder="Co-applicant full name" />
                    </Field>
                    <Field label="Email ID" error={errors['coApplicant.email']}>
                      <Input type="email" value={formData.coApplicant.email} onChange={set('coApplicant', 'email')} placeholder="coapplicant@email.com" className={errors['coApplicant.email'] ? 'border-destructive' : ''} />
                    </Field>
                    <Field label="Mobile Number">
                      <Input value={formData.coApplicant.mobile} onChange={set('coApplicant', 'mobile')} placeholder="+91 9999999999" />
                    </Field>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Co-applicant Documents <span className="text-xs font-normal text-muted-foreground">(PDF / JPG / PNG, max 10 MB each)</span></p>
                    {[
                      { docKey: 'coapplicant_aadhar', label: 'Aadhar Card (Co-applicant)' },
                      { docKey: 'coapplicant_pan', label: 'PAN Card (Co-applicant)' },
                      { docKey: 'coapplicant_photo', label: 'Co-applicant Passport Photo' },
                    ].map((d) => (
                      <React.Fragment key={d.docKey}>
                        <DocUpload docKey={d.docKey} label={d.label} uploadedDocs={uploadedDocs} uploadingDoc={uploadingDoc} onUpload={handleDocUpload} />
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 4 — Review & Submit */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                    <p className="text-sm font-semibold mb-1">Before you submit</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Ensure all information is accurate. Misrepresentation or blurred documents may lead to rejection. An advisor will reach out within 24–48 hours.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Personal</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        ['Name', [formData.personal.firstName, formData.personal.lastName].filter(Boolean).join(' ') || '—'],
                        ['Email', formData.personal.email || '—'],
                        ['Phone', formData.personal.phone || '—'],
                        ['Date of Birth', formData.personal.dob || '—'],
                        ['Address', formData.personal.address || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="p-3 border rounded-lg bg-muted/20">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{k}</p>
                          <p className="font-medium text-sm truncate">{v}</p>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Education & Loan</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        ['University', formData.education.universityName || '—'],
                        ['Course', formData.education.course || '—'],
                        ['Intake', formData.education.intakeSemester && formData.education.intakeYear ? `${formData.education.intakeSemester} ${formData.education.intakeYear}` : '—'],
                        ['Loan Amount', formData.education.loanAmount ? `₹${Number(formData.education.loanAmount).toLocaleString('en-IN')}` : '—'],
                        ['Family Income', formData.financial.monthlyIncome ? `₹${Number(formData.financial.monthlyIncome).toLocaleString('en-IN')}/mo` : '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="p-3 border rounded-lg bg-muted/20">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{k}</p>
                          <p className="font-medium text-sm truncate">{v}</p>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Guarantor</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        ['Relation', formData.guarantor.relation || '—'],
                        ['Name', formData.guarantor.name || '—'],
                        ['Mobile', formData.guarantor.mobile || '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="p-3 border rounded-lg bg-muted/20">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{k}</p>
                          <p className="font-medium text-sm capitalize">{v}</p>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Uploaded Documents</h4>
                    <div className="space-y-3">
                      {DEFAULT_DOCUMENT_GROUPS.map((group) => (
                        <div key={group.category} className="border rounded-xl p-4 bg-muted/10">
                          <p className="text-sm font-semibold mb-2">{group.label}</p>
                          <div className="space-y-1.5">
                            {group.documents.map((doc) => {
                              const up = uploadedDocs[doc.key];
                              return (
                                <div key={doc.key} className="flex items-center justify-between gap-2 text-sm">
                                  <span className="text-muted-foreground flex-1">{doc.label}</span>
                                  {up ? (
                                    <a
                                      href={resolveSignedUrl(up.signedPath)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 text-xs text-green-600 font-medium"
                                    >
                                      <CheckCircle2 className="w-3 h-3" /> View
                                    </a>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground">Pending</Badge>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">Missing documents can be submitted later via your advisor during the review process.</p>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center bg-background p-4 border rounded-xl shadow-sm">
        <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        {currentStep === steps.length - 1 ? (
          <Button onClick={handleSubmit} disabled={submitting} className="px-8 bg-green-600 hover:bg-green-700">
            {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…</> : 'Submit Application'}
          </Button>
        ) : (
          <Button onClick={nextStep}>
            Next Step <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
