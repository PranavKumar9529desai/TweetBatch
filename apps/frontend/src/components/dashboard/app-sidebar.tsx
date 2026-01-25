import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@repo/ui/components/ui/sidebar";
import { DASHBOARD_ROUTES } from "@/config/routes";
import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { ModeToggle } from "../mode-toggle";

export function AppSidebar() {
    const [open, setOpen] = useState(false);

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody className="justify-between gap-10">
                <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                    {open ? <Logo /> : <LogoIcon />}
                    <div className="mt-8 flex flex-col gap-2">
                        <SidebarLink
                            link={{
                                label: "Dashboard",
                                href: "/dashboard",
                                icon: (
                                    <LayoutDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
                                ),
                            }}
                        />
                        {DASHBOARD_ROUTES.map((link, idx) => (
                            <SidebarLink key={idx} link={link} />
                        ))}
                    </div>
                </div>
                <div>
                    <SidebarLink
                        link={{
                            label: "Log out",
                            href: "#",
                            icon: (
                                <div className="h-7 w-7 flex-shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800" />
                            ),
                        }}
                    />
                </div>
            </SidebarBody>
            <div>
                <ModeToggle />

            </div>
        </Sidebar>
    );
}

export const Logo = () => {
    return (
        <Link
            to="/dashboard"
            className="font-normal flex space-x-2 items-center text-sm text-black dark:text-white py-1 relative z-20"
        >
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-black dark:text-white whitespace-pre"
            >
                Twitter Scheduler
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
            <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
        </Link>
    );
};
