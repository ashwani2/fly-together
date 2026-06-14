
import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  GraduationCap, 
  CreditCard,
  UserCircle,
  ShieldCheck,
  Truck,
  Home,
  Banknote,
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { api, type Application, type StudentProfile } from '@/lib/api';
import { Navigate, Link } from 'react-router-dom';

const STATUS_LABELS: Record<string, string> = {
  CREATED: 'Created',
  REJECTED: 'Rejected',
  DOCUMENT_VERIFIED: 'Document Verified',
  SENT_TO_UNIVERSITY: 'Sent to University',
  PENDING_WITH_UNIVERSITY: 'Pending with University',
  VERIFIED_BY_UNIVERSITY: 'Verified by University',
  PAYMENT_PENDING: 'Payment Pending',
  COMPLETED: 'Completed',
};

const statusBadgeClass = (s: string) =>
  s === 'COMPLETED' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
  s === 'REJECTED' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
  s === 'PAYMENT_PENDING' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
  'bg-amber-500/10 text-amber-600 border-amber-500/20';

const quickServices = [
  { icon: GraduationCap, label: 'Universities', path: '/dashboard/uni', color: 'bg-indigo-500/10 text-indigo-500' },
  { icon: Home, label: 'Accommodation', path: '/dashboard/accommodation', color: 'bg-emerald-500/10 text-emerald-500' },
  { icon: Banknote, label: 'Loan Help', path: '/dashboard/loan-application', color: 'bg-blue-500/10 text-blue-500' },
  { icon: Truck, label: 'Logistics', path: '/dashboard/market', color: 'bg-amber-500/10 text-amber-500' },
];

export default function Dashboard() {
  const { role, user } = useAuth();
  const [firstName, setFirstName] = React.useState<string>(() => user?.displayName?.split(' ')[0] ?? '');
  const [profile, setProfile] = React.useState<StudentProfile | null>(null);
  const [apps, setApps] = React.useState<Application[]>([]);

  React.useEffect(() => {
    if (role !== 'student') return;
    let active = true;
    api.students
      .me()
      .then((p) => {
        if (!active) return;
        if (p.firstName) setFirstName(p.firstName);
        setProfile(p);
      })
      .catch(() => {});
    api.applications
      .list()
      .then((list) => { if (active) setApps(list); })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [role]);

  if (role === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  // The newest application is the student's active one.
  const active = apps[0] ?? null;
  const agentName = profile?.agent?.name ?? null;


  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {firstName || 'there'}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your study abroad journey.</p>
      </div>

      {/* Popular Services Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Essential Services</h2>
          <Button variant="ghost" render={<Link to="/dashboard/services" />} className="text-primary hover:text-primary/80">
            <span className="flex items-center gap-2">
              View All Services <ArrowRight className="w-4 h-4" />
            </span>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickServices.map((service) => (
            <Link key={service.label} to={service.path}>
              <Card className="hover:border-primary transition-all duration-300 group cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", service.color)}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  <span className="font-semibold text-sm">{service.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Active Application */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Application</CardTitle>
            {active && (
              <Badge variant="outline" className={cn('border', statusBadgeClass(active.status))}>
                {STATUS_LABELS[active.status] ?? active.status}
              </Badge>
            )}
          </div>
          <CardDescription>Details of your latest university application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {active ? (
            <>
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
                <div className="w-16 h-16 rounded-lg bg-primary/10 text-primary border flex items-center justify-center shrink-0">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-lg truncate">{active.universityName}</h3>
                  <p className="text-sm text-muted-foreground truncate">{active.course}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto" render={<Link to="/dashboard/applications" />}>
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Application ID</p>
                  <p className="font-mono font-medium text-sm break-all">{active.id}</p>
                </div>
                <div className="p-4 rounded-xl border space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Agent</p>
                  <p className="font-medium">{agentName ?? 'Not assigned yet'}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center space-y-3">
              <GraduationCap className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">You don't have any applications yet.</p>
              <Button render={<Link to="/dashboard/uni" />} className="gap-2">
                Browse Universities <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

