
import React from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  Home, 
  Banknote, 
  Truck,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const services = [
  {
    id: 'loans',
    title: 'Loan Application',
    description: 'Quick and easy education loans from leading financial institutions with preferential interest rates.',
    icon: Banknote,
    path: '/dashboard/loan-application',
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    tag: 'Financial Aid'
  },
  {
    id: 'accommodation',
    title: 'Accommodation',
    description: 'Safe, affordable, and student-friendly housing options near top universities worldwide.',
    icon: Home,
    path: '/dashboard/accommodation',
    color: 'bg-green-500/10 text-green-500 border-green-500/20',
    tag: 'Housing'
  },
  {
    id: 'universities',
    title: 'Universities',
    description: 'Explore world-class universities and courses tailored to your academic goals and budget.',
    icon: GraduationCap,
    path: '/dashboard/uni',
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    tag: 'Education'
  },
  {
    id: 'logistics',
    title: 'RoyalRahi Logistics',
    description: 'Specialized logistics services for international students, including door-to-door storage and shipping.',
    icon: Truck,
    path: '/dashboard/market',
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    tag: 'Shipping'
  }
];

export default function Services() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Our Services</h1>
        <p className="text-muted-foreground">Everything you need for your international education journey in one place.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="h-full group hover:shadow-lg transition-all duration-300 border-muted/60 overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${service.color}`}>
                    <service.icon className="w-6 h-6" />
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${service.color}`}>
                    {service.tag}
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{service.title}</CardTitle>
                <CardDescription className="text-base">{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                   className="w-full justify-between hover:bg-primary hover:text-primary-foreground group"
                  onClick={() => service.path !== '#' && navigate(service.path)}
                >
                  Explore Service
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="bg-primary/5 border-primary/10">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start text-primary">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-bold uppercase tracking-wider text-xs">Verified Partners</span>
            </div>
            <h3 className="text-xl font-bold">Safe & Reliable Experience</h3>
            <p className="text-muted-foreground max-w-md">All our service providers go through a rigorous verification process to ensure you get the best quality support.</p>
          </div>
          <Button size="lg" className="shrink-0">Contact Support</Button>
        </CardContent>
      </Card>
    </div>
  );
}
