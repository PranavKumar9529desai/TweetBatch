import { AppBottomNavigation } from "@/components/dashboard/app-bottom-navigation";
import { AppTopbar } from "@/components/dashboard/app-topbar";
import { Outlet } from "@tanstack/react-router";

export function MobileLayout() {
  return (
    <div className="flex flex-col w-full flex-1 mx-auto h-[100dvh]">
      <div className="flex flex-1 flex-col gap-4 pt-0 overflow-y-auto w-full h-full pb-16">
        <AppTopbar />
        <div className="" style={{ viewTransitionName: "page-content" }}>
          <Outlet />
        </div>
      </div>
      <AppBottomNavigation />
    </div>
  );
}
