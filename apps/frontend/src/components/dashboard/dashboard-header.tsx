import { SidebarTrigger } from "@repo/ui/components/sidebar";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 md:px-6">
      <SidebarTrigger />
      <div className="flex-1">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
    </header>
  );
}
