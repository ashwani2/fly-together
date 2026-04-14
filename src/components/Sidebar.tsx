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
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['student', 'admin'] },
    { icon: UserCircle, label: 'Profile & Docs', path: '/dashboard/profile', roles: ['student', 'admin'] },
    { icon: Home, label: 'Accommodation', path: '/dashboard/accommodation', roles: ['student', 'admin'] },
    { icon: FileText, label: 'Applications', path: '/dashboard/applications', roles: ['student', 'admin'] },
    // Admin only items
    { icon: GraduationCap, label: 'Universities', path: '/dashboard/universities', roles: ['admin'] },
    { icon: ShoppingBag, label: 'Marketplace', path: '/dashboard/marketplace', roles: ['admin'] },
    { icon: ShieldCheck, label: 'Admin Panel', path: '/dashboard/admin', roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes('admin') || item.roles.includes('student'));

  const handleLogout = async () => {
    navigate('/');
  };

  return (
    <aside className="w-64 border-r bg-card h-screen flex flex-col sticky top-0">
      <Link to="/" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl">
          F
        </div>
        <span className="font-bold text-xl tracking-tight">Fly Together</span>
      </Link>
      
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
        ))}
      </nav>

      <div className="p-4 border-t space-y-1">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full transition-colors">
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
