"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Badge } from "@repo/ui/components/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import { Bell, ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { SidebarMenuButton, useSidebar } from "@repo/ui/components/sidebar";
import { useNotifications } from "@/hooks/use-notifications";
import { Link } from "@tanstack/react-router";
import { ModeToggle } from "../theme-toggle";

interface UserInfo {
  name: string;
  email: string;
  avatar: string | null | undefined;
}

interface ProfileComponentProps {
  userInfo: UserInfo;
  handleLogout: () => void;
}

export const ProfileComponent = ({
  userInfo,
  handleLogout,
}: ProfileComponentProps) => {
  const { isMobile } = useSidebar();
  const { unreadCount } = useNotifications();

  // Fallback if userInfo is missing (though it should be passed)
  const user = {
    name: userInfo?.name || "User",
    email: userInfo?.email || "",
    avatar: userInfo?.avatar || "",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-all duration-200"
        >
          <div className="relative">
            <Avatar className="h-8 w-8 rounded-full border border-border/50">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                {user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border border-background"></span>
              </span>
            )}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden overflow-hidden">
            <span className="truncate font-semibold text-foreground">
              {user.name}
            </span>
            <span className="truncate text-xs text-muted-foreground italic">
              {user.email}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground group-data-[collapsible=icon]:hidden opacity-50" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side={isMobile ? "bottom" : "right"}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">CN</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link to="/dashboard/settings/account">
            <DropdownMenuItem>
              <Settings className=" h-4 w-4" />
              Settings
            </DropdownMenuItem>
          </Link>
          <Link to="/dashboard/settings/notification">
            <DropdownMenuItem className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </div>
              {unreadCount > 0 && (
                <Badge
                  variant="default"
                  className="h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold"
                >
                  {unreadCount}
                </Badge>
              )}
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="h-10 -ml-2">
          <ModeToggle reverse={true} />
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogout}
          className="focus:bg-red-500 focus:text-white text-red-500"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
