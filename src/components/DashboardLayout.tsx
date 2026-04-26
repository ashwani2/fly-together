
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { SettingsDialog } from './SettingsDialog';
import { ThemeScopeWrapper } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';

export function DashboardLayout() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { role } = useAuth();
  const scope = role === 'admin' ? 'admin' : 'student';

  return (
    <ThemeScopeWrapper scope={scope}>
      <div className="flex min-h-screen">
        <div className="hidden lg:block border-r bg-card">
          <Sidebar onSettingsClick={() => setSettingsOpen(true)} />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav onSettingsClick={() => setSettingsOpen(true)} />
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
        <SettingsDialog 
          open={settingsOpen} 
          onOpenChange={setSettingsOpen} 
          scope={scope}
        />
      </div>
    </ThemeScopeWrapper>
  );
}
