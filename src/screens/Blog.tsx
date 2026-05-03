
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  ArrowLeft, 
  Menu, 
  X, 
  Settings, 
  ArrowRight,
  Phone,
  Globe
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockBlogPosts } from '@/mockData';
import { BlogPost } from '@/types';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeScopeWrapper } from '@/lib/ThemeContext';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useAuth } from '@/lib/AuthContext';

export default function Blog() {
  const navigate = useNavigate();
  const { loginAsDummy } = useAuth();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('blog_posts');
    setBlogs(saved ? JSON.parse(saved) : mockBlogPosts);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [selectedBlog]);

  const handleConnect = () => {
    if (loginAsDummy) {
      loginAsDummy();
      navigate('/dashboard');
    }
  };

  const Navigation = () => (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl">
            F
          </div>
          <span className="font-bold text-xl md:text-2xl tracking-tight text-primary">Let's Fly Together</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">Home</Link>
          <Link to="/#services" className="text-sm font-medium hover:text-primary transition-colors">Our Services</Link>
          <Link to="/#about" className="text-sm font-medium hover:text-primary transition-colors">About Us</Link>
          <Link to="/blog" className="text-sm font-medium text-primary font-bold">Blog</Link>
          
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
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden border-b bg-background p-4 space-y-4"
        >
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium">Home</Link>
          <Link to="/#services" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium">Our Services</Link>
          <Link to="/#about" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium">About Us</Link>
          <Link to="/blog" onClick={() => setIsMenuOpen(false)} className="block text-lg font-medium text-primary">Blog</Link>
          <Button onClick={handleConnect} className="w-full rounded-full text-lg h-12">
            Student Portal <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </nav>
  );

  const Footer = () => (
    <footer className="bg-slate-900 text-slate-300 py-20 mt-24">
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
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/#services" className="hover:text-primary transition-colors">Our Services</Link></li>
              <li><Link to="/#about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
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
  );

  return (
    <ThemeScopeWrapper scope="home">
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />

        <main className="container mx-auto px-4 py-12 md:py-20 lg:py-24">
          {selectedBlog ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <Button 
                variant="ghost" 
                onClick={() => setSelectedBlog(null)} 
                className="mb-4 gap-2 hover:bg-primary/10 rounded-full"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Blogs
              </Button>

              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider">
                    {selectedBlog.category}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4" /> {selectedBlog.date}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4" /> {selectedBlog.readTime}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  {selectedBlog.title}
                </h1>

                <div className="flex items-center gap-4 pb-8 border-b">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl border-2 border-primary/20">
                    {selectedBlog.author[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-lg">{selectedBlog.author}</span>
                    <span className="text-sm text-muted-foreground">Expert Contributor</span>
                  </div>
                </div>
              </div>

              <div className="aspect-[21/9] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-card">
                <img src={selectedBlog.coverImage} alt={selectedBlog.title} className="w-full h-full object-cover" />
              </div>

              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap leading-relaxed text-foreground/80 md:text-xl">
                  {selectedBlog.content}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-16">
              <div className="text-center max-w-3xl mx-auto space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                   <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-4">
                     Insightful Stories
                   </span>
                   <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">Our Blog</h1>
                </motion.div>
                <p className="text-muted-foreground text-xl leading-relaxed">
                  Deep dives into university life, guidance for foreign education, and success stories from our global community.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {blogs.map((blog, idx) => (
                  <motion.div
                    key={blog.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card 
                      className="group h-full overflow-hidden border-none shadow-md hover:shadow-2xl transition-all duration-500 bg-card cursor-pointer rounded-[2rem]"
                      onClick={() => setSelectedBlog(blog)}
                    >
                      <div className="aspect-video overflow-hidden">
                        <img 
                          src={blog.coverImage} 
                          alt={blog.title} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      </div>
                      <CardContent className="p-8 space-y-6">
                        <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                          <span className="text-primary px-3 py-1 bg-primary/5 rounded-full">{blog.category}</span>
                          <span>{blog.date}</span>
                        </div>
                        <h3 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors line-clamp-2">
                          {blog.title}
                        </h3>
                        <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                          {blog.excerpt}
                        </p>
                        <div className="pt-4 flex items-center gap-2 text-primary font-bold group-hover:gap-4 transition-all">
                          Read Full Article <ArrowRight className="w-4 h-4" />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </main>

        <Footer />
        <SettingsDialog 
          open={settingsOpen} 
          onOpenChange={setSettingsOpen} 
          scope="home" 
        />
      </div>
    </ThemeScopeWrapper>
  );
}

