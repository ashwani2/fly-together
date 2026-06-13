import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { ThemeScopeWrapper } from '@/lib/ThemeContext';
import { Logo } from '@/components/Logo';
import { PasswordField } from '@/components/PasswordField';
import { api } from '@/lib/api';
import { swal } from '@/lib/swal';

const resetSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Passwords do not match' });

type ResetValues = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema), mode: 'onSubmit' });

  const onSubmit = async (values: ResetValues) => {
    setApiError('');
    try {
      await api.auth.resetPassword(token, values.password);
      await swal.success('Your password has been updated. Please sign in with your new password.', 'Password reset');
      navigate('/');
    } catch (err: any) {
      setApiError(err?.message || 'This reset link is invalid or has expired.');
    }
  };

  return (
    <ThemeScopeWrapper scope="home">
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-accent/30 via-background to-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
        >
          <div className="bg-gradient-to-br from-primary/10 via-accent/30 to-background px-8 pt-9 pb-6 text-center">
            <div className="mb-3 flex justify-center">
              <Logo imgClassName="h-12" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
            <p className="mt-1 text-sm text-muted-foreground">Choose a strong password for your account.</p>
          </div>

          {!token ? (
            <div className="px-8 py-9 text-center">
              <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-amber-500/10 text-amber-600">
                <AlertCircle className="h-9 w-9" />
              </div>
              <h2 className="text-lg font-bold">Invalid reset link</h2>
              <p className="mt-2 text-sm text-muted-foreground">This link is missing its token. Please request a new password reset.</p>
              <Link
                to="/"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
              >
                Back to home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 px-8 py-7">
              <div>
                <PasswordField
                  placeholder="New password (min 8 characters)"
                  autoComplete="new-password"
                  {...register('password')}
                />
                {errors.password && <p className="mt-1 px-1 text-xs font-medium text-red-600">{errors.password.message}</p>}
              </div>
              <div>
                <PasswordField
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  {...register('confirm')}
                />
                {errors.confirm && <p className="mt-1 px-1 text-xs font-medium text-red-600">{errors.confirm.message}</p>}
              </div>

              {apiError && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600">{apiError}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (<>Update Password <ArrowRight className="h-4 w-4" /></>)}
              </button>

              <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3" /> Your password is encrypted and never shared.
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </ThemeScopeWrapper>
  );
}
