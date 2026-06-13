
import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { api, type Accommodation as AccommodationType } from '@/lib/api';

export default function Accommodation() {
  const [items, setItems] = useState<AccommodationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.accommodations.list();
        setItems(list);
        if (list.length) setSelectedId(list[0].id);
      } catch (e) {
        console.error('Failed to load accommodations', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const accommodations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) => a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || (a.universityProximity ?? '').toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <div className="md:h-[calc(100vh-12rem)] flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Accommodation</h1>
          <p className="text-muted-foreground">Find your home away from home.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search area, university..."
            className="w-full md:w-64"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
        {/* List View */}
        <ScrollArea className="w-full md:w-1/3">
          <div className="space-y-4 pb-4 md:pr-4">
            {loading && (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            )}
            {!loading && accommodations.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No accommodations found.</p>
            )}
            {accommodations.map((acc) => (
              <Card
                key={acc.id}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md border-muted/60',
                  selectedId === acc.id ? 'border-primary ring-1 ring-primary' : '',
                )}
                onClick={() => setSelectedId(acc.id)}
              >
                <div className="relative h-32">
                  <img src={acc.image} alt={acc.name} className="w-full h-full object-cover rounded-t-xl" referrerPolicy="no-referrer" />
                  <Badge className="absolute top-2 right-2 bg-card/90 text-card-foreground border-border">{acc.price}</Badge>
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-sm">{acc.name}</h3>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{acc.type}</Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 mr-1" />
                    {acc.city}
                  </div>
                  {acc.universityProximity && <p className="text-[10px] text-primary font-medium">{acc.universityProximity}</p>}
                  {acc.amenities?.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {acc.amenities.slice(0, 3).map((a) => (
                        <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a}</span>
                      ))}
                    </div>
                  )}
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
