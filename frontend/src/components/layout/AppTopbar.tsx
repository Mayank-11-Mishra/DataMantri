import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { HelpCircle } from 'lucide-react';

const AppTopbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6 gap-4 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <span className="text-base font-semibold text-gray-800">DataMantri Dashboard</span>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2 h-9 text-[13px] font-medium">
          <HelpCircle className="h-[18px] w-[18px]" />
          <span className="hidden sm:inline">Help</span>
        </Button>
        
        {user && (
          <Button variant="ghost" size="sm" className="h-9 text-[13px] font-medium" onClick={logout}>
            Logout ({user.email})
          </Button>
        )}
      </div>
    </header>
  );
};

export default AppTopbar;