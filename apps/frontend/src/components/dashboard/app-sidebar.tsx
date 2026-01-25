import { useState } from "react";
import { Sidebar, SidebarBody, useSidebar } from "@repo/ui/components/ui/sidebar";
import { cn } from "@repo/ui/lib/utils";
import { DASHBOARD_ROUTES } from "@/config/routes";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { Profile } from "./profile";

import { Separator } from "@repo/ui/components/ui/separator";

export function AppSidebar() {
    const [open, setOpen] = useState(false);
    const [locked, setLocked] = useState(false);

    const handleSetOpen = (value: boolean | ((prevState: boolean) => boolean)) => {
        if (typeof value === "boolean") {
            if (open && !value && locked) return;
            setOpen(value);
        } else {
            setOpen((prev) => {
                const newValue = value(prev);
                if (prev && !newValue && locked) return prev;
                return newValue;
            });
        }
    };

    return (
        <Sidebar open={open} setOpen={handleSetOpen}>
            <SidebarBody className="justify-between gap-10 bg-sidebar border-r border-sidebar-border">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                    {open ? <Logo /> : <LogoIcon />}
                    <div className="mt-6 flex flex-col gap-2">
                        {open && <Separator className="mb-4 opacity-50" />}
                        <DashboardSidebarLink
                            link={{
                                label: "Dashboard",
                                href: "/dashboard",
                                icon: (
                                    <LayoutDashboard className="text-sidebar-foreground h-5 w-5 flex-shrink-0" />
                                ),
                            }}
                            activeOptions={{ exact: true }}
                        />
                        {DASHBOARD_ROUTES.map((link, idx) => (
                            <DashboardSidebarLink key={idx} link={link} />
                        ))}
                    </div>
                </div>
                <div>
                    <Profile setIsLocked={setLocked} />
                </div>
            </SidebarBody>
        </Sidebar>
    );
}

// Custom link component to handle active state with TanStack Router
const DashboardSidebarLink = ({
    link,
    className,
    activeOptions,
    ...props
}: {
    link: { label: string; href: string; icon: React.ReactNode };
    className?: string;
    activeOptions?: { exact?: boolean; includeHash?: boolean; includeSearch?: boolean };
}) => {
    const { open, animate } = useSidebar();
    return (
        <Link
            to={link.href}
            activeOptions={activeOptions}
            className={cn(
                "flex items-center gap-2 group/sidebar py-2 rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                open ? "justify-start px-2" : "justify-center px-0",
                className
            )}
            activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            }}
            {...props}
        >
            {link.icon}

            <motion.span
                animate={{
                    display: animate ? (open ? "inline-block" : "none") : "inline-block",
                    opacity: animate ? (open ? 1 : 0) : 1,
                }}
                className="text-sidebar-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
            >
                {link.label}
            </motion.span>
        </Link>
    );
};

export const Logo = () => {
    return (
        <Link
            to="/dashboard"
            className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"
        >
            <motion.img
                src="/favicon/favicon.svg"
                alt="TweetBatch Logo"
                className="h-8 w-8 flex-shrink-0"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
            />
            <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="font-bold text-lg text-black dark:text-white whitespace-pre ml-2"
            >
                TweetBatch
            </motion.span>
        </Link>
    );
};

export const LogoIcon = () => {
    return (
        <Link
            to="/dashboard"
            className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"
        >
            <motion.img
                src="/favicon/favicon.svg"
                alt="TweetBatch Logo"
                className="h-8 w-8 flex-shrink-0"
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 10 }}
            />
        </Link>
    );
};
