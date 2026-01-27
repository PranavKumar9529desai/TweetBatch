import { Settings, Menu, LogOut, Moon, Sun } from "lucide-react";
import { Topbar as TopbarComponent } from "@repo/ui/components/topbar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/ui/sheet";
import { Button } from "@repo/ui/components/ui/button";
import { useRouteContext, useRouter } from "@tanstack/react-router";
import { useDashboardStats } from "../../hooks/use-dashboard-stats";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { useTheme } from "../theme-provider";
import { authClient } from "@/lib/auth.client";
import { toast } from "@repo/ui/components/ui/sonner";
import { Separator } from "@repo/ui/components/ui/separator";

export function AppTopbar() {
  const { auth } = useRouteContext({ from: '__root__' });
  const { data: stats } = useDashboardStats();
  const { setTheme, theme } = useTheme();
  const router = useRouter();

  const user = auth.user;
  const userName = user?.name || "User";
  const userEmail = user?.email || "";
  const userImage = user?.image || undefined;
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const totalPosted = stats?.stats.find(s => s.status === 'posted')?.count || 0;

  const handleLogout = async () => {
    const toastId = toast.loading("Logging out...");
    const res = await authClient.signOut();
    if (res.error) {
      toast.error(res.error.message || "Failed to log out", { id: toastId });
    } else {
      toast.success("Logged out successfully", { id: toastId });
      await router.invalidate();
      await router.navigate({ to: "/auth/sign-in" });
    }
  };

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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={(e) => setTheme(theme === "dark" ? "light" : "dark", e)}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader className="text-left pb-4">
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Access your profile utilities and settings.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-6 py-4">
                <div className="flex items-center gap-3 px-1">
                  <Avatar className="h-12 w-12 rounded-lg">
                    <AvatarImage src={userImage} alt={userName} />
                    <AvatarFallback className="rounded-lg text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-semibold text-base">{userName}</span>
                    <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-2 py-2 rounded-md hover:bg-accent transition-colors">
                    <div className="flex items-center text-sm font-medium">
                      <Settings className="mr-3 h-4 w-4" />
                      Total Posted
                    </div>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {totalPosted}
                    </span>
                  </div>

                  <Separator className="my-2" />

                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 h-11 text-destructive hover:text-destructive hover:bg-destructive/10 group transition-all duration-200"
                    onClick={handleLogout}
                  >
                    <div className="flex items-center w-full">
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="text-sm font-medium">Log out</span>
                    </div>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      }
    />
  );
}
