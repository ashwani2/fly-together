import React from 'react';
import { MapPin, Loader2, Search, Lock, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const COUNTRY = 'United Kingdom';

// The city list is served from the backend (GET /api/cities). This short list is
// only a resilience fallback if that request fails, so the picker still works.
const FALLBACK_CITIES = [
  'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Edinburgh',
  'Liverpool', 'Bristol', 'Sheffield', 'Nottingham', 'Newcastle upon Tyne',
  'Cardiff', 'Coventry', 'Southampton', 'Belfast',
];

export interface CourseLocation {
  country: string;
  city: string;
}

interface CourseLocationModalProps {
  open: boolean;
  course: string;
  /** Prefill from the previous search so re-searching keeps the user's city. */
  initial?: CourseLocation;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (location: CourseLocation) => void;
}

/**
 * Collected after a course is chosen, before we search. The country is fixed to
 * the United Kingdom; the student picks a UK city from a searchable list.
 */
export function CourseLocationModal({
  open,
  course,
  initial,
  loading = false,
  onClose,
  onSubmit,
}: CourseLocationModalProps) {
  const [city, setCity] = React.useState(initial?.city ?? '');
  const [showList, setShowList] = React.useState(false);
  const [cities, setCities] = React.useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = React.useState(true);

  // Load the city list from the backend once. Falls back to a small built-in
  // list if the request fails, so the picker is never empty.
  React.useEffect(() => {
    let active = true;
    api.cities
      .list(COUNTRY)
      .then((rows) => { if (active) setCities(rows.map((c) => c.name)); })
      .catch(() => { if (active) setCities(FALLBACK_CITIES); })
      .finally(() => { if (active) setCitiesLoading(false); });
    return () => { active = false; };
  }, []);

  // Reset the field whenever the modal is (re)opened, so a stale entry from a
  // previous search doesn't linger unexpectedly.
  React.useEffect(() => {
    if (!open) return;
    setCity(initial?.city ?? '');
    setShowList(false);
  }, [open, initial]);

  const filteredCities = React.useMemo(() => {
    const q = city.trim().toLowerCase();
    if (!q) return cities;
    const starts = cities.filter((c) => c.toLowerCase().startsWith(q));
    const contains = cities.filter(
      (c) => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q),
    );
    return [...starts, ...contains];
  }, [city, cities]);

  const canSubmit = city.trim().length > 0 && !loading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ country: COUNTRY, city: city.trim() });
  };

  const pickCity = (c: string) => {
    setCity(c);
    setShowList(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !loading) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1">
            <MapPin className="w-6 h-6" />
          </div>
          <DialogTitle>Which city do you want to study in?</DialogTitle>
          <DialogDescription>
            Pick a UK city for <span className="font-semibold text-foreground">{course}</span> and
            we'll find the best universities there.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Country — fixed to the UK, not editable. */}
          <div className="space-y-2">
            <Label>Country</Label>
            <div className="flex h-10 items-center justify-between rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{COUNTRY}</span>
              <Lock className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* City — searchable list of UK cities. */}
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="city"
                autoComplete="off"
                placeholder={citiesLoading ? 'Loading cities…' : 'Search UK cities…'}
                value={city}
                onChange={(e) => { setCity(e.target.value); setShowList(true); }}
                onFocus={() => setShowList(true)}
                onBlur={() => setTimeout(() => setShowList(false), 150)}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />

              {showList && filteredCities.length > 0 && (
                <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                  {filteredCities.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => pickCity(c)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-primary/5"
                      >
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                        <span className="text-foreground">{c}</span>
                        {c.toLowerCase() === city.trim().toLowerCase() && (
                          <Check className="ml-auto h-4 w-4 text-primary" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit} className="gap-2 font-bold">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Searching…' : 'Find universities'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
