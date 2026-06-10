import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, HomeIcon, Rocket, Settings } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebarStore';
import { cn } from '@/lib/utils';
import AvatarButton from "@/components/layout/AvatarButton.tsx";
import { Path } from '@/lib/types';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
  isExpanded: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, to, active, isExpanded }) => {
  return (
    <Link
      to={to}
      title={isExpanded ? undefined : label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active
          ? "bg-purple-100 text-purple-700"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      <span className="flex min-w-[20px] justify-center">{icon}</span>
      <span
        className={cn(
          "ml-3 overflow-hidden whitespace-nowrap transition-all",
          isExpanded ? "w-auto opacity-100" : "w-0 opacity-0"
        )}
      >
        {label}
      </span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const { toggleSidebar } = useSidebarStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();

  const isSidebarOpen = isHovered || isDropdownOpen;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isDropdownOpen && setIsHovered(false)}
      className={cn(
        "h-screen border-r flex flex-col bg-white relative transition-all duration-300 ease-in-out",
        isSidebarOpen ? "w-[220px]" : "w-[70px]"
      )}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <img alt="Jazon logo" src="/Lyzr-Logo.svg" width={35} />
          {isSidebarOpen && (
            <>
              <div className="mx-2 h-6 w-px bg-gray-200" />
              <span className="text-xl font-semibold tracking-tight text-gray-900">Jazon</span>
            </>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        className="sidebar-toggle-button cursor-pointer hover:bg-gray-50"
        onClick={toggleSidebar}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      <nav className="flex-1 space-y-1 px-2 py-4">
        <NavItem
          icon={<HomeIcon className="h-5 w-5" />}
          label="Home"
          to="/"
          active={location.pathname === '/'}
          isExpanded={isSidebarOpen}
        />
        <NavItem
          icon={<Rocket className="h-5 w-5" />}
          label="Campaigns"
          to="/campaign"
          active={location.pathname.includes('/campaign')}
          isExpanded={isSidebarOpen}
        />
        <NavItem
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          to={Path.DOMAIN_CONFIGS}
          active={location.pathname.startsWith('/settings')}
          isExpanded={isSidebarOpen}
        />
      </nav>

      <div className="mt-auto border-t px-2 py-3">
        <AvatarButton
          isExpanded={isSidebarOpen}
          onDropdownOpenChange={setIsDropdownOpen}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
