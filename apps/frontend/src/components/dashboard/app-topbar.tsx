import { Bell, Settings } from "lucide-react";
import { Topbar as TopbarComponent } from "@repo/ui/components/topbar";

export function AppTopbar() {
  return (
    <TopbarComponent
      className="md:hidden"
      leftContent={
        <div className="flex items-center gap-2">
          <img
            src="/favicon/favicon.svg"
            alt="TweetBatch Logo"
            className="h-8 w-8"
          />
          <span className="font-bold text-lg">TweetBatch</span>
        </div>
      }
      rightContent={
        <div className="flex items-center gap-4 text-muted-foreground">
          <Bell className="h-5 w-5" />
          <Settings className="h-5 w-5" />
        </div>
      }
    />
  );
}
