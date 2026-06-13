import React from "react";
import { motion } from "motion/react";
import {
  GraduationCap,
  Globe,
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  Plane,
  Home,
  CreditCard,
  Phone,
  FileCheck,
  Truck,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Quote,
  Video,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { ThemeScopeWrapper } from "@/lib/ThemeContext";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Logo } from "@/components/Logo";
import { AuthModal } from "@/components/AuthModal";
import { Moon, Sun, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockTestimonials, mockHomePartners } from "@/mockData";
import { Testimonial, HomePartner } from "@/types";
import { api } from "@/lib/api";
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

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loginAsAgentDummy } = useAuth();
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
              date: "",
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
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
                className="relative"
              >
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-card">
                  <img
                    src="https://picsum.photos/seed/uk-uni/800/600"
                    alt="Study in UK"
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
          <div className="relative container mx-auto px-4 mb-10">
            <div className="flex items-center justify-center gap-4">
              <span className="hidden sm:block h-px w-16 bg-gradient-to-r from-transparent to-border" />
              <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Our Trusted <span className="text-primary">Partners</span> &amp;
                Clients
              </p>
              <span className="hidden sm:block h-px w-16 bg-gradient-to-l from-transparent to-border" />
            </div>
          </div>

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
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-white p-3 ring-1 ring-border/70 transition-all duration-500 group-hover/card:scale-105 group-hover/card:ring-primary/40">
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
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <p className="text-4xl font-bold">15+</p>
                <p className="text-sm opacity-80 uppercase tracking-widest">
                  Years Experience
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold">5000+</p>
                <p className="text-sm opacity-80 uppercase tracking-widest">
                  Students Placed
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold">150+</p>
                <p className="text-sm opacity-80 uppercase tracking-widest">
                  Partner Universities
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold">100%</p>
                <p className="text-sm opacity-80 uppercase tracking-widest">
                  Free Guidance
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-5">
              <h2 className="text-5xl font-bold tracking-tight">
                Discover Our Services
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We at Let's Fly Together Consultants are available to help you
                at every stage of your academic career. Our services are
                intended to help you make the best decisions for your future by
                offering individualised support and knowledgeable guidance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  icon: FileCheck,
                  title: "Document-Checklist",
                  desc: "Comprehensive assistance in preparing and verifying all necessary documents for admission and visa.",
                },
                {
                  icon: CreditCard,
                  title: "Online Payment",
                  desc: "Secure and easy-to-use platform for managing university deposits and service fees.",
                },
                {
                  icon: Truck,
                  title: "RoyalRahi Global Logistics",
                  desc: "Reliable logistics support for moving your belongings to your new study destination safely.",
                },
                {
                  icon: Plane,
                  title: "Ticket Booking",
                  desc: "Hassle-free flight booking services tailored for student travel needs and budgets.",
                },
              ].map((service, idx) => (
                <Card
                  key={idx}
                  className="border-none shadow-sm hover:shadow-xl transition-all duration-300 group bg-card"
                >
                  <CardContent className="p-8 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      <service.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-bold">{service.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {service.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                <h2 className="text-4xl font-bold tracking-tight">
                  Why Choose Let's Fly Together?
                </h2>
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
                  className="px-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
                >
                  Meet Our Counsellors
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-20 bg-primary/5 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Quote className="w-4 h-4" />
                  <span>Student Success Stories</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Voices of Inspiration
                </h2>
              </div>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prevTestimonial}
                  className="rounded-full h-12 w-12 border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={nextTestimonial}
                  className="rounded-full h-12 w-12 border-primary/20 hover:bg-primary/5 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </div>

            <div className="relative">
              <AnimatePresence mode="wait">
                {testimonialList.length > 0 && (
                  <motion.div
                    key={testimonialList[currentTestimonialIdx].id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.5 }}
                    className="grid lg:grid-cols-2 gap-12 items-center"
                  >
                    <div className="order-2 lg:order-1 space-y-6">
                      <Quote className="w-16 h-16 text-primary/10 -mb-4 -ml-4" />
                      <p className="text-2xl md:text-3xl font-medium leading-relaxed italic text-foreground/90">
                        "{testimonialList[currentTestimonialIdx].content}"
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-primary overflow-hidden shadow-lg">
                          <img
                            src={
                              testimonialList[currentTestimonialIdx].avatarUrl
                            }
                            alt={
                              testimonialList[currentTestimonialIdx].studentName
                            }
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xl font-bold">
                            {testimonialList[currentTestimonialIdx].studentName}
                          </span>
                          <span className="text-muted-foreground">
                            {
                              testimonialList[currentTestimonialIdx]
                                .universityName
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="order-1 lg:order-2 relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border-4 border-background group">
                      {testimonialList[currentTestimonialIdx].mediaType ===
                      "image" ? (
                        <img
                          src={testimonialList[currentTestimonialIdx].mediaUrl}
                          alt="Student success"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                          <Video className="w-16 h-16 text-white/50" />
                          <p className="absolute bottom-4 left-4 text-white p-2 rounded-lg bg-black/50 text-xs flex items-center gap-2">
                            <Video className="w-3 h-3" /> Video Testimonial
                          </p>
                          {/* In a real app, use a video player here */}
                          <iframe
                            className="w-full h-full"
                            src={testimonialList[
                              currentTestimonialIdx
                            ].mediaUrl.replace("watch?v=", "embed/")}
                            title="Video testimony"
                            allowFullScreen
                          ></iframe>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Indicators */}
              <div className="flex gap-2 mt-10 justify-center lg:justify-start">
                {testimonialList.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentTestimonialIdx(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      currentTestimonialIdx === i
                        ? "w-8 bg-primary"
                        : "w-2 bg-primary/20",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-300 py-14">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Logo onDark imgClassName="h-12" />
                </div>
                <p className="text-sm leading-relaxed">
                  We aim to provide comprehensive and personalized support to
                  students seeking to further their education and pursue their
                  career goals worldwide.
                </p>
              </div>
              <div className="space-y-6">
                <h4 className="text-white font-bold">Quick Links</h4>
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
                    <button
                      onClick={async () => {
                        try {
                          await loginAsAgentDummy();
                          navigate("/dashboard/agent");
                        } catch (e) {
                          console.error("Agent login failed", e);
                        }
                      }}
                      className="hover:text-amber-500 transition-colors cursor-pointer text-left"
                    >
                      Agent Portal
                    </button>
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
                <h4 className="text-white font-bold">Services</h4>
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
                <h4 className="text-white font-bold">Contact Us</h4>
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
