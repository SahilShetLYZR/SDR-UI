import React, {useState} from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, HomeIcon, Rocket, Settings, Shield } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebarStore';
import { cn } from '@/lib/utils';
import AvatarButton from "@/components/layout/AvatarButton.tsx";
import { Path } from '@/lib/types';
import { useAdmin } from '@/hooks/useAdmin';

interface UserProps {
  name: string;
  avatar?: string;
}

const User: React.FC<UserProps> = ({ name, avatar }) => {
  const { isExpanded } = useSidebarStore();
  
  return (
    <div className="flex items-center gap-2 p-4">
      <div className="shrink-0 h-8 w-8 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center">
        {avatar ? (
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-purple-600 font-semibold text-sm">{name.charAt(0)}</span>
        )}
      </div>
      {isExpanded && (
        <span className="font-semibold text-gray-800 truncate transition-all duration-300 text-sm">{name}</span>
      )}
    </div>
  );
};

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
      className={cn(
        "flex items-center px-3 py-2 rounded-md text-sm font-medium",
        active ? "bg-purple-100 text-purple-600" : "hover:bg-gray-50",
      )}
    >
      <span className="min-w-[20px] flex justify-center">{icon}</span>
      <span
        className={cn(
          "ml-3 overflow-hidden whitespace-nowrap transition-all",
          isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
        )}
      >
        {label}
      </span>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const { isExpanded, toggleSidebar } = useSidebarStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, loading: adminLoading } = useAdmin();

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
          <img alt="jazon picture" src="/Lyzr-Logo.svg" width={35} />
          {isSidebarOpen && (
            <>
              <div className="mx-2 h-6 w-px bg-gray-200" />
              <span className="text-2xl font-medium font-arial">Jazon</span>
            </>
          )}
        </div>
      </div>

      <div className="sidebar-toggle-button cursor-pointer" onClick={toggleSidebar}>
        {isSidebarOpen ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavItem
          icon={<HomeIcon className="h-5 w-5" />}
          label="Home"
          to="/"
          active={location.pathname === '/'}
          isExpanded={isSidebarOpen}
        />
        <NavItem
          icon={<Rocket className="h-5 w-5" />}
          label="Campaign"
          to="/campaign"
          active={
            location.search.includes('from=admin')
              ? false
              : location.pathname.includes('/campaign')
          }
          isExpanded={isSidebarOpen}
        />
        <NavItem
          icon={<Settings className="h-5 w-5" />}
          label="Settings"
          to={Path.DOMAIN_CONFIGS}
          active={location.pathname.startsWith('/settings')}
          isExpanded={isSidebarOpen}
        />
        {!adminLoading && isAdmin && (
          <NavItem
            icon={<Shield className="h-5 w-5" />}
            label="Dashboard"
            to={`/${Path.ADMIN}`}
            active={
              location.pathname.startsWith(`/${Path.ADMIN}`) ||
              location.search.includes('from=admin')
            }
            isExpanded={isSidebarOpen}
          />
        )}
      </nav>

      <div className="mt-auto px-2 py-4">
        <AvatarButton
          name="Peter Parker"
          isExpanded={isSidebarOpen}
          onDropdownOpenChange={setIsDropdownOpen}
        />
      </div>
    </aside>
  );
};

export default Sidebar;
