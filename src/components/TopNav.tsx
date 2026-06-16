
import React from 'react';
import { Bell, Search, User, LogOut, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from './Sidebar';
import { ThemeScopeWrapper } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { api, type AppNotification } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export function TopNav({ onSettingsClick }: { onSettingsClick?: () => void }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = React.useState<string>('');
  const [notifications, setNotifications] = React.useState<AppNotification[]>([]);

  React.useEffect(() => {
    if (role !== 'student') return;
    let active = true;
    api.students
      .me()
      .then((p) => { if (active && p.firstName) setFirstName(p.firstName); })
      .catch(() => {});
    return () => { active = false; };
  }, [role]);

  React.useEffect(() => {
    if (!role) return;
    let active = true;
    const refresh = () => api.notifications.list().then((n) => { if (active) setNotifications(n); }).catch(() => {});
    refresh();
    // Poll every 20s while tab is visible.
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 20000);
    // Instant refresh when another part of the app signals new activity.
    const onRefreshEvent = () => refresh();
    window.addEventListener('notifications:refresh', onRefreshEvent);
    return () => {
      active = false;
      clearInterval(interval);
      window.removeEventListener('notifications:refresh', onRefreshEvent);
    };
  }, [role]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await api.notifications.markAllRead(); } catch { /* will reconcile on next poll */ }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.displayName || 'User';
  const displayEmail = user?.email || '';
  const photoURL = user?.photoURL || '';
  const displayFirst = firstName || displayName.split(' ')[0] || 'User';
  const userInitials = (firstName || displayName).split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <Sheet>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          } />
          <SheetContent side="left" className="p-0 w-64 border-none">
            <ThemeScopeWrapper scope={role === 'admin' ? 'admin' : 'student'} className="min-h-0 h-full">
              <Sidebar className="border-none" onSettingsClick={onSettingsClick} />
            </ThemeScopeWrapper>
          </SheetContent>
        </Sheet>
        
        <div className="relative w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search universities, courses..." 
            className="pl-10 bg-muted/50 border-none focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" size="icon-lg" className="relative overflow-visible">
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 z-10 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-destructive text-[9px] font-bold leading-none text-white ring-2 ring-background">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          } />
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center justify-between gap-2">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
                    Mark all read
                  </button>
                )}
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <DropdownMenuGroup>
                  {notifications.map((n) => (
                    <DropdownMenuItem
                      key={n.id}
                      className={cn('flex items-start gap-3 p-4 cursor-pointer', !n.read && 'bg-primary/5')}
                      onClick={() => {
                        const isAccomm = n.title.toLowerCase().includes('accommodation');
                        if (role === 'admin') {
                          navigate(isAccomm
                            ? '/dashboard/admin/accommodations?tab=bookings&highlight=true'
                            : '/dashboard/admin');
                        } else {
                          navigate(isAccomm ? '/dashboard/accommodation' : '/dashboard/applications');
                        }
                      }}
                    >
                      <div className={cn(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                        !n.read ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                      )}>
                        <Bell className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="font-semibold text-sm flex items-center gap-1.5">
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                            {n.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="justify-center text-primary font-medium" onClick={() => navigate(role === 'admin' ? '/dashboard/admin' : '/dashboard/applications')}>
                {role === 'admin' ? 'Go to dashboard' : 'View all applications'}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={
            <Button variant="ghost" className="h-auto gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-colors hover:bg-muted">
              <Avatar className="w-8 h-8">
                <AvatarImage src={photoURL} />
                <AvatarFallback>{userInitials}</AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium leading-none">{displayFirst}</p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{role || 'Student'}</p>
              </div>
            </Button>
          } />
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{displayName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={onSettingsClick}>Settings</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
