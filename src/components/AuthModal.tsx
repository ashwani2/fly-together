import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { X, Mail, User, Phone, Users, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { api, type Gender } from '@/lib/api';
import { Logo } from '@/components/Logo';
import { PasswordField } from '@/components/PasswordField';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  /** Optional context line, e.g. "Sign in to view your results". */
  intent?: string;
}

type Mode = 'login' | 'register' | 'forgot';

const emailField = z.string().min(1, 'Email is required').email('Enter a valid email address');

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
});

const forgotSchema = z.object({
  email: emailField,
});

const registerSchema = z.object({
  name: z
    .string()
    .min(1, 'Full name is required')
    .refine((v) => v.trim().split(/\s+/).filter(Boolean).length >= 2, 'Please enter your first and last name'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[+\d][\d\s-]{6,}$/, 'Enter a valid phone number'),
  email: emailField,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  consent: z.literal(true, { message: 'Please accept the terms to continue' }),
});

interface FormValues {
  name?: string;
  phone?: string;
  gender?: string;
  email: string;
  password?: string;
  consent?: boolean;
}

export function AuthModal({ open, onClose, onSuccess, intent }: AuthModalProps) {
  const { login, register: registerUser } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [apiError, setApiError] = useState('');

  const modeRef = useRef<Mode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Validate against the schema for the current mode.
  const resolver: Resolver<FormValues> = async (values) => {
    const schema = modeRef.current === 'register' ? registerSchema : modeRef.current === 'forgot' ? forgotSchema : loginSchema;
    const parsed = schema.safeParse(values);
    if (parsed.success) return { values, errors: {} };
    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '');
      if (key && !errors[key]) errors[key] = { type: issue.code, message: issue.message };
    }
    return { values: {} as FormValues, errors: errors as never };
  };

  const {
    register,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    mode: 'onSubmit',
    defaultValues: { name: '', phone: '', gender: '', email: '', password: '', consent: false },
  });

  useEffect(() => {
    if (open) {
      setMode('login');
      setSent(false);
      setApiError('');
      reset({ name: '', phone: '', gender: '', email: '', password: '', consent: false });
    }
  }, [open, reset]);

  const goMode = (m: Mode) => {
    setMode(m);
    setApiError('');
    setSent(false);
    clearErrors();
  };

  const onSubmit = async (values: FormValues) => {
    setApiError('');
    try {
      if (modeRef.current === 'login') {
        await login(values.email.trim(), values.password!);
        onSuccess();
      } else if (modeRef.current === 'register') {
        await registerUser({
          email: values.email.trim(),
          password: values.password!,
          role: 'STUDENT',
          name: values.name!.trim(),
          phoneNumber: values.phone!.trim(),
          gender: values.gender ? (values.gender as Gender) : undefined,
        });
        onSuccess();
      } else {
        await api.auth.forgotPassword(values.email.trim());
        setSentEmail(values.email.trim());
        setSent(true);
      }
    } catch (err: any) {
      setApiError(err?.message || 'Something went wrong. Please try again.');
    }
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
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary/10 via-accent/30 to-background px-8 pt-9 pb-6 text-center">
              <div className="mb-3 flex justify-center">
                <Logo imgClassName="h-12" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                {mode === 'login' ? 'Welcome back' : mode === 'register' ? 'Create your account' : 'Forgot password?'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === 'forgot'
                  ? "Enter your email and we'll send you a reset link"
                  : intent || (mode === 'login' ? 'Sign in to your student portal' : 'Join Fly Together as a student')}
              </p>
            </div>

            {mode === 'forgot' && sent ? (
              <div className="px-8 py-9 text-center">
                <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-green-500/10 text-green-600">
                  <CheckCircle2 className="h-9 w-9" />
                </div>
                <h3 className="text-lg font-bold">Check your email</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  If an account exists for <span className="font-semibold text-foreground">{sentEmail}</span>, a password reset link is on its way. The link expires in 60 minutes.
                </p>
                <button
                  type="button"
                  onClick={() => goMode('login')}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 px-8 py-7">
                {mode === 'register' && (
                  <>
                    <div>
                      <Field icon={<User className="h-4 w-4" />}>
                        <input
                          type="text"
                          placeholder="Full name (e.g. Alex Johnson)"
                          {...register('name')}
                          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                        />
                      </Field>
                      <FieldError msg={errors.name?.message} />
                    </div>
                    <div>
                      <Field icon={<Phone className="h-4 w-4" />}>
                        <input
                          type="tel"
                          placeholder="Phone number"
                          {...register('phone')}
                          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                        />
                      </Field>
                      <FieldError msg={errors.phone?.message} />
                    </div>
                    <div>
                      <Field icon={<Users className="h-4 w-4" />}>
                        <select
                          {...register('gender')}
                          className="w-full bg-transparent text-sm outline-none text-foreground"
                        >
                          <option value="">Gender (optional)</option>
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHERS">Others</option>
                        </select>
                      </Field>
                    </div>
                  </>
                )}

                <div>
                  <Field icon={<Mail className="h-4 w-4" />}>
                    <input
                      type="email"
                      placeholder="Email address"
                      {...register('email')}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                    />
                  </Field>
                  <FieldError msg={errors.email?.message} />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <PasswordField
                      placeholder={mode === 'register' ? 'Password (min 8 characters)' : 'Password'}
                      autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                      {...register('password')}
                    />
                    <FieldError msg={errors.password?.message} />
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" onClick={() => goMode('forgot')} className="text-xs font-semibold text-primary hover:underline">
                      Forgot password?
                    </button>
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <label className="flex items-start gap-2 text-xs text-muted-foreground">
                      <input type="checkbox" {...register('consent')} className="mt-0.5 h-4 w-4 rounded accent-[var(--primary)]" />
                      <span>I agree to the processing of my data and the Terms &amp; Privacy Policy.</span>
                    </label>
                    <FieldError msg={errors.consent?.message} />
                  </div>
                )}

                {apiError && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600">{apiError}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Send reset link'}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                <p className="pt-1 text-center text-sm text-muted-foreground">
                  {mode === 'login' && (
                    <>First time here? <button type="button" onClick={() => goMode('register')} className="font-semibold text-primary hover:underline">Create an account</button></>
                  )}
                  {mode === 'register' && (
                    <>Already have an account? <button type="button" onClick={() => goMode('login')} className="font-semibold text-primary hover:underline">Sign in</button></>
                  )}
                  {mode === 'forgot' && (
                    <>Remembered it? <button type="button" onClick={() => goMode('login')} className="font-semibold text-primary hover:underline">Back to sign in</button></>
                  )}
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Field({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 px-1 text-xs font-medium text-red-600">{msg}</p>;
}
