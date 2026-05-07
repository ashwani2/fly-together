
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ThemeScopeWrapper } from '@/lib/ThemeContext';

interface Course {
  courseName: string;
  price: string;
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
  
  const [searchQuery, setSearchQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<University[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchResults = async (query: string) => {
    if (!query) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://universitysearch-jvqc.onrender.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
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

  React.useEffect(() => {
    if (initialQuery) {
      fetchResults(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchResults(searchQuery);
    }
  };

  return (
    <ThemeScopeWrapper scope="home">
      <div className="min-h-screen bg-muted/30 pb-20">
        <header className="bg-background border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 h-20 flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search university or course name..."
                className="pl-10 h-12 rounded-full border-primary/20 focus-visible:ring-primary"
              />
              <Button 
                type="submit" 
                className="absolute right-1 top-1 h-10 rounded-full px-6"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </form>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
            <p className="text-muted-foreground mt-1">
              {loading ? 'Finding the best opportunities for you...' : `Found ${results.length} universities for "${searchQuery}"`}
            </p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-muted-foreground animate-pulse">Scanning top UK universities...</p>
            </div>
          )}

          {error && !loading && (
            <Card className="border-destructive/20 bg-destructive/5 max-w-2xl mx-auto">
              <CardContent className="p-10 flex flex-col items-center text-center gap-4">
                <AlertCircle className="w-12 h-12 text-destructive" />
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Something went wrong</h3>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <Button onClick={() => fetchResults(searchQuery)} variant="outline">Try Again</Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && results.length === 0 && searchQuery && (
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
              <Button onClick={() => setSearchQuery('Artificial Intelligence')} variant="link" className="text-primary font-bold">
                Try "Artificial Intelligence"
              </Button>
            </div>
          )}

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
                      <Button className="w-full rounded-xl gap-2 font-bold shadow-lg shadow-primary/10 hover:shadow-primary/20">
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
                              <span className="font-mono text-primary font-bold">£{Number(course.price).toLocaleString()}</span>
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
        </main>
      </div>
    </ThemeScopeWrapper>
  );
}
