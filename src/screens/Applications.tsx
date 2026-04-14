
import React from 'react';
import { CheckCircle2, Clock, CreditCard, Download, ExternalLink, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const timeline = [
  {
    title: 'Application Submitted',
    date: 'March 15, 2024',
    status: 'completed',
    description: 'Your application for MSc Computer Science was successfully submitted.',
  },
  {
    title: 'Documents Verified',
    date: 'March 18, 2024',
    status: 'completed',
    description: 'All required documents have been verified by our consultants.',
  },
  {
    title: 'Sent to University',
    date: 'March 20, 2024',
    status: 'completed',
    description: 'Application forwarded to University of Oxford admissions office.',
  },
  {
    title: 'Conditional Offer Received',
    date: 'April 05, 2024',
    status: 'current',
    description: 'Congratulations! You have received a conditional offer.',
  },
  {
    title: 'Payment Pending',
    date: 'Expected by April 15',
    status: 'pending',
    description: 'Deposit payment required to secure your seat.',
  },
];

export default function Applications() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Application Status</h1>
        <p className="text-muted-foreground">Track your journey from submission to enrollment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Timeline */}
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Journey Timeline</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                {timeline.map((item, idx) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    {/* Icon */}
                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10",
                      item.status === 'completed' ? "bg-primary text-primary-foreground" :
                      item.status === 'current' ? "bg-white border-primary text-primary animate-pulse" :
                      "bg-slate-100 text-slate-400"
                    )}>
                      {item.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : 
                       item.status === 'current' ? <Clock className="w-5 h-5" /> : 
                       <div className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    {/* Content */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-slate-900">{item.title}</div>
                        <time className="font-mono text-xs text-primary">{item.date}</time>
                      </div>
                      <div className="text-slate-500 text-sm">{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Next Payment
              </CardTitle>
              <CardDescription>Secure your enrollment deposit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-background border shadow-sm space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Amount Due</p>
                <p className="text-3xl font-bold">£2,500.00</p>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">Due in 5 days</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Application Fee</span>
                  <span className="font-medium">£50.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tuition Deposit</span>
                  <span className="font-medium">£2,450.00</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20">
                Pay Securely Now
              </Button>
              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground">
                <ShieldCheck className="w-3 h-3" />
                SSL Secured Payment by Stripe
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                <Download className="w-4 h-4" />
                Download Offer Letter
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                <ExternalLink className="w-4 h-4" />
                University Portal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
