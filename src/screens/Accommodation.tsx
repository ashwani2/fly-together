
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, Loader2, CalendarDays, X, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { api, type Accommodation as AccommodationType, type AccommodationBooking, type BookingStatus } from '@/lib/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

function circleOpts(active: boolean): L.CircleMarkerOptions {
  return {
    radius: active ? 13 : 9,
    fillColor: active ? '#2563eb' : '#ef4444',
    color: '#ffffff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.9,
  };
}

// City-based coordinate fallbacks for UK university cities
const CITY_COORDS: Record<string, [number, number]> = {
  oxford: [51.752, -1.2577],
  london: [51.5074, -0.1278],
  manchester: [53.4808, -2.2426],
  birmingham: [52.4862, -1.8904],
  edinburgh: [55.9533, -3.1883],
  cambridge: [52.2053, 0.1218],
  bristol: [51.4545, -2.5879],
  leeds: [53.8008, -1.5491],
  sheffield: [53.3811, -1.4701],
  nottingham: [52.9548, -1.1581],
  liverpool: [53.4084, -2.9916],
  glasgow: [55.8642, -4.2518],
};

function getCoords(acc: AccommodationType): [number, number] | null {
  if (acc.lat && acc.lng) return [acc.lat, acc.lng];
  const city = acc.city.toLowerCase().split(',')[0].trim();
  return CITY_COORDS[city] ?? null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function minCheckout(checkIn: string) {
  const d = new Date(checkIn);
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; icon: React.ReactNode; className: string }> = {
  PENDING:   { label: 'Pending',   icon: <Clock className="w-3 h-3" />,        className: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmed', icon: <CheckCircle2 className="w-3 h-3" />, className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', icon: <XCircle className="w-3 h-3" />,      className: 'bg-red-100 text-red-800' },
};

// ── Map component ─────────────────────────────────────────────────────────────
function AccommodationMap({
  items,
  selectedId,
  onSelect,
}: {
  items: AccommodationType[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const rafRef = useRef<number>(0);

  // Stable callback so the markers effect doesn't re-run when parent re-renders
  const stableSelect = useCallback(onSelect, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Single effect handles init + markers together.
  // Splitting them caused a race: the markers effect ran before the RAF
  // inside the init effect fired, so Leaflet hadn't measured the container yet
  // and placed markers in a 0×0 world.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // ── 1. Init map (once) ────────────────────────────────────────────────
    if (!mapRef.current) {
      mapRef.current = L.map(el, { zoomControl: true }).setView([52.5, -1.5], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    // ── 2. Add / update markers after the browser has laid out the container
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      map.invalidateSize();                         // fix any 0-height init

      const currentIds = new Set(items.map((a) => a.id));

      // Remove markers that are no longer in the list
      markersRef.current.forEach((m, id) => {
        if (!currentIds.has(id)) { m.remove(); markersRef.current.delete(id); }
      });

      const points: L.LatLng[] = [];
      items.forEach((acc) => {
        const coords = getCoords(acc);
        if (!coords) return;
        const ll = L.latLng(coords[0], coords[1]);
        points.push(ll);

        if (!markersRef.current.has(acc.id)) {
          const m = L.circleMarker(ll, circleOpts(acc.id === selectedId)).addTo(map);
          m.bindPopup(`<b>${acc.name}</b><br/>${acc.city}<br/><i>${acc.price}</i>`);
          m.on('click', () => stableSelect(acc.id));
          markersRef.current.set(acc.id, m);
        }
      });

      if (points.length > 0) {
        map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
      }
    });

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [items, stableSelect, selectedId]);

  // Highlight + pan when selection changes (markers already exist)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m, id) => m.setStyle(circleOpts(id === selectedId)));
    if (!selectedId) return;
    const m = markersRef.current.get(selectedId);
    if (m) {
      map.setView(m.getLatLng(), Math.max(map.getZoom(), 13), { animate: true });
      m.openPopup();
    }
  }, [selectedId]);

  // Destroy on unmount
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    mapRef.current?.remove();
    mapRef.current = null;
    markersRef.current.clear();
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

// ── Booking dialog ────────────────────────────────────────────────────────────
function BookingDialog({
  acc,
  onClose,
  onBooked,
}: {
  acc: AccommodationType;
  onClose: () => void;
  onBooked: () => void;
}) {
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(minCheckout(today()));
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError('Check-out must be after check-in.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.accommodations.book(acc.id, { checkIn, checkOut, message: message.trim() || undefined });
      setDone(true);
      // Signal TopNav to re-fetch notifications immediately (student sees confirmation sooner)
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
      setTimeout(onBooked, 1500);
    } catch (err: any) {
      setError(err?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{done ? 'Booking Requested!' : `Book — ${acc.name}`}</DialogTitle>
      </DialogHeader>

      {done ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <CheckCircle2 className="w-16 h-16 text-green-500" />
          <p className="text-center text-muted-foreground">Your booking request has been submitted. We'll confirm shortly.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Property summary */}
          <div className="flex gap-3 p-3 rounded-xl bg-muted/40">
            <img src={acc.image} alt={acc.name} className="w-20 h-16 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{acc.name}</p>
              <p className="text-xs text-muted-foreground">{acc.city} · {acc.type}</p>
              <p className="text-xs font-medium text-primary mt-1">{acc.price}</p>
              {acc.universityProximity && <p className="text-[10px] text-muted-foreground truncate">{acc.universityProximity}</p>}
            </div>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="checkIn">Check-in</Label>
              <Input
                id="checkIn"
                type="date"
                min={today()}
                value={checkIn}
                onChange={(e) => { setCheckIn(e.target.value); if (checkOut <= e.target.value) setCheckOut(minCheckout(e.target.value)); }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkOut">Check-out</Label>
              <Input
                id="checkOut"
                type="date"
                min={minCheckout(checkIn)}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
              />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="message">Message to host <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="message"
              placeholder="Tell us about your requirements..."
              className="resize-none"
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <CalendarDays className="w-4 h-4" />
              Request Booking
            </Button>
          </DialogFooter>
        </form>
      )}
    </DialogContent>
  );
}

// ── My Bookings tab ───────────────────────────────────────────────────────────
function MyBookings() {
  const [bookings, setBookings] = useState<AccommodationBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.accommodations.myBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  if (!bookings.length) return <p className="text-sm text-muted-foreground text-center py-10">No bookings yet.</p>;

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const cfg = STATUS_CONFIG[b.status];
        return (
          <Card key={b.id} className="border-muted/60">
            <CardContent className="p-4 flex gap-4 items-start">
              <img src={b.accommodation.image} alt={b.accommodation.name} className="w-20 h-16 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm truncate">{b.accommodation.name}</p>
                  <span className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0', cfg.className)}>
                    {cfg.icon}{cfg.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{b.accommodation.city} · {b.accommodation.type}</p>
                <p className="text-xs mt-1">
                  <span className="font-medium">Check-in:</span> {new Date(b.checkIn).toLocaleDateString()}
                  <span className="mx-2 text-muted-foreground">→</span>
                  <span className="font-medium">Check-out:</span> {new Date(b.checkOut).toLocaleDateString()}
                </p>
                {b.message && <p className="text-xs text-muted-foreground mt-1 truncate">"{b.message}"</p>}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Accommodation() {
  const [items, setItems] = useState<AccommodationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bookingTarget, setBookingTarget] = useState<AccommodationType | null>(null);
  const [bookingsKey, setBookingsKey] = useState(0);

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

  const selectedAcc = items.find((a) => a.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Accommodation</h1>
          <p className="text-muted-foreground">Find your home away from home.</p>
        </div>
        <Input
          placeholder="Search area, university..."
          className="w-full md:w-64"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Tabs defaultValue="browse">
        <TabsList>
          <TabsTrigger value="browse">Browse</TabsTrigger>
          <TabsTrigger value="my-bookings">My Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-4">
          <div className="flex flex-col md:flex-row gap-6" style={{ height: 'calc(100vh - 18rem)' }}>

            {/* List */}
            <ScrollArea className="w-full md:w-80 shrink-0">
              <div className="space-y-3 pb-4 md:pr-2">
                {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}
                {!loading && accommodations.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">No accommodations found.</p>
                )}
                {accommodations.map((acc) => (
                  <Card
                    key={acc.id}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md border-muted/60 group',
                      selectedId === acc.id ? 'border-primary ring-1 ring-primary' : '',
                    )}
                    onClick={() => setSelectedId(acc.id)}
                  >
                    <div className="relative h-32 overflow-hidden rounded-t-xl">
                      <img src={acc.image} alt={acc.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                      <Badge className="absolute top-2 right-2 bg-card/90 text-card-foreground border-border text-xs">{acc.price}</Badge>
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-sm leading-tight">{acc.name}</h3>
                        <Badge variant="secondary" className="text-[10px] shrink-0">{acc.type}</Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1 shrink-0" />{acc.city}
                      </div>
                      {acc.universityProximity && <p className="text-[10px] text-primary font-medium truncate">{acc.universityProximity}</p>}
                      {acc.amenities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {acc.amenities.slice(0, 3).map((a) => (
                            <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a}</span>
                          ))}
                        </div>
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-1 h-7 text-xs"
                        onClick={(e) => { e.stopPropagation(); setBookingTarget(acc); }}
                      >
                        Book Now
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Map — isolation:isolate keeps Leaflet's internal z-indices (up to 1000)
                contained within this stacking context so the dialog always renders on top */}
            <div className="hidden md:block flex-1 rounded-2xl overflow-hidden border border-muted/30" style={{ isolation: 'isolate' }}>
              {!loading && (
                <AccommodationMap
                  items={accommodations}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
            </div>
          </div>

          {/* Selected detail strip (mobile / below map) */}
          {selectedAcc && (
            <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-muted/40 flex flex-col sm:flex-row gap-4 items-start">
              <img src={selectedAcc.image} alt={selectedAcc.name} className="w-full sm:w-32 h-24 object-cover rounded-lg shrink-0" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="font-bold">{selectedAcc.name}</h3>
                  <Badge variant="secondary">{selectedAcc.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{selectedAcc.city}{selectedAcc.universityProximity ? ` · ${selectedAcc.universityProximity}` : ''}</p>
                <p className="text-sm">{selectedAcc.description}</p>
                {selectedAcc.amenities?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {selectedAcc.amenities.map((a) => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a}</span>
                    ))}
                  </div>
                )}
              </div>
              <Button className="shrink-0 gap-2" onClick={() => setBookingTarget(selectedAcc)}>
                <CalendarDays className="w-4 h-4" />
                Book Now
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-bookings" className="mt-4">
          <MyBookings key={bookingsKey} />
        </TabsContent>
      </Tabs>

      {/* Booking dialog */}
      <Dialog open={!!bookingTarget} onOpenChange={(open) => { if (!open) setBookingTarget(null); }}>
        {bookingTarget && (
          <BookingDialog
            acc={bookingTarget}
            onClose={() => setBookingTarget(null)}
            onBooked={() => { setBookingTarget(null); setBookingsKey((k) => k + 1); }}
          />
        )}
      </Dialog>
    </div>
  );
}
