import { useNavigate, useLocation } from "@tanstack/react-router";
import { BottomNavigation } from "@repo/ui/components/ui/bottom-navigation";
import { LayoutDashboard, SquarePlus, Database, List } from "lucide-react";

export function AppBottomNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="md:hidden">
      <BottomNavigation
        currentPath={location.pathname}
        onNavigate={(path) => navigate({ to: path as any })}
        items={[
          {
            label: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
          },
          {
            label: "Create",
            path: "/dashboard/create-tweet",
            icon: SquarePlus,
          },
          {
            label: "Import",
            path: "/dashboard/import-tweet",
            icon: Database,
          },
          {
            label: "Manage",
            path: "/dashboard/manage-tweet",
            icon: List,
          },
        ]}
      />
    </div>
  );
}
