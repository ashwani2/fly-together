import React from "react";
import { motion, useInView } from "motion/react";
import {
  GraduationCap,
  Globe,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  Plane,
  Home,
  Phone,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Quote,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ThemeScopeWrapper } from "@/lib/ThemeContext";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Logo } from "@/components/Logo";
import { HeroGlobe } from "@/components/HeroGlobe";
import { AuthModal } from "@/components/AuthModal";
import { SopGenerator } from "@/components/SopGenerator";
import heroImage from "../../assets/images/Hero.png";
import { Moon, Sun, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockTestimonials, mockHomePartners } from "@/mockData";
import { Testimonial, HomePartner } from "@/types";
import { api } from "@/lib/api";
import { swal } from "@/lib/swal";
import { AnimatePresence } from "motion/react";

// Curated course/subject list used for the hero search typeahead.
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

// Scroll-reveal: fades + lifts content into place once, as it enters the viewport.
function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  key?: React.Key;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Counts up to `value` when scrolled into view — turns static stats into a moment.
function CountUp({
  value,
  suffix = "",
  duration = 1.6,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);
  return (
    <span ref={ref}>
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

// Small uppercase eyebrow used above section titles for editorial hierarchy.
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
      <span className="h-px w-6 bg-primary/50" />
      {children}
    </span>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [authOpen, setAuthOpen] = React.useState(false);
  const [pendingDest, setPendingDest] = React.useState("/dashboard");
  const [authIntent, setAuthIntent] = React.useState<string | undefined>(undefined);
  const [testimonialList, setTestimonialList] = React.useState<Testimonial[]>(
    () => {
      try {
        const saved = localStorage.getItem("testimonials");
        return saved ? JSON.parse(saved) : mockTestimonials;
      } catch (e) {
        console.error("Failed to parse testimonials from localStorage", e);
        return mockTestimonials;
      }
    },
  );
  const [partnerList, setPartnerList] = React.useState<HomePartner[]>(() => {
    try {
      const saved = localStorage.getItem("home_partners");
      return saved ? JSON.parse(saved) : mockHomePartners;
    } catch (e) {
      return mockHomePartners;
    }
  });

  // Load testimonials + home partners from the backend (mock data is the first-paint fallback).
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [ts, ps] = await Promise.all([api.testimonials.list(), api.partners.list()]);
        if (!active) return;
        if (ts.length) {
          setTestimonialList(
            ts.map((t) => ({
              id: t.id,
              studentName: t.studentName,
              universityName: t.universityName ?? undefined,
              content: t.content,
              mediaUrl: t.mediaUrl,
              mediaType: t.mediaType === "VIDEO" ? "video" : "image",
              avatarUrl: t.avatarUrl ?? undefined,
              date: t.createdAt
                ? new Date(t.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : "",
            })),
          );
        }
        if (ps.length) {
          setPartnerList(
            ps.map((p) => ({ id: p.id, name: p.name, logo: p.imageUrl, redirectUrl: p.redirectionUrl })),
          );
        }
      } catch (e) {
        console.error("Failed to load home content from API", e);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const [currentTestimonialIdx, setCurrentTestimonialIdx] = React.useState(0);

  // Auto-scroll logic
  React.useEffect(() => {
    if (testimonialList.length <= 1) return;

    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [testimonialList.length, currentTestimonialIdx]);

  const nextTestimonial = () => {
    setCurrentTestimonialIdx((prev) => (prev + 1) % testimonialList.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonialIdx(
      (prev) => (prev - 1 + testimonialList.length) % testimonialList.length,
    );
  };

  // Open the login/register modal — unless already signed in, in which case go straight there.
  const openAuth = (dest: string, intent?: string) => {
    if (user) {
      navigate(dest);
      return;
    }
    setPendingDest(dest);
    setAuthIntent(intent);
    setAuthOpen(true);
  };

  const handleConnect = () => openAuth("/dashboard");

  const showInvestors = () => {
    setIsMenuOpen(false);
    swal.info("Our investor relations page is coming soon. Stay tuned!", "Investors — Coming Soon");
  };

  // Live course suggestions, shown once the user has typed at least 2 characters.
  const searchSuggestions = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const starts = COURSE_SUGGESTIONS.filter((c) =>
      c.toLowerCase().startsWith(q),
    );
    const contains = COURSE_SUGGESTIONS.filter(
      (c) => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q),
    );
    return [...starts, ...contains].slice(0, 7);
  }, [searchQuery]);

  const goToSearch = (term: string) => {
    const q = term.trim();
    if (!q) return;
    setShowSuggestions(false);
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <ThemeScopeWrapper scope="home">
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95">
          <div className="container mx-auto px-4 h-20 flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <Logo imgClassName="h-14 md:h-16" />
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a
                href="#services"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Our Services
              </a>
              <a
                href="#about"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                About Us
              </a>
              <a
                href="#sop"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                SOP Generator
              </a>
              <a
                href="#universities"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Universities
              </a>
              <Link
                to="/blog"
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                Blog
              </Link>
              <button
                onClick={showInvestors}
                className="text-sm font-medium hover:text-primary transition-colors cursor-pointer"
              >
                Investors
              </button>

              <div className="w-px h-6 bg-border mx-2" />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
                className="rounded-full"
              >
                <Settings className="w-5 h-5" />
              </Button>

              <Button
                onClick={handleConnect}
                className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-300 px-6 rounded-full font-semibold"
              >
                Student Portal <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:hidden border-b bg-background p-4 space-y-4"
            >
              <a
                href="#services"
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-medium"
              >
                Our Services
              </a>
              <a
                href="#about"
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-medium"
              >
                About Us
              </a>
              <a
                href="#sop"
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-medium"
              >
                SOP Generator
              </a>
              <a
                href="#universities"
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-medium"
              >
                Universities
              </a>
              <Link
                to="/blog"
                onClick={() => setIsMenuOpen(false)}
                className="block text-lg font-medium"
              >
                Blog
              </Link>
              <button
                onClick={showInvestors}
                className="block w-full text-left text-lg font-medium"
              >
                Investors
              </button>
              <Button
                onClick={handleConnect}
                className="w-full rounded-full text-lg h-12"
              >
                Student Portal <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </nav>

        {/* Hero Section */}
        <section className="relative py-12 lg:py-20 overflow-hidden">
          {/* Dotted globe backdrop — oversized & faint so it reads as a full-bleed
              world map watermark (the lit rim falls off-screen). */}
          <HeroGlobe className="absolute left-1/2 top-1/2 -z-0 h-[560px] w-[560px] max-w-none -translate-x-1/2 -translate-y-1/2 opacity-40 md:h-[1600px] md:w-[1600px] md:opacity-50" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Globe className="w-4 h-4" />
                  <span>Empowering Students to Change the World</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
                  Your Global <span className="text-primary">Career Wise</span>{" "}
                  Consultancy
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg">
                  We provide comprehensive and personalized support to students
                  seeking to further their education and pursue their career
                  goals worldwide.
                </p>

                {/* Search Bar with live course suggestions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="relative max-w-xl group"
                >
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-focus-within:bg-primary/30 transition-all" />
                  <div className="relative flex items-center gap-3 py-2 pl-5 pr-2 bg-card border border-border shadow-2xl rounded-2xl">
                    <Search className="w-5 h-5 text-muted-foreground shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() =>
                        setTimeout(() => setShowSuggestions(false), 150)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") goToSearch(searchQuery);
                      }}
                      placeholder="Search for Artificial Intelligence, Business..."
                      aria-label="Search universities or courses"
                      autoComplete="off"
                      className="w-full bg-transparent border-none outline-none focus:ring-0 text-foreground placeholder:text-muted-foreground/60 h-12"
                    />
                  </div>

                  {/* Suggestions dropdown */}
                  <AnimatePresence>
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 right-0 top-full z-30 mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
                      >
                        {searchSuggestions.map((s) => (
                          <li
                            key={s}
                            className="border-b border-border/40 last:border-0"
                          >
                            <button
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => goToSearch(s)}
                              className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-primary/5"
                            >
                              <Search className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                              <span className="font-medium text-foreground">
                                {s}
                              </span>
                              <span className="ml-auto text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                Course
                              </span>
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>

                  {/* Empty/hint states */}
                  {showSuggestions &&
                    searchQuery.trim().length >= 2 &&
                    searchSuggestions.length === 0 && (
                      <div className="absolute left-0 right-0 top-full z-30 mt-3 rounded-2xl border border-border bg-card px-5 py-3 text-sm text-muted-foreground shadow-2xl">
                        No course matches — press{" "}
                        <span className="font-semibold text-foreground">
                          Enter
                        </span>{" "}
                        to search “{searchQuery.trim()}”.
                      </div>
                    )}
                </motion.div>

                <div className="flex items-center gap-6 pt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden"
                      >
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`}
                          alt="User"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">500+</span>{" "}
                    Students applied this year
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative mx-auto w-full max-w-md md:max-w-lg"
              >
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-card">
                  <img
                    src={heroImage}
                    alt="Students on a university campus"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating Cards */}
                <div className="absolute -top-6 -right-6 bg-card p-4 rounded-2xl shadow-xl z-20 flex items-center gap-3 border border-border animate-float">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Visa Success
                    </p>
                    <p className="font-bold">99.2% Rate</p>
                  </div>
                </div>
                <div
                  className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl z-20 flex items-center gap-3 border border-border animate-float"
                  style={{ animationDelay: "1.5s" }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Partners</p>
                    <p className="font-bold">150+ UK Unis</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 -skew-x-12 translate-x-1/4 -z-0" />
        </section>

        {/* Partners Marquee */}
        <section className="relative overflow-hidden border-y border-border/60 py-16 bg-gradient-to-b from-background via-accent/20 to-background">
          {/* Atmosphere: brand glow orbs + fine dot grid */}
          <div className="pointer-events-none absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-secondary/10 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, color-mix(in oklch, var(--primary) 14%, transparent) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage:
                "radial-gradient(ellipse 70% 60% at center, black, transparent)",
              WebkitMaskImage:
                "radial-gradient(ellipse 70% 60% at center, black, transparent)",
            }}
          />

          {/* Heading */}
          <Reveal className="relative container mx-auto px-4 mb-10">
            <div className="flex items-center justify-center gap-4">
              <span className="hidden sm:block h-px w-16 bg-gradient-to-r from-transparent to-border" />
              <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Our Trusted <span className="text-primary">Partners</span> &amp;
                Clients
              </p>
              <span className="hidden sm:block h-px w-16 bg-gradient-to-l from-transparent to-border" />
            </div>
          </Reveal>

          {/* Marquee with soft edge fades */}
          <div
            className="relative"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 7%, black 93%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 7%, black 93%, transparent)",
            }}
          >
            <div className="flex w-max items-center gap-6 py-2 animate-marquee hover:[animation-play-state:paused]">
              {/* Double the list for seamless loop */}
              {[...partnerList, ...partnerList].map((partner, i) => (
                <a
                  key={`${partner.id}-${i}`}
                  href={partner.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/card relative flex shrink-0 items-center gap-4 rounded-2xl border border-border/60 bg-card/70 px-6 py-4 shadow-[0_2px_12px_-6px_rgba(15,23,42,0.18)] backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:bg-card hover:shadow-[0_18px_40px_-12px_rgba(15,23,42,0.28)]"
                  title={`View ${partner.name} Certificate/Newsletter`}
                >
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-white dark:bg-white/90 p-3 ring-1 ring-border/70 transition-all duration-500 group-hover/card:scale-105 group-hover/card:ring-primary/40">
                    <img
                      src={partner.logo}
                      alt={partner.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col pr-2">
                    <span className="font-outfit text-lg font-bold leading-tight tracking-tight text-foreground/85 transition-colors duration-300 group-hover/card:text-primary">
                      {partner.name}
                    </span>
                    <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                      Verified Partner
                    </span>
                  </div>
                  {/* Hover arrow */}
                  <svg
                    className="h-4 w-4 -translate-x-1 text-primary opacity-0 transition-all duration-300 group-hover/card:translate-x-0 group-hover/card:opacity-100"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17 17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative overflow-hidden py-16 text-primary-foreground bg-gradient-to-br from-primary via-primary to-[oklch(0.38_0.15_255)]">
          {/* Atmosphere: soft glow + fine dot grid for depth */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, rgba(255,255,255,0.7) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
              maskImage:
                "radial-gradient(ellipse 80% 70% at center, black, transparent)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 70% at center, black, transparent)",
            }}
          />
          <div className="container relative mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 md:divide-x md:divide-white/15">
              {[
                { value: 15, suffix: "+", label: "Years Experience" },
                { value: 5000, suffix: "+", label: "Students Placed" },
                { value: 150, suffix: "+", label: "Partner Universities" },
                { value: 100, suffix: "%", label: "Free Guidance" },
              ].map((stat, idx) => (
                <Reveal
                  key={stat.label}
                  delay={idx * 0.1}
                  className="px-2 py-4 text-center md:px-8"
                >
                  <p className="font-outfit text-4xl sm:text-5xl font-bold tracking-tight">
                    <CountUp value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-2 text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/75">
                    {stat.label}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="relative py-16 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <Reveal className="text-center max-w-3xl mx-auto mb-14 space-y-5">
              <Eyebrow>What We Offer</Eyebrow>
              <h2 className="font-outfit text-4xl md:text-5xl font-bold tracking-tight">
                Discover Our Services
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We at Let's Fly Together Consultants are available to help you
                at every stage of your academic career. Our services are
                intended to help you make the best decisions for your future by
                offering individualised support and knowledgeable guidance.
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: GraduationCap,
                  title: "Study in UK",
                  desc: "Expert guidance on university selection and application process for top UK institutions.",
                },
                {
                  icon: Home,
                  title: "Student Accomodation",
                  desc: "Finding safe, comfortable, and affordable housing options tailored for international students.",
                },
                {
                  icon: Plane,
                  title: "Ticket Booking",
                  desc: "Hassle-free flight booking services tailored for student travel needs and budgets.",
                },
              ].map((service, idx) => (
                <Reveal key={idx} delay={(idx % 3) * 0.08}>
                  <Card className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card transition-[transform,border-color] duration-300 ease-out will-change-transform hover:-translate-y-2 hover:border-primary/40">
                    {/* Shadow as an opacity-only overlay → animates on the compositor (no paint) */}
                    <span className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 shadow-[0_30px_60px_-25px_rgba(15,23,42,0.45)]" />
                    {/* Soft hover wash for depth */}
                    <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-secondary/[0.05] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    {/* Oversized watermark icon in the corner (transform-only animation) */}
                    <service.icon className="pointer-events-none absolute -right-5 -top-5 h-28 w-28 text-primary/[0.06] transition-transform duration-500 ease-out group-hover:scale-110" />
                    {/* Top accent bar wipes in on hover */}
                    <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-secondary transition-transform duration-300 ease-out group-hover:scale-x-100" />
                    <CardContent className="relative p-6 sm:p-7 flex h-full flex-col">
                      <div className="flex items-start justify-between">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.38_0.15_255)] text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-rotate-3">
                          <service.icon className="h-7 w-7" />
                        </div>
                        <span className="font-outfit text-4xl font-bold leading-none text-foreground/[0.08]">
                          0{idx + 1}
                        </span>
                      </div>
                      <h3 className="mt-5 text-xl font-bold tracking-tight">{service.title}</h3>
                      <p className="mt-2 text-muted-foreground leading-relaxed">
                        {service.desc}
                      </p>
                      <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 -translate-x-1.5 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0">
                        Learn more
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* SOP Generator Section */}
        <section
          id="sop"
          className="relative overflow-hidden py-16 md:py-24"
        >
          {/* Atmosphere: soft brand glow orbs */}
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />
          <div className="container relative mx-auto px-4">
            <Reveal className="mx-auto mb-12 max-w-3xl space-y-5 text-center">
              <Eyebrow>AI-Powered Tool</Eyebrow>
              <h2 className="font-outfit text-4xl font-bold tracking-tight md:text-5xl">
                Craft Your <span className="text-primary">Statement of Purpose</span>
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Tell us a few details about you and your dream course — our AI drafts a
                tailored, professional SOP for free. Sign in only when you're ready to
                download it as a PDF or Word document.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <SopGenerator />
            </Reveal>
          </div>
        </section>

        {/* Why Choose Us */}
        <section id="about" className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <img
                    src="https://picsum.photos/seed/student1/400/500"
                    alt="Student"
                    className="rounded-2xl shadow-lg mt-8"
                  />
                  <img
                    src="https://picsum.photos/seed/student2/400/500"
                    alt="Student"
                    className="rounded-2xl shadow-lg"
                  />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground shadow-2xl border-8 border-card">
                  <span className="text-center font-bold leading-tight text-sm">
                    Empowering
                    <br />
                    Students
                  </span>
                </div>
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <Eyebrow>Why Us</Eyebrow>
                  <h2 className="font-outfit text-4xl md:text-5xl font-bold tracking-tight">
                    Why Choose Let's Fly Together?
                  </h2>
                </div>
                <p className="text-lg text-muted-foreground">
                  Our mission is to empower students to change the world. We
                  don't just help with applications; we build the foundation for
                  your global career.
                </p>
                <ul className="space-y-4">
                  {[
                    "Comprehensive and personalized support",
                    "Resources and advice for global education",
                    "Career-wise consultancy approach",
                    "Guidance for career goals and education",
                    "Meet our expert counsellors for personal sessions",
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={handleConnect}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                >
                  Meet Our Counsellors
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section — student testimonials along a curve */}
        <section className="py-16 md:py-24 bg-muted/30 overflow-hidden">
          <div className="container mx-auto px-4">
            <Reveal className="mb-12 space-y-3">
              <span className="block h-1 w-12 rounded-full bg-primary" />
              <h2 className="font-outfit text-3xl md:text-4xl font-bold tracking-tight">
                Student Testimonials
              </h2>
            </Reveal>

            {testimonialList.length > 0 && (
              <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
                {/* Reviewer rail — photos ride a curve; the centered (active) one
                    grows while the ones being passed shrink. */}
                <div className="lg:col-span-5">
                  <div className="relative mx-auto h-[400px] w-full max-w-[340px]">
                    {/* Curved guide line */}
                    <svg
                      viewBox="0 0 340 400"
                      preserveAspectRatio="none"
                      className="absolute inset-0 h-full w-full text-primary/50"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M 30 16 Q 152 200 30 384"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="2 9"
                        strokeLinecap="round"
                      />
                    </svg>

                    {/* Photos */}
                    {testimonialList.map((t, i) => {
                      const offset = i - currentTestimonialIdx;
                      const abs = Math.abs(offset);
                      const hidden = abs > 2;
                      const size = offset === 0 ? 108 : abs === 1 ? 62 : 46;
                      const x = 84 - offset * offset * 15; // parabola → active sits rightmost (curve bulges right)
                      const y = offset * 82;
                      const opacity = hidden ? 0 : offset === 0 ? 1 : abs === 1 ? 0.85 : 0.4;
                      return (
                        <motion.button
                          key={t.id}
                          type="button"
                          onClick={() => setCurrentTestimonialIdx(i)}
                          aria-label={`Show review from ${t.studentName}`}
                          aria-hidden={hidden}
                          className={cn(
                            "absolute left-0 top-1/2 overflow-hidden rounded-full bg-muted shadow-lg",
                            offset === 0
                              ? "ring-4 ring-primary/30 ring-offset-2 ring-offset-muted/30"
                              : "ring-2 ring-background",
                          )}
                          style={{ zIndex: 30 - abs, pointerEvents: hidden ? "none" : "auto" }}
                          initial={false}
                          animate={{ x, y, width: size, height: size, marginTop: -size / 2, marginLeft: -size / 2, opacity }}
                          transition={{ type: "spring", stiffness: 210, damping: 26 }}
                        >
                          <img
                            src={t.avatarUrl}
                            alt={t.studentName}
                            className="h-full w-full object-cover object-center"
                          />
                        </motion.button>
                      );
                    })}

                    {/* Active person's name / university / date, beside the big photo */}
                    <div className="pointer-events-none absolute left-[160px] top-1/2 -translate-y-1/2">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={testimonialList[currentTestimonialIdx].id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-xl font-bold tracking-tight">
                            {testimonialList[currentTestimonialIdx].studentName}
                          </p>
                          {testimonialList[currentTestimonialIdx].universityName && (
                            <p className="text-sm font-medium text-primary">
                              {testimonialList[currentTestimonialIdx].universityName}
                            </p>
                          )}
                          {testimonialList[currentTestimonialIdx].date && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {testimonialList[currentTestimonialIdx].date}
                            </p>
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </div>

                  </div>

                  {/* Prev / next — placed below the rail so they never overlap the photos */}
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Button size="icon" variant="outline" onClick={prevTestimonial} className="h-10 w-10 rounded-full" aria-label="Previous review">
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button size="icon" variant="outline" onClick={nextTestimonial} className="h-10 w-10 rounded-full" aria-label="Next review">
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Quote */}
                <div className="relative lg:col-span-7">
                  <Quote className="absolute -top-6 -left-1 h-14 w-14 text-primary/15" />
                  <AnimatePresence mode="wait">
                    <motion.blockquote
                      key={testimonialList[currentTestimonialIdx].id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.4 }}
                      className="relative"
                    >
                      <p className="font-serif text-xl italic leading-relaxed text-foreground/85 md:text-2xl md:leading-relaxed">
                        {testimonialList[currentTestimonialIdx].content}
                      </p>
                      <footer className="mt-6 text-sm font-medium text-muted-foreground">
                        — {testimonialList[currentTestimonialIdx].studentName}
                        {testimonialList[currentTestimonialIdx].universityName
                          ? `, ${testimonialList[currentTestimonialIdx].universityName}`
                          : ""}
                      </footer>
                    </motion.blockquote>
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 text-slate-300 py-16">
          {/* Top accent line + soft brand glow for depth */}
          <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="container relative mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-10 md:gap-12 mb-12">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Logo onDark imgClassName="h-12" />
                </div>
                <p className="text-sm leading-relaxed text-slate-400">
                  We aim to provide comprehensive and personalized support to
                  students seeking to further their education and pursue their
                  career goals worldwide.
                </p>
              </div>
              <div className="space-y-6">
                <h4 className="text-white font-bold text-sm uppercase tracking-[0.15em]">Quick Links</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a
                      href="#services"
                      className="hover:text-primary transition-colors"
                    >
                      Our Services
                    </a>
                  </li>
                  <li>
                    <button
                      onClick={handleConnect}
                      className="hover:text-primary transition-colors cursor-pointer text-left"
                    >
                      Student Portal
                    </button>
                  </li>
                  <li>
                    <Link
                      to="/agent-login"
                      className="hover:text-primary transition-colors"
                    >
                      Agent Portal
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/admin-login"
                      className="hover:text-primary transition-colors"
                    >
                      Admin Portal
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={showInvestors}
                      className="hover:text-primary transition-colors cursor-pointer text-left"
                    >
                      Investors
                    </button>
                  </li>
                  <li>
                    <a
                      href="#about"
                      className="hover:text-primary transition-colors"
                    >
                      About Us
                    </a>
                  </li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="text-white font-bold text-sm uppercase tracking-[0.15em]">Services</h4>
                <ul className="space-y-3 text-sm">
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Study in UK
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Accommodation
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Logistics
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-primary transition-colors"
                    >
                      Ticket Booking
                    </a>
                  </li>
                </ul>
              </div>
              <div className="space-y-6">
                <h4 className="text-white font-bold text-sm uppercase tracking-[0.15em]">Contact Us</h4>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary" />
                    +44 7700 900000
                  </li>
                  <li className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    info@letsflytogether.com
                  </li>
                  <li className="mt-4">
                    <Button
                      onClick={handleConnect}
                      className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full h-12 font-bold group"
                    >
                      Book Consultation
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </li>
                </ul>
              </div>
            </div>
            <div className="pt-8 border-t border-slate-800 text-center text-xs">
              <p>© 2024 Let's Fly Together. All rights reserved.</p>
            </div>
          </div>
        </footer>
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          scope="home"
        />
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            setAuthOpen(false);
            navigate(pendingDest);
          }}
          intent={authIntent}
        />
      </div>
    </ThemeScopeWrapper>
  );
}
