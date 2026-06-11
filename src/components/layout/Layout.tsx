
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSidebarStore } from '@/store/sidebarStore';
import { cn } from '@/lib/utils';

const Layout: React.FC = () => {
  const { isExpanded } = useSidebarStore();
  
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden md:flex-row">
      <Sidebar />
      <main className={cn(
        "flex-1 overflow-auto bg-zinc-50/60 transition-all duration-300",
        isExpanded ? "md:w-[calc(100%-220px)]" : "md:w-[calc(100%-60px)]"
      )}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
