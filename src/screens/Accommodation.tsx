
import React, { useState } from 'react';
import { Search, MapPin, Star, Wifi, Coffee, Wind, Shield, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const accommodations = [
  {
    id: 'a1',
    name: 'Chapter Kings Cross',
    location: 'Kings Cross, London',
    price: '£320/week',
    rating: 4.8,
    image: 'https://picsum.photos/seed/kingscross/400/300',
    amenities: ['Wifi', 'Gym', 'Laundry'],
    distance: '0.5 miles from UCL',
  },
  {
    id: 'a2',
    name: 'Scape Shoreditch',
    location: 'Shoreditch, London',
    price: '£295/week',
    rating: 4.6,
    image: 'https://picsum.photos/seed/shoreditch/400/300',
    amenities: ['Wifi', 'Cinema', 'Study Room'],
    distance: '1.2 miles from LSE',
  },
  {
    id: 'a3',
    name: 'Vita Student Manchester',
    location: 'First Street, Manchester',
    price: '£210/week',
    rating: 4.9,
    image: 'https://picsum.photos/seed/manchester-vita/400/300',
    amenities: ['Wifi', 'Breakfast', 'Gym'],
    distance: '0.3 miles from UoM',
  },
];

export default function Accommodation() {
  const [selectedId, setSelectedId] = useState('a1');

  return (
    <div className="md:h-[calc(100vh-12rem)] flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Accommodation</h1>
          <p className="text-muted-foreground">Find your home away from home.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Search area, university..." className="w-full md:w-64" />
          <Button variant="outline">Filters</Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* List View */}
        <ScrollArea className="w-full md:w-1/3">
          <div className="space-y-4 pb-4 md:pr-4">
            {accommodations.map((acc) => (
              <Card 
                key={acc.id} 
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-muted/60",
                  selectedId === acc.id ? "border-primary ring-1 ring-primary" : ""
                )}
                onClick={() => setSelectedId(acc.id)}
              >
                <div className="relative h-32">
                  <img src={acc.image} alt={acc.name} className="w-full h-full object-cover rounded-t-xl" referrerPolicy="no-referrer" />
                  <Badge className="absolute top-2 right-2 bg-card/90 text-card-foreground border-border">{acc.price}</Badge>
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm">{acc.name}</h3>
                    <div className="flex items-center text-xs font-bold text-amber-500">
                      <Star className="w-3 h-3 mr-0.5 fill-amber-500" />
                      {acc.rating}
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 mr-1" />
                    {acc.location}
                  </div>
                  <p className="text-[10px] text-primary font-medium">{acc.distance}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Map Hybrid View */}
        <div className="hidden md:flex flex-1 rounded-2xl bg-muted/30 border border-dashed border-muted-foreground/20 relative overflow-hidden items-center justify-center">
          {/* Mock Map Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>
          
          <div className="relative z-10 text-center space-y-4 max-w-md p-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <MapPin className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold">Interactive Map</h2>
            <p className="text-muted-foreground">
              Explore accommodations near your university. View commute times, local amenities, and neighborhood safety ratings.
            </p>
            <Button size="lg" className="rounded-full px-8">Open Full Map</Button>
          </div>

          {/* Mock Map Markers */}
          <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-primary rounded-full border-4 border-card shadow-lg animate-bounce" />
          <div className="absolute bottom-1/3 right-1/4 w-8 h-8 bg-primary/60 rounded-full border-4 border-card shadow-lg" />
          <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-primary/40 rounded-full border-4 border-card shadow-lg" />
        </div>
      </div>
    </div>
  );
}
