
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, type AccommodationBooking, type BookingStatus } from '@/lib/api';
import { swal } from '@/lib/swal';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface AccRow { id: string; name: string; type: string; price: string; city: string }

const accSchema = z.object({
  name: z.string().trim().min(1, 'Property name is required'),
  city: z.string().trim().min(1, 'City is required'),
  type: z.string().trim().min(1, 'Room type is required'),
  price: z.string().trim().min(1, 'Base rate is required'),
  lat: z.string().optional(),
  lng: z.string().optional(),
});
type AccValues = z.infer<typeof accSchema>;

function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="col-span-3 col-start-2 px-1 text-xs font-medium text-red-600">{msg}</p> : null;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; icon: React.ReactNode; className: string }> = {
  PENDING:   { label: 'Pending',   icon: <Clock className="w-3 h-3" />,        className: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmed', icon: <CheckCircle2 className="w-3 h-3" />, className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelled', icon: <XCircle className="w-3 h-3" />,      className: 'bg-red-100 text-red-800' },
};

function BookingsTab({ highlightPending }: { highlightPending: boolean }) {
  const [bookings, setBookings] = useState<AccommodationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  // Ref keeps the first PENDING row visible after load
  const firstPendingRef = useRef<HTMLTableRowElement>(null);

  const load = async () => {
    try { setBookings(await api.accommodations.listBookings()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Scroll the first pending row into view when the tab opens from a notification
  useEffect(() => {
    if (highlightPending && !loading && firstPendingRef.current) {
      firstPendingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightPending, loading]);

  const updateStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      const updated = await api.accommodations.updateBookingStatus(bookingId, status);
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: updated.status } : b));
      window.dispatchEvent(new CustomEvent('notifications:refresh'));
    } catch (e: any) {
      swal.error(e?.message || 'Update failed');
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground py-6 text-center">Loading bookings…</p>;
  if (!bookings.length) return <p className="text-sm text-muted-foreground py-6 text-center">No booking requests yet.</p>;

  let firstPendingAssigned = false;

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/10">
            <TableRow>
              <TableHead className="px-6">Property</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Check-in</TableHead>
              <TableHead>Check-out</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right px-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => {
              const cfg = STATUS_CONFIG[b.status];
              const isPending = b.status === 'PENDING';
              // Assign the ref to the first PENDING row only
              const isFirstPending = isPending && !firstPendingAssigned;
              if (isFirstPending) firstPendingAssigned = true;

              return (
                <TableRow
                  key={b.id}
                  ref={isFirstPending ? firstPendingRef : undefined}
                  className={cn(
                    'transition-colors duration-700',
                    isPending && highlightPending && 'bg-yellow-50 dark:bg-yellow-950/20',
                  )}
                >
                  <TableCell className="px-6 font-medium py-4">
                    <div>{b.accommodation.name}</div>
                    <div className="text-xs text-muted-foreground">{b.accommodation.city}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{b.user.email}</TableCell>
                  <TableCell className="text-sm">{new Date(b.checkIn).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{new Date(b.checkOut).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-full',
                      cfg.className,
                      isPending && highlightPending && 'ring-2 ring-yellow-400',
                    )}>
                      {cfg.icon}{cfg.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-6 whitespace-nowrap">
                    {isPending && (
                      <>
                        <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateStatus(b.id, 'CONFIRMED')}>
                          <CheckCircle2 className="w-4 h-4 mr-1" />Confirm
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateStatus(b.id, 'CANCELLED')}>
                          <XCircle className="w-4 h-4 mr-1" />Cancel
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function AdminAccommodations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [accs, setAccs] = useState<AccRow[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Read URL params once; switch tab and enable highlight when coming from a notification
  const [activeTab, setActiveTab] = useState<string>(
    () => searchParams.get('tab') === 'bookings' ? 'bookings' : 'listings',
  );
  const [highlightPending, setHighlightPending] = useState<boolean>(
    () => searchParams.get('highlight') === 'true',
  );

  // Clean the URL params after reading so the highlight doesn't persist on refresh
  useEffect(() => {
    if (searchParams.has('tab') || searchParams.has('highlight')) {
      setSearchParams({}, { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fade the highlight out after 4 seconds
  useEffect(() => {
    if (!highlightPending) return;
    const t = setTimeout(() => setHighlightPending(false), 4000);
    return () => clearTimeout(t);
  }, [highlightPending]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AccValues>({
    resolver: zodResolver(accSchema),
    defaultValues: { name: '', city: '', type: '', price: '', lat: '', lng: '' },
  });

  const load = async () => {
    try {
      const list = await api.accommodations.list();
      setAccs(list.map((a) => ({ id: a.id, name: a.name, type: a.type, price: a.price, city: a.city })));
    } catch (e) {
      console.error('Failed to load accommodations', e);
    }
  };

  useEffect(() => { load(); }, []);

  const onAddAcc = async (values: AccValues) => {
    try {
      const toCoord = (v?: string) => (v && v.trim() ? parseFloat(v.trim()) : null);
      await api.accommodations.create({
        name: values.name,
        city: values.city,
        type: values.type,
        price: values.price,
        amenities: [],
        image: `https://picsum.photos/seed/${encodeURIComponent(values.name)}/400/300`,
        description: values.name,
        universityProximity: undefined,
        lat: toCoord(values.lat),
        lng: toCoord(values.lng),
      } as any);
      await load();
    } catch (err: any) {
      swal.error(err?.message || 'Save failed');
      return;
    }
    reset({ name: '', city: '', type: '', price: '', lat: '', lng: '' });
    setIsOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await swal.confirm('This will remove the accommodation listing.', { title: 'Delete listing?', confirmText: 'Delete', variant: 'error' }))) return;
    try {
      await api.accommodations.remove(id);
      setAccs((l) => l.filter((a) => a.id !== id));
    } catch (e: any) {
      swal.error(e?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Accommodation Inventory</h1>
          <p className="text-muted-foreground">Manage student housing listings and booking requests.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) reset({ name: '', city: '', type: '', price: '', lat: '', lng: '' }); }}>
          <DialogTrigger render={
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Listing
            </Button>
          } />
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleSubmit(onAddAcc)} noValidate>
              <DialogHeader>
                <DialogTitle>Add New Accommodation</DialogTitle>
                <DialogDescription>Enter the details of the property you want to list.</DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Property Name */}
                <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="acc-name" className="sm:text-right">Property Name</Label>
                  <Input id="acc-name" className="col-span-3" {...register('name')} />
                  <FieldError msg={errors.name?.message} />
                </div>

                {/* City */}
                <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="acc-city" className="sm:text-right">City</Label>
                  <Input id="acc-city" className="col-span-3" placeholder="e.g. London" {...register('city')} />
                  <FieldError msg={errors.city?.message} />
                </div>

                {/* Room Type */}
                <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="acc-type" className="sm:text-right">Room Type</Label>
                  <Input id="acc-type" className="col-span-3" placeholder="e.g. Studio" {...register('type')} />
                  <FieldError msg={errors.type?.message} />
                </div>

                {/* Base Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-center gap-x-4 gap-y-1.5">
                  <Label htmlFor="acc-price" className="sm:text-right">Base Rate</Label>
                  <Input id="acc-price" className="col-span-3" placeholder="e.g. £300/pw" {...register('price')} />
                  <FieldError msg={errors.price?.message} />
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-4 sm:items-start gap-x-4 gap-y-1.5">
                  <Label className="sm:text-right sm:pt-1.5">Map Pin</Label>
                  <div className="col-span-3 space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="acc-lat"
                        type="number"
                        step="any"
                        placeholder="Latitude (e.g. 51.75)"
                        {...register('lat')}
                      />
                      <Input
                        id="acc-lng"
                        type="number"
                        step="any"
                        placeholder="Longitude (e.g. -1.25)"
                        {...register('lng')}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Optional — sets the exact map marker. Leave blank to use city-level placement.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>List Property</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="listings">Listings</TabsTrigger>
          <TabsTrigger value="bookings">
            Booking Requests
            {highlightPending && (
              <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="listings" className="mt-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="px-6 text-center">Property Name</TableHead>
                    <TableHead className="text-center">Room Type</TableHead>
                    <TableHead className="text-center">Base Rate</TableHead>
                    <TableHead className="text-center">City</TableHead>
                    <TableHead className="text-right px-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accs.map((acc) => (
                    <TableRow key={acc.id} className="group">
                      <TableCell className="font-medium text-center py-4">{acc.name}</TableCell>
                      <TableCell className="text-sm text-center">{acc.type}</TableCell>
                      <TableCell className="font-mono text-sm text-center font-bold text-primary">{acc.price}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">{acc.city}</TableCell>
                      <TableCell className="text-right px-6 whitespace-nowrap">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(acc.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="mt-4">
          <BookingsTab highlightPending={highlightPending} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
