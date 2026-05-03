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
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { logout } from '@/lib/firebase';

export function Sidebar({ className, onSettingsClick }: { className?: string, onSettingsClick?: () => void }) {
  const { role } = useAuth();
  const navigate = useNavigate();

  const studentNavItems = [
    { icon: LayoutDashboard, label: 'Explore', path: '/dashboard' },
    { icon: Layers, label: 'Services', path: '/dashboard/services' },
    { icon: FileText, label: 'My Progress', path: '/dashboard/applications' },
    { icon: UserCircle, label: 'Profile & Docs', path: '/dashboard/profile' },
  ];

  const adminNavItems = [
    { icon: ShieldCheck, label: 'Applications', path: '/dashboard/admin' },
    { icon: School, label: 'Universities', path: '/dashboard/admin/universities' },
    { icon: Home, label: 'Accommodations', path: '/dashboard/admin/accommodations' },
    { icon: Handshake, label: 'Partners', path: '/dashboard/admin/partners' },
  ];

  const filteredNavItems = role === 'admin' ? adminNavItems : studentNavItems;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <aside className={cn("w-64 border-r bg-card h-screen flex flex-col sticky top-0", className)}>
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
            end={item.path === '/dashboard' || item.path === '/dashboard/admin'}
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
