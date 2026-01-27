import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@repo/ui/components/ui/avatar";
import { useSidebar } from "@repo/ui/components/ui/sidebar";
import { cn } from "@repo/ui/lib/utils";
import { ChevronsUpDown, LogOut, Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "../theme-provider";
import { authClient } from "@/lib/auth.client";
import { useRouter } from "@tanstack/react-router";

import { toast } from "@repo/ui/components/ui/sonner";

export interface ProfileProps {
    setIsLocked: (val: boolean) => void;
    user: {
        name: string;
        email: string;
        image?: string | null;
    } | null;
    stats?: {
        stats: Array<{
            status: string;
            count: number;
        }>;
    } | null;
}

export function Profile({ setIsLocked, user, stats }: ProfileProps) {
    const { open } = useSidebar();
    const { setTheme, theme } = useTheme();
    const router = useRouter();

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
            console.log(res.error);
        } else {
            toast.success("Logged out successfully", { id: toastId });
            await router.invalidate();
            await router.navigate({ to: "/auth/sign-in" });
        }
    };

    return (
        <DropdownMenu onOpenChange={setIsLocked}>
            <DropdownMenuTrigger asChild>
                <div
                    className={cn(
                        "flex items-center gap-2 p-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer transition-colors",
                        open ? "justify-start" : "justify-center"
                    )}
                >
                    <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage src={userImage} alt={userName} />
                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                    </Avatar>

                    {open && (
                        <>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{userName}</span>
                                <span className="truncate text-xs">{userEmail}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </>
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={open ? "bottom" : "right"}
                align="end"
                sideOffset={4}
            >
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage src={userImage} alt={userName} />
                            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">{userName}</span>
                            <span className="truncate text-xs">{userEmail}</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Total Posted
                    </div>
                    <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {totalPosted}
                    </span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                    {theme === 'dark' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                    Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
