
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, ArrowRight, Globe } from 'lucide-react';
import { signInWithGoogle } from '@/lib/firebase';

export default function AdminLogin() {
  const navigate = useNavigate();

  const handleAdminLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/dashboard/admin');
    } catch (error) {
      console.error('Admin login failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
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
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-sm flex gap-3">
            <Globe className="w-5 h-5 shrink-0" />
            <p>Authorized personnel only. All access attempts are logged and monitored.</p>
          </div>
          <Button 
            onClick={handleAdminLogin}
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/20"
          >
            Login with Google
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
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
  );
}
