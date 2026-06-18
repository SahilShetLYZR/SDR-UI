import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Compass, Mail, Menu, Send, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import { useSidebarStore } from '@/store/sidebarStore';
import { cn } from '@/lib/utils';
import AvatarButton from "@/components/layout/AvatarButton.tsx";
import { Path } from '@/lib/types';
import { useAdmin } from '@/hooks/useAdmin';

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
        "relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40",
        active
          ? "bg-[#F1EBFF] text-[#8B5CF6]"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-[#8B5CF6]" />
      )}
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

const BrandLockup: React.FC = () => (
  <div className="flex min-w-0 items-center gap-2.5">
    <img alt="Jazon logo" src="/Lyzr-Logo.svg" className="h-9 w-9 shrink-0" />
    <span className="flex min-w-0 flex-col">
      <span className="brand-wordmark whitespace-nowrap text-lg font-medium leading-normal tracking-tight text-zinc-900">
        Jazon
      </span>
      <span className="truncate text-[9px] font-medium uppercase tracking-[0.22em] text-zinc-400">
        AI SDR by Lyzr
      </span>
    </span>
  </div>
);

const Sidebar: React.FC = () => {
  const { toggleSidebar } = useSidebarStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const isSidebarOpen = isHovered || isDropdownOpen;

  const navItems = (isExpanded: boolean) => (
    <>
      <NavItem
        icon={<Compass className="h-5 w-5" strokeWidth={1.75} />}
        label="Home"
        to="/"
        active={location.pathname === '/'}
        isExpanded={isExpanded}
      />
      <NavItem
        icon={<Send className="h-5 w-5" strokeWidth={1.75} />}
        label="Campaigns"
        to="/campaign"
        active={
          location.search.includes('from=admin')
            ? false
            : location.pathname.includes('/campaign')
        }
        isExpanded={isExpanded}
      />
      <NavItem
        icon={<Mail className="h-5 w-5" strokeWidth={1.75} />}
        label="Templates"
        to={`/${Path.TEMPLATES}`}
        active={location.pathname.startsWith('/templates')}
        isExpanded={isExpanded}
      />
      <NavItem
        icon={<SlidersHorizontal className="h-5 w-5" strokeWidth={1.75} />}
        label="Settings"
        to={Path.DOMAIN_CONFIGS}
        active={location.pathname.startsWith('/settings')}
        isExpanded={isExpanded}
      />
      {!adminLoading && isAdmin && (
        <NavItem
          icon={<ShieldCheck className="h-5 w-5" strokeWidth={1.75} />}
          label="Admin Dashboard"
          to={`/${Path.ADMIN}`}
          active={
            location.pathname.startsWith(`/${Path.ADMIN}`) ||
            location.search.includes('from=admin')
          }
          isExpanded={isExpanded}
        />
      )}
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex h-14 shrink-0 items-center gap-1.5 border-b border-[#E9E9EF] bg-[#FAFAFC] px-3 md:hidden">
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setIsMobileOpen(true)}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <BrandLockup />
      </div>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-[#FAFAFC] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E9E9EF] p-4">
              <BrandLockup />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMobileOpen(false)}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <nav
              className="flex-1 space-y-1 overflow-y-auto px-2 py-4"
              onClick={() => setIsMobileOpen(false)}
            >
              {navItems(true)}
            </nav>
            <div className="mt-auto border-t border-[#E9E9EF] px-2 py-3">
              <AvatarButton isExpanded onDropdownOpenChange={() => {}} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop rail */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => !isDropdownOpen && setIsHovered(false)}
        className={cn(
          "relative hidden h-screen flex-col border-r border-[#E9E9EF] bg-[#FAFAFC] transition-all duration-300 ease-in-out md:flex",
          isSidebarOpen ? "w-[220px]" : "w-[70px]"
        )}
      >
        <div className="flex items-center p-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <img alt="Jazon logo" src="/Lyzr-Logo.svg" className="h-9 w-9 shrink-0" />
            {isSidebarOpen && (
              <span className="flex min-w-0 flex-col">
                <span className="brand-wordmark whitespace-nowrap text-lg font-medium leading-normal tracking-tight text-zinc-900">
                  Jazon
                </span>
                <span className="truncate text-[9px] font-medium uppercase tracking-[0.22em] text-zinc-400">
                  AI SDR by Lyzr
                </span>
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          className="absolute -right-3 top-1/2 z-20 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[#E9E9EF] bg-white text-zinc-500 shadow-sm transition-all hover:text-zinc-900"
          onClick={toggleSidebar}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <nav className="flex-1 space-y-1 px-2 py-4">{navItems(isSidebarOpen)}</nav>

        <div className="mt-auto border-t border-[#E9E9EF] px-2 py-3">
          <AvatarButton
            isExpanded={isSidebarOpen}
            onDropdownOpenChange={setIsDropdownOpen}
          />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
