import { Link } from "@tanstack/react-router";
import { Topbar } from "@repo/ui/components/topbar";
import { Button } from "@repo/ui/components/button";
import { Bell, Settings } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";

export function MobileTopbar() {
  const { unreadCount } = useNotifications();

  return (
    <Topbar
      className="border-b bg-background/80 backdrop-blur-md"
      leftContent={
        <Link to="/dashboard">
          <div className="flex items-center gap-2">
            <img src="/favicon/favicon.svg" alt="Logo" className="w-8 h-8" />
            <span className="font-brand font-bold text-2xl tracking-tight">
              Cropia
            </span>
          </div>
        </Link>
      }
      rightContent={
        <div className="flex items-center gap-1">
          <Link to="/dashboard/settings/notification">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full relative"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white border-2 border-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
            <Link to="/dashboard/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      }
    />
  );
}
