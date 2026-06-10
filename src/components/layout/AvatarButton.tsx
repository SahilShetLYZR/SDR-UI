import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import React from "react";

interface AvatarButtonProps {
  avatar?: string;
  isExpanded: boolean;
  onDropdownOpenChange: (isOpen: boolean) => void;
}

const AvatarButton: React.FC<AvatarButtonProps> = ({ avatar, isExpanded, onDropdownOpenChange }) => {
  const { user, logout } = useAuth();
  const email = user?.email ?? "";
  const initial = email.charAt(0).toUpperCase();

  return (
    <DropdownMenu onOpenChange={onDropdownOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="flex w-full cursor-pointer items-center justify-between rounded-lg p-2 transition-colors duration-150 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-purple-100">
              {avatar ? (
                <img src={avatar} alt={email} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-purple-600">{initial}</span>
              )}
            </span>
            {isExpanded && (
              <span className="truncate text-sm font-medium text-gray-800" title={email}>
                {email}
              </span>
            )}
          </span>
          {isExpanded && <ChevronsUpDown className="size-3 shrink-0 opacity-50" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end" sideOffset={8} className="w-48 p-1">
        <DropdownMenuItem
          onClick={logout}
          className="flex items-center space-x-2 py-2 text-red-500 focus:text-red-500"
        >
          <LogOut className="size-4" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AvatarButton;
