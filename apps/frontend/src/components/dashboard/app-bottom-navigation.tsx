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
            icon: LayoutDashboard as any,
          },
          {
            label: "Create",
            path: "/dashboard/create-tweet",
            icon: SquarePlus as any,
          },
          {
            label: "Import",
            path: "/dashboard/import-tweet",
            icon: Database as any,
          },
          {
            label: "Manage",
            path: "/dashboard/manage-tweet",
            icon: List as any,
          },
        ]}
      />
    </div>
  );
}
