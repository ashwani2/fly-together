
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
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockStudent, mockNotifications } from '@/mockData';
import { ApplicationStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { Navigate, Link } from 'react-router-dom';

const steps: { label: ApplicationStatus; icon: any }[] = [
  { label: 'Profile', icon: UserCircle },
  { label: 'Documents', icon: FileText },
  { label: 'Verification', icon: ShieldCheck },
  { label: 'Application', icon: GraduationCap },
  { label: 'Payment', icon: CreditCard },
];

const quickServices = [
  { icon: GraduationCap, label: 'Universities', path: '/dashboard/uni', color: 'bg-indigo-500/10 text-indigo-500' },
  { icon: Home, label: 'Accommodation', path: '/dashboard/accommodation', color: 'bg-emerald-500/10 text-emerald-500' },
  { icon: Banknote, label: 'Loan Help', path: '/dashboard/loan-application', color: 'bg-blue-500/10 text-blue-500' },
  { icon: Truck, label: 'Logistics', path: '/dashboard/market', color: 'bg-amber-500/10 text-amber-500' },
];

export default function Dashboard() {
  const { role, user } = useAuth();
  
  if (role === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }

  const currentStepIndex = steps.findIndex(s => s.label === mockStudent.status);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {mockStudent.name.split(' ')[0]}!</h1>
        <p className="text-muted-foreground">Here's what's happening with your study abroad journey.</p>
      </div>

      {/* Progress Tracker */}
      <Card className="border-none shadow-sm bg-primary/5">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Application Progress</h2>
              <p className="text-sm text-muted-foreground">You are currently at the <span className="text-primary font-medium">{mockStudent.status}</span> stage.</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{mockStudent.progress}%</span>
              <p className="text-xs text-muted-foreground">Overall Completion</p>
            </div>
          </div>
          
          <Progress value={mockStudent.progress} className="h-3 mb-10" />

          <div className="relative flex justify-between">
            {steps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              
              return (
                <div key={step.label} className="flex flex-col items-center gap-3 relative z-10 group">
                  <div className={cn(
                    "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                    isCompleted ? "bg-primary border-primary text-primary-foreground" : 
                    isCurrent ? "bg-background border-primary text-primary shadow-lg scale-110" : 
                    "bg-background border-muted text-muted-foreground"
                  )}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> : <step.icon className="w-5 h-5 md:w-6 md:h-6" />}
                  </div>
                  <span className={cn(
                    "text-[10px] md:text-xs font-medium transition-colors hidden sm:block",
                    isCurrent ? "text-primary" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
            {/* Connector Line */}
            <div className="absolute top-5 md:top-6 left-0 w-full h-[2px] bg-muted -z-0" />
            <div 
              className="absolute top-5 md:top-6 left-0 h-[2px] bg-primary transition-all duration-500 -z-0" 
              style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Active Application */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Application</CardTitle>
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">In Review</Badge>
            </div>
            <CardDescription>Details of your primary university application.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
              <div className="w-16 h-16 rounded-lg bg-white dark:bg-white/90 border flex items-center justify-center p-2">
                <img src="https://logo.clearbit.com/ox.ac.uk" alt="Oxford" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{mockStudent.university}</h3>
                <p className="text-sm text-muted-foreground">{mockStudent.course}</p>
              </div>
              <Button variant="ghost" size="icon" className="ml-auto">
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Application ID</p>
                <p className="font-mono font-medium">LFT-2024-8892</p>
              </div>
              <div className="p-4 rounded-xl border space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Consultant</p>
                <p className="font-medium">Sarah Williams</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Updates</CardTitle>
            <CardDescription>Stay updated with your status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockNotifications.slice(0, 3).map((n) => (
              <div key={n.id} className="flex gap-3 pb-4 border-b last:border-0 last:pb-0">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-1.5 shrink-0",
                  n.type === 'success' ? "bg-green-500" : n.type === 'warning' ? "bg-amber-500" : "bg-blue-500"
                )} />
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground">{n.time}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2">View All Updates</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

