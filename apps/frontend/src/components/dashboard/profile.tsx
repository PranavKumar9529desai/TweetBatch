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
import { authClient } from "@repo/auth/client"; ``

const handleLogout = async () => {
    const res = await authClient.signOut()
    console.log(res)
    if (res.error) {
        console.log(res.error)
    }
    else {
        window.location.href = "/"
    }
}

export function Profile({ setIsLocked }: { setIsLocked: (val: boolean) => void }) {
    const { open } = useSidebar();
    const { setTheme, theme } = useTheme();

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
                        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                        <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                    </Avatar>

                    {open && (
                        <>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">shadcn</span>
                                <span className="truncate text-xs">m@example.com</span>
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
                            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                            <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold">shadcn</span>
                            <span className="truncate text-xs">m@example.com</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
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
