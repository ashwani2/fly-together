import React from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  ChevronDown,
  File as FileIcon,
  Lock,
  RotateCcw,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { BrandedLoader } from '@/components/BrandedLoader';
import { Markdown } from '@/lib/markdown';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import { swal } from '@/lib/swal';
import { downloadSopPdf, downloadSopDocx } from '@/lib/sopExport';
import { cn } from '@/lib/utils';

type Phase = 'form' | 'result';
type ExportFormat = 'pdf' | 'docx';

interface SopForm {
  fullName: string;
  country: string;
  university: string;
  campus: string;
  course: string;
}

const EMPTY_FORM: SopForm = { fullName: '', country: '', university: '', campus: '', course: '' };

/**
 * Public, landing-page Statement of Purpose generator.
 *
 * Anyone can fill the form and generate an SOP (the generator is an external
 * service that needs no auth). While it runs we show the branded Fly Together
 * logo loader — the same one used in the admin dashboard. Downloading the
 * result, however, requires an account: an unauthenticated visitor who clicks
 * Download is prompted to sign in first, after which the download resumes.
 */
export function SopGenerator() {
  const { user } = useAuth();
  const [phase, setPhase] = React.useState<Phase>('form');
  const [form, setForm] = React.useState<SopForm>(EMPTY_FORM);
  const [loading, setLoading] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  // Auth gating for downloads: remember the format the visitor wanted so we can
  // resume the download once they have signed in.
  const [authOpen, setAuthOpen] = React.useState(false);
  const pendingFormat = React.useRef<ExportFormat | null>(null);

  const canGenerate =
    !!form.fullName.trim() && !!form.university.trim() && !!form.course.trim() && !loading;

  const setField = (key: keyof SopForm) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    try {
      const sop = await api.sop.generate({
        fullName: form.fullName.trim(),
        country: form.country.trim() || undefined,
        university: form.university.trim(),
        campus: form.campus.trim() || undefined,
        course: form.course.trim(),
      });
      setContent(sop);
      setPhase('result');
      // Record this generation as a lead for the admin team (best-effort —
      // never block or fail the generation flow on this).
      void api.sopLeads
        .capture({
          fullName: form.fullName.trim(),
          country: form.country.trim() || undefined,
          university: form.university.trim(),
          campus: form.campus.trim() || undefined,
          course: form.course.trim(),
        })
        .catch(() => {
          /* non-blocking */
        });
    } catch (e: any) {
      swal.error(e?.message || 'Could not generate the SOP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      swal.error('Could not copy to clipboard.');
    }
  };

  const runDownload = async (format: ExportFormat) => {
    const base = `SOP-${(form.fullName.trim() || 'Statement_of_Purpose').replace(/\s+/g, '_')}`;
    try {
      if (format === 'pdf') await downloadSopPdf(content, `${base}.pdf`);
      else await downloadSopDocx(content, `${base}.docx`);
    } catch (e: any) {
      swal.error(e?.message || `Could not export the SOP as ${format.toUpperCase()}.`);
    }
  };

  // Downloads require an account. Signed-in visitors download immediately;
  // everyone else is prompted to sign in, and the download resumes on success.
  const requestDownload = (format: ExportFormat) => {
    if (user) {
      void runDownload(format);
      return;
    }
    pendingFormat.current = format;
    setAuthOpen(true);
  };

  const onAuthSuccess = () => {
    setAuthOpen(false);
    const format = pendingFormat.current;
    pendingFormat.current = null;
    if (format) void runDownload(format);
  };

  const reset = () => {
    setPhase('form');
    setContent('');
  };

  return (
    <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border bg-gradient-to-r from-primary/10 via-accent/20 to-background px-6 py-5">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.38_0.15_255)] text-primary-foreground shadow-lg shadow-primary/25">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold tracking-tight">AI Statement of Purpose</h3>
          <p className="text-sm text-muted-foreground">
            Generate a polished SOP draft in seconds — free, no account needed.
          </p>
        </div>
      </div>

      {loading ? (
        <BrandedLoader
          label="Generating your Statement of Purpose…"
          logoClassName="h-14 md:h-16"
          className="py-20 gap-8"
        />
      ) : phase === 'form' ? (
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Full Name"
              required
              value={form.fullName}
              onChange={setField('fullName')}
              placeholder="e.g. John Doe"
            />
            <Field
              label="Destination Country"
              value={form.country}
              onChange={setField('country')}
              placeholder="Country you'll study in — e.g. United Kingdom"
            />
            <Field
              label="University"
              required
              value={form.university}
              onChange={setField('university')}
              placeholder="e.g. University of Hull"
            />
            <Field
              label="Campus"
              value={form.campus}
              onChange={setField('campus')}
              placeholder="e.g. London Campus"
            />
            <div className="sm:col-span-2">
              <Field
                label="Course"
                required
                value={form.course}
                onChange={setField('course')}
                placeholder="e.g. MSc Computer Science"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Sign in is only needed to download your SOP.
            </p>
            <Button className="w-full gap-2 sm:w-auto" disabled={!canGenerate} onClick={generate}>
              <Sparkles className="h-4 w-4" /> Generate SOP
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-6 py-3">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPhase('form')}>
              <Pencil className="h-3.5 w-3.5" /> Edit details
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={generate}>
                <RotateCcw className="h-3.5 w-3.5" /> Regenerate
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={copy}>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button size="sm" className="gap-1.5">
                      <Download className="h-3.5 w-3.5" /> Download
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => requestDownload('pdf')} className="gap-2">
                    <FileIcon className="h-4 w-4 text-red-500" /> PDF document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => requestDownload('docx')} className="gap-2">
                    <FileIcon className="h-4 w-4 text-blue-500" /> Word (.docx)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {!user && (
            <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-6 py-2.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Sign in to download this Statement of Purpose as PDF or Word.
            </div>
          )}

          <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
            <Markdown content={content} className="text-sm text-foreground" />
          </div>

          <div className="flex justify-end border-t border-border px-6 py-3">
            <Button variant="ghost" size="sm" onClick={reset}>
              Start over
            </Button>
          </div>
        </div>
      )}

      <AuthModal
        open={authOpen}
        onClose={() => {
          setAuthOpen(false);
          pendingFormat.current = null;
        }}
        onSuccess={onAuthSuccess}
        intent="Sign in to download your Statement of Purpose"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-11 w-full rounded-xl border border-input bg-background px-4 text-sm shadow-sm outline-none transition-all',
          'placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/10',
        )}
      />
    </label>
  );
}
