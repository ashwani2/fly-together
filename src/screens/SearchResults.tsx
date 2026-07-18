
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  MapPin,
  Search,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeScopeWrapper } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { ApplicationPreview } from '@/components/ApplicationPreview';
import { CourseLocationModal, type CourseLocation } from '@/components/CourseLocationModal';
import { swal } from '@/lib/swal';

const COURSE_SUGGESTIONS = [
  "Artificial Intelligence",
  "Machine Learning",
  "Data Science",
  "Data Analytics",
  "Computer Science",
  "Cyber Security",
  "Software Engineering",
  "Information Technology",
  "Business Analytics",
  "Business Administration (MBA)",
  "Finance",
  "Accounting",
  "Economics",
  "Marketing",
  "International Business",
  "Management",
  "Human Resource Management",
  "Project Management",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "Aerospace Engineering",
  "Biomedical Engineering",
  "Chemical Engineering",
  "Medicine",
  "Nursing",
  "Pharmacy",
  "Public Health",
  "Biotechnology",
  "Biology",
  "Psychology",
  "Law",
  "Architecture",
  "Graphic Design",
  "Fashion Design",
  "Physics",
  "Mathematics",
  "Chemistry",
  "Environmental Science",
  "Hospitality Management",
  "Tourism Management",
  "Media and Communication",
  "Journalism",
  "Political Science",
  "International Relations",
  "Education",
  "Philosophy",
  "Natural Sciences",
  "Arts",
];

interface Course {
  courseName: string;
  price: string;
}

// The search service returns `price` as a display-ready string with the local
// currency (e.g. "£34,000", "$40,000–$44,000"). Older/bare responses may still
// be a plain number — in that case format with separators (no assumed currency,
// since results are no longer UK-only).
function formatPrice(price: string): string {
  const raw = (price ?? '').trim();
  if (!raw) return 'Contact university';
  if (/^\d[\d,]*(\.\d+)?$/.test(raw)) return Number(raw.replace(/,/g, '')).toLocaleString();
  return raw;
}

interface University {
  universityName: string;
  location: string;
  courses: Course[];
}

interface SearchResponse {
  success: boolean;
  total: number;
  results: University[];
}

export default function SearchResults() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';

  const navigate = useNavigate();
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = React.useState(false);
  const [pending, setPending] = React.useState<{ universityName: string; course: string } | null>(null);
  const [preview, setPreview] = React.useState<{ universityName: string; course: string } | null>(null);
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [results, setResults] = React.useState<University[]>([]);
  const [searched, setSearched] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // Course awaiting a country/city choice — non-null opens the location modal.
  const [pendingCourse, setPendingCourse] = React.useState<string | null>(null);
  // Kept across searches so the results heading and re-searches stay location-aware.
  const [searchLocation, setSearchLocation] = React.useState<CourseLocation | null>(null);

  const suggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return COURSE_SUGGESTIONS.slice(0, 10);
    const starts = COURSE_SUGGESTIONS.filter(c => c.toLowerCase().startsWith(q));
    const contains = COURSE_SUGGESTIONS.filter(c => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q));
    return [...starts, ...contains].slice(0, 8);
  }, [searchQuery]);

  const handleInquire = (uni: University) => {
    const p = { universityName: uni.universityName, course: uni.courses[0]?.courseName || 'General Studies' };
    if (user) {
      setPreview(p);
    } else {
      setPending(p);
      setAuthOpen(true);
    }
  };

  const fetchResults = async (course: string, loc: CourseLocation) => {
    if (!course) return;
    setShowSuggestions(false);
    setSearched(true);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://universitysearch-jvqc.onrender.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: course, country: loc.country, city: loc.city }),
      });
      const data: SearchResponse = await response.json();
      if (data.success) {
        setResults(data.results);
      } else {
        setError('Failed to fetch results. Please try again.');
      }
    } catch (err) {
      setError('An error occurred while searching. Please check your connection.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Every course selection funnels through here: stash the course and open the
  // country/city modal instead of searching straight away.
  const selectCourse = (course: string) => {
    const trimmed = course.trim();
    if (!trimmed) return;
    setSearchQuery(trimmed);
    setShowSuggestions(false);
    setPendingCourse(trimmed);
  };

  const runSearch = (loc: CourseLocation) => {
    const course = pendingCourse;
    setSearchLocation(loc);
    setPendingCourse(null);
    if (course) fetchResults(course, loc);
  };

  const pickSuggestion = (s: string) => selectCourse(s);

  React.useEffect(() => {
    if (initialQuery) selectCourse(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    selectCourse(searchQuery);
  };

  return (
    <ThemeScopeWrapper scope="home">
      <div className="min-h-screen bg-muted/30 pb-20">
        <header className="bg-background border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 h-20 flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>

            {/* Search bar with course suggestions dropdown */}
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); selectCourse(searchQuery); } }}
                  placeholder="Search for Artificial Intelligence, Business..."
                  autoComplete="off"
                  className="w-full pl-10 pr-28 h-12 rounded-full border border-primary/20 bg-background text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  type="submit"
                  className="absolute right-1 top-1 h-10 rounded-full px-6"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                  >
                    {!searchQuery.trim() && (
                      <li className="px-5 pt-3 pb-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Popular courses</span>
                      </li>
                    )}
                    {suggestions.map((s) => (
                      <li key={s} className="border-b border-border/40 last:border-0">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => pickSuggestion(s)}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-primary/5"
                        >
                          <Search className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                          <span className="font-medium text-foreground">{s}</span>
                          <span className="ml-auto text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Course</span>
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </form>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Initial state — no search done yet */}
          {!searched && !loading && (
            <div className="text-center py-16 space-y-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <GraduationCap className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Find your perfect course</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Click the search bar above and pick a course — we'll find the best UK universities for you.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto pt-2">
                {COURSE_SUGGESTIONS.slice(0, 12).map((s) => (
                  <button
                    key={s}
                    onClick={() => pickSuggestion(s)}
                    className="px-4 py-2 rounded-full border border-border bg-card text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-muted-foreground animate-pulse">
                {searchLocation ? `Scanning top universities in ${searchLocation.city}, ${searchLocation.country}...` : 'Scanning top universities...'}
              </p>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <Card className="border-destructive/20 bg-destructive/5 max-w-2xl mx-auto">
              <CardContent className="p-10 flex flex-col items-center text-center gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Something went wrong</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <Button
                  onClick={() => { if (searchLocation) fetchResults(searchQuery, searchLocation); }}
                  variant="outline"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* No results after search */}
          {searched && !loading && !error && results.length === 0 && (
            <div className="text-center py-20 space-y-6">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Search className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">No results found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any universities or courses matching "{searchQuery}".
                  Try searching for a specific field like "Artificial Intelligence" or "Business".
                </p>
              </div>
              <Button onClick={() => pickSuggestion('Artificial Intelligence')} variant="link" className="text-primary font-bold">
                Try "Artificial Intelligence"
              </Button>
            </div>
          )}

          {/* Results */}
          {searched && !loading && results.length > 0 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
                <p className="text-muted-foreground mt-1">
                  Found {results.length} universities for "{searchQuery}"
                  {searchLocation ? ` in ${searchLocation.city}, ${searchLocation.country}` : ''}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {results.map((uni, idx) => (
                  <motion.div
                    key={uni.universityName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all group bg-card">
                      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x border-b">
                        <div className="p-8 md:w-1/3 flex flex-col justify-between space-y-6">
                          <div className="space-y-4">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <GraduationCap className="w-8 h-8" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-bold leading-tight">{uni.universityName}</h2>
                              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm">{uni.location}</span>
                              </div>
                            </div>
                          </div>
                          <Button onClick={() => handleInquire(uni)} className="w-full rounded-xl gap-2 font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20">
                            Inquire Now <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="p-8 md:flex-1 bg-muted/10">
                          <div className="flex items-center gap-2 mb-6">
                            <BookOpen className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-bold">Available Courses</h3>
                            <Badge variant="secondary" className="ml-auto">{uni.courses.length} courses</Badge>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-4">
                            {uni.courses.map((course, cIdx) => (
                              <div
                                key={cIdx}
                                className="p-4 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors space-y-3"
                              >
                                <h4 className="font-bold leading-snug">{course.courseName}</h4>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">Annual Fee</span>
                                  <span className="font-mono text-primary font-bold">{formatPrice(course.price)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </main>

        <CourseLocationModal
          open={pendingCourse !== null}
          course={pendingCourse ?? ''}
          initial={searchLocation ?? undefined}
          onClose={() => setPendingCourse(null)}
          onSubmit={runSearch}
        />

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            setAuthOpen(false);
            if (pending) { setPreview(pending); setPending(null); }
            else navigate('/dashboard');
          }}
          intent="Sign in to start your application"
        />

        <ApplicationPreview
          open={!!preview}
          universityName={preview?.universityName ?? ''}
          course={preview?.course ?? ''}
          onClose={() => setPreview(null)}
          onSubmitted={() => {
            setPreview(null);
            swal.success('Your application has been submitted successfully.', 'Application submitted');
            navigate('/dashboard/applications');
          }}
        />
      </div>
    </ThemeScopeWrapper>
  );
}
