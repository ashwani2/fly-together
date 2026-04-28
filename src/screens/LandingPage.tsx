
import React from 'react';
import { motion } from 'motion/react';
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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ThemeScopeWrapper } from '@/lib/ThemeContext';
import { SettingsDialog } from '@/components/SettingsDialog';
import { Moon, Sun, Settings } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { loginAsDummy } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  const handleConnect = () => {
    if (loginAsDummy) {
      loginAsDummy();
      navigate('/dashboard');
    }
  };

  return (
    <ThemeScopeWrapper scope="home">
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl">
                F
              </div>
              <span className="font-bold text-xl md:text-2xl tracking-tight text-primary">Let's Fly Together</span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <a href="#services" className="text-sm font-medium hover:text-primary transition-colors">Our Services</a>
              <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">About Us</a>
              <a href="#universities" className="text-sm font-medium hover:text-primary transition-colors">Universities</a>
              
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
                Connect <ArrowRight className="ml-2 w-4 h-4" />
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
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            <a href="#services" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium">Our Services</a>
            <a href="#about" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium">About Us</a>
            <a href="#universities" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium">Universities</a>
            <Button onClick={handleConnect} className="w-full rounded-full">
              Connect <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Globe className="w-4 h-4" />
                <span>Empowering Students to Change the World</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tight leading-tight">
                Your Global <span className="text-primary">Career Wise</span> Consultancy
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                We provide comprehensive and personalized support to students seeking to further their education and pursue their career goals worldwide.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleConnect}
                  size="lg" 
                  className="h-14 px-10 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 rounded-full group"
                >
                  Inquire Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  onClick={handleConnect}
                  size="lg" 
                  variant="outline" 
                  className="h-14 px-10 text-lg font-bold rounded-full hover:bg-primary/5 transition-all duration-300"
                >
                  Book Counselling
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-bold text-foreground">500+</span> Students applied this year
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
              <div className="absolute -top-6 -right-6 bg-card p-4 rounded-2xl shadow-xl z-20 flex items-center gap-3 border border-border animate-bounce-slow">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visa Success</p>
                  <p className="font-bold">99.2% Rate</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-xl z-20 flex items-center gap-3 border border-border animate-pulse-slow">
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

      {/* Stats Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-bold">15+</p>
              <p className="text-sm opacity-80 uppercase tracking-widest">Years Experience</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold">5000+</p>
              <p className="text-sm opacity-80 uppercase tracking-widest">Students Placed</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold">150+</p>
              <p className="text-sm opacity-80 uppercase tracking-widest">Partner Universities</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold">100%</p>
              <p className="text-sm opacity-80 uppercase tracking-widest">Free Guidance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
            <h2 className="text-5xl font-bold tracking-tight">Discover Our Services</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              We at Let's Fly Together Consultants are available to help you at every stage of your academic career. 
              Our services are intended to help you make the best decisions for your future by offering 
              individualised support and knowledgeable guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: GraduationCap, 
                title: 'Study in UK', 
                desc: 'Expert guidance on university selection and application process for top UK institutions.' 
              },
              { 
                icon: Home, 
                title: 'Student Accomodation', 
                desc: 'Finding safe, comfortable, and affordable housing options tailored for international students.' 
              },
              { 
                icon: FileCheck, 
                title: 'Document-Checklist', 
                desc: 'Comprehensive assistance in preparing and verifying all necessary documents for admission and visa.' 
              },
              { 
                icon: CreditCard, 
                title: 'Online Payment', 
                desc: 'Secure and easy-to-use platform for managing university deposits and service fees.' 
              },
              { 
                icon: Truck, 
                title: 'RoyalRahi Global Logistics', 
                desc: 'Reliable logistics support for moving your belongings to your new study destination safely.' 
              },
              { 
                icon: Plane, 
                title: 'Ticket Booking', 
                desc: 'Hassle-free flight booking services tailored for student travel needs and budgets.' 
              },
            ].map((service, idx) => (
              <Card key={idx} className="border-none shadow-sm hover:shadow-xl transition-all duration-300 group bg-card">
                <CardContent className="p-10 space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <service.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-bold">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{service.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section id="about" className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <img src="https://picsum.photos/seed/student1/400/500" alt="Student" className="rounded-2xl shadow-lg mt-8" />
                <img src="https://picsum.photos/seed/student2/400/500" alt="Student" className="rounded-2xl shadow-lg" />
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground shadow-2xl border-8 border-card">
                <span className="text-center font-bold leading-tight text-sm">Empowering<br/>Students</span>
              </div>
            </div>
            <div className="space-y-8">
              <h2 className="text-4xl font-bold tracking-tight">Why Choose Let's Fly Together?</h2>
              <p className="text-lg text-muted-foreground">
                Our mission is to empower students to change the world. We don't just help with applications; we build the foundation for your global career.
              </p>
              <ul className="space-y-4">
                {[
                  'Comprehensive and personalized support',
                  'Resources and advice for global education',
                  'Career-wise consultancy approach',
                  'Guidance for career goals and education',
                  'Meet our expert counsellors for personal sessions'
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Button 
                onClick={handleConnect}
                size="lg" className="px-10 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-bold">
                Meet Our Counsellors
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
                  F
                </div>
                <span className="font-bold text-xl text-white">Let's Fly Together</span>
              </div>
              <p className="text-sm leading-relaxed">
                We aim to provide comprehensive and personalized support to students seeking to further their education and pursue their career goals worldwide.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="text-white font-bold">Quick Links</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Home</a></li>
                <li><a href="#services" className="hover:text-primary transition-colors">Our Services</a></li>
                <li><a href="#about" className="hover:text-primary transition-colors">About Us</a></li>
                 <li><button onClick={handleConnect} className="hover:text-primary transition-colors cursor-pointer text-left">Student Portal</button></li>
                <li><Link to="/admin-login" className="hover:text-primary transition-colors text-slate-500">Admin Portal</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-white font-bold">Services</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-primary transition-colors">Study in UK</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Accommodation</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Logistics</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Ticket Booking</a></li>
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
                    className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-full h-12 font-bold group">
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
    </div>
    </ThemeScopeWrapper>
  );
}
