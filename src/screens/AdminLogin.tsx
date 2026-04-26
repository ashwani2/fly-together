
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, ArrowRight, Globe, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

import { ThemeScopeWrapper } from '@/lib/ThemeContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginAsAdminDummy } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Local verification as requested
      if (email === 'admin@email.com' && password === 'admin@789') {
        if (loginAsAdminDummy) {
          loginAsAdminDummy(email);
          navigate('/dashboard/admin');
        }
      } else {
        setError('Invalid admin credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
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

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg flex gap-2 items-center">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-12 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
              >
                {loading ? 'Authenticating...' : 'Sign In as Admin'}
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
