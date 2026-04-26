
import React from 'react';
import { ShoppingBag, Home, Plane, CreditCard, Truck, Star, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockServices } from '@/mockData';
import { cn } from '@/lib/utils';

const categories = [
  { icon: Home, label: 'Accommodation', color: 'bg-blue-500' },
  { icon: Plane, label: 'Ticket Booking', color: 'bg-indigo-500' },
  { icon: CreditCard, label: 'Online Payment', color: 'bg-emerald-500' },
  { icon: Truck, label: 'Royal Rahi Logistics', color: 'bg-amber-500' },
];

export default function Marketplace() {
  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Service Marketplace</h1>
        <p className="text-muted-foreground">Everything you need for your journey, all in one place.</p>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Card key={cat.label} className="hover:border-primary cursor-pointer transition-colors group">
            <CardContent className="p-6 flex flex-col items-center gap-3">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform", cat.color)}>
                <cat.icon className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm">{cat.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Partners</h2>
          <Button variant="ghost" className="text-primary">View all partners</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockServices.map((service) => (
            <Card key={service.id} className="overflow-hidden group border-muted/60">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4">
                  <Badge className="bg-card/90 backdrop-blur text-card-foreground border-border hover:bg-card">
                    <Star className="w-3 h-3 mr-1 fill-amber-500 text-amber-500" />
                    {service.rating}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-2">{service.category}</Badge>
                    <CardTitle className="text-xl">{service.name}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{service.description}</p>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-xs font-medium text-muted-foreground uppercase">Starting Price</span>
                  <span className="font-bold text-primary">{service.price}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  Request Service
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
