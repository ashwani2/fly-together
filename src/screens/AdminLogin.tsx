
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ArrowRight, Globe, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

import { ThemeScopeWrapper } from '@/lib/ThemeContext';

const adminLoginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type AdminLoginValues = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginValues>({ resolver: zodResolver(adminLoginSchema), mode: 'onSubmit' });

  const onSubmit = async (values: AdminLoginValues) => {
    setError('');
    try {
      const u = await login(values.email, values.password);
      if (u.role === 'ADMIN') {
        navigate('/dashboard/admin');
      } else {
        setError('This account does not have administrator access.');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid admin credentials.');
    }
  };

  return (
    <ThemeScopeWrapper scope="admin">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-none">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">Admin Portal</CardTitle>
              <CardDescription>
                Secure access for Let's Fly Together consultants and administrators.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl text-amber-800 dark:text-amber-200 text-sm flex gap-3">
              <Globe className="w-5 h-5 shrink-0" />
              <p>Authorized personnel only. All access attempts are logged and monitored.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@email.com"
                  {...register('email')}
                />
                {errors.email && <p className="px-1 text-xs font-medium text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="px-1 text-xs font-medium text-destructive">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
              >
                {isSubmitting ? 'Authenticating...' : 'Sign In as Admin'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </form>

            <Button 
              variant="ghost" 
              className="w-full"
              onClick={() => navigate('/')}
            >
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </ThemeScopeWrapper>
  );
}
