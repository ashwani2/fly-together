import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCircle, 
  GraduationCap, 
  ShoppingBag, 
  Home, 
  FileText, 
  Settings, 
  LogOut,
  ShieldCheck,
  School,
  Handshake,
  Layers,
  Banknote,
  MessageSquare,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/lib/AuthContext';

export function Sidebar({ className, onSettingsClick }: { className?: string, onSettingsClick?: () => void }) {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const studentNavItems = [
    { icon: LayoutDashboard, label: 'Explore', path: '/dashboard' },
    { icon: Layers, label: 'Services', path: '/dashboard/services' },
    { icon: FileText, label: 'My Applications', path: '/dashboard/applications' },
    { icon: UserCircle, label: 'Profile & Docs', path: '/dashboard/profile' },
  ];

  const adminSections = [
    {
      title: 'Main',
      items: [
        { icon: ShieldCheck, label: 'Applications', path: '/dashboard/admin' },
        { icon: Users, label: 'Agent Network', path: '/dashboard/admin/agents' },
      ]
    },
    {
      title: 'Services',
      items: [
        { icon: Home, label: 'Accommodations', path: '/dashboard/admin/accommodations' },
        { icon: Handshake, label: 'Partners', path: '/dashboard/admin/partners' },
        { icon: Banknote, label: 'Loan Apps', path: '/dashboard/admin/loans' },
      ]
    },
    {
      title: 'Configure Home Page',
      items: [
        { icon: MessageSquare, label: 'Testimonials', path: '/dashboard/admin/testimonials' },
        { icon: FileText, label: 'Blogs', path: '/dashboard/admin/blogs' },
        { icon: Handshake, label: 'Home Partners', path: '/dashboard/admin/home-partners' },
      ]
    }
  ];

  const agentNavItems = [
    { icon: LayoutDashboard, label: 'My Students', path: '/dashboard/agent' },
    { icon: ShieldCheck, label: 'Verifications', path: '/dashboard/agent/verifications' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className={cn("w-64 border-r bg-card h-screen flex flex-col sticky top-0", className)}>
      <Link to="/" className="p-5 flex items-center hover:opacity-80 transition-opacity">
        <Logo imgClassName="h-14 md:h-16" />
      </Link>
      
      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
        {role === 'admin' ? (
          <div className="space-y-6">
            {adminSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                  {section.title}
                </p>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/dashboard/admin'}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-sm" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          (role === 'agent' ? agentNavItems : studentNavItems).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard' || item.path === '/dashboard/agent'}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))
        )}
      </nav>

      <div className="p-4 border-t space-y-1">
        <button 
          onClick={onSettingsClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full transition-colors"
        >
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
