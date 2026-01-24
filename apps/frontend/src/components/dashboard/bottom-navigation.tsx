import { Home, ScanLine, MessageSquare } from "lucide-react";
import { Link, useMatches } from "@tanstack/react-router";
import { BottomNavigation } from "@repo/ui/components/bottom-navigation";
import type { BottomNavItem } from "@repo/ui/components/bottom-navigation";

export default function BottomNav() {
  const matches = useMatches();
  const pathname = matches[matches.length - 1]?.pathname;

  const navItems: BottomNavItem[] = [
    {
      label: "Home",
      icon: Home,
      path: "/dashboard/home",
    },
    {
      label: "Scan",
      icon: ScanLine,
      path: "/dashboard/scan",
      isFloating: true,
    },
    {
      label: "Assistant",
      icon: MessageSquare,
      path: "/dashboard/assistant",
    },
  ];

  return (
    <BottomNavigation
      items={navItems}
      currentPath={pathname}
      renderLink={(item, children, className) => (
        <Link
          to={item.path}
          className={className}
          // Optional: Force TanStack active props to be empty so our component handles styling
          activeProps={{ className: "" }}
        >
          {children}
        </Link>
      )}
    />
  );
}
