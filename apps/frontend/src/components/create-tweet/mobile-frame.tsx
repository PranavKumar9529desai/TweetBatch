import { Battery, Signal, Wifi } from "lucide-react";
import clsx from "clsx";
import React, { useEffect, useState } from "react";

interface MobileFrameProps {
    children: React.ReactNode;
    className?: string;
}

export function MobileFrame({ children, className }: MobileFrameProps) {
    const [time, setTime] = useState("");

    useEffect(() => {
        // Set initial time
        setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));

        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false }));
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div
            className={clsx(
                // Hardware is always dark/black regardless of software theme
                "relative mx-auto h-[712px] w-[360px] overflow-hidden rounded-[3.5rem] border-[12px] border-[#121212] bg-black shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-white/10",
                className
            )}
        >
            {/* Side Buttons - Power/Volume - Simulating physical buttons matching the frame */}
            <div className="absolute -left-[16px] top-32 h-10 w-[4px] rounded-l-md bg-[#2a2a2a]"></div>
            <div className="absolute -left-[16px] top-48 h-12 w-[4px] rounded-l-md bg-[#2a2a2a]"></div>
            <div className="absolute -right-[16px] top-40 h-16 w-[4px] rounded-r-md bg-[#2a2a2a]"></div>

            {/* Notch / Dynamic Island */}
            <div className="absolute left-1/2 top-0 z-50 h-[28px] w-[110px] -translate-x-1/2 rounded-b-[18px] bg-black pointer-events-none">
                {/* Camera reflection */}
                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1a1a1a] ring-1 ring-white/5"></div>
            </div>

            {/* Status Bar */}
            <div className="relative z-40 flex h-12 w-full items-center justify-between px-7 pt-3.5 text-[13px] font-semibold select-none text-white mix-blend-difference">
                <span className="tracking-wide tabular-nums ">{time || "9:41"}</span>
                <div className="flex gap-1.5 items-center opacity-90">
                    <Signal className="h-3.5 w-3.5 fill-current" strokeWidth={2.5} />
                    <Wifi className="h-3.5 w-3.5" strokeWidth={2.5} />
                    <Battery className="h-[18px] w-[18px]" strokeWidth={2.5} />
                </div>
            </div>

            {/* App Header */}
            <header className="z-30 flex h-[52px] w-full items-center justify-between bg-background backdrop-blur-md px-4 sticky top-0 border-b border-white/5">

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6 fill-foreground">
                        <g><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></g>
                    </svg>
                </div>

                <div className="w-8"></div> {/* Spacer for alignment */}
            </header>

            {/* Content Area */}
            {/* Adjusted height to account for header (52px) and footer (52px) + status bar area if needed, but flex is safer here */}
            {/* Actually, let's use flex col for the main container inner */}
            <div className="absolute inset-0 top-[100px] bottom-[84px] overflow-y-auto overflow-x-hidden scrollbar-hide bg-background">
                {/* top padding pushed by header which is sticky/fixed relative to screen but here we manually positioned content */}
                {/* Re-thinking: The header is inside the frame. */}
                {children}
            </div>

            {/* Bottom Navigation */}
            <div className="absolute bottom-0 left-0 right-0 z-30 flex h-[84px] w-full items-start justify-between bg-background backdrop-blur-md px-6 pt-3 border-t border-white/5">
                <NavIcon active>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-foreground"><g><path d="M22.58 7.35L12.475 1.897c-.297-.16-.654-.16-.95 0L1.425 7.35c-.486.264-.667.87-.405 1.356.128.236.367.394.628.411.163.01.328-.027.476-.11l9.88-5.328 9.875 5.328c.486.262 1.09.083 1.352-.403.263-.485.084-1.09-.4-1.352zM4.943 9.423l7.062-3.81 7.057 3.81v9.648c-.003 1.055-.858 1.905-1.913 1.905H6.85c-1.055 0-1.91-.85-1.913-1.905V9.423z"></path></g></svg>
                </NavIcon>
                <NavIcon>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-muted-foreground"><g><path d="M10.25 3.75c-3.59 0-6.5 2.91-6.5 6.5s2.91 6.5 6.5 6.5c1.795 0 3.419-.726 4.596-1.904 1.178-1.177 1.904-2.801 1.904-4.596 0-3.59-2.91-6.5-6.5-6.5zm-9 6.5c0-4.97 4.03-9 9-9s9 4.03 9 9c0 2.12-.73 4.07-1.97 5.61l4.98 5.63c.2.23.23.57.06.84-.17.27-.47.42-.78.42-.29 0-.58-.15-.75-.39l-4.96-5.61C14.82 17.65 12.63 18.25 10.25 18.25c-4.97 0-9-4.03-9-9z"></path></g></svg>
                </NavIcon>
                <NavIcon>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-muted-foreground"><g><path d="M2 3v18l5-2.5 5 2.5 5-2.5 5 2.5V3H2zm1.25 16.5l3.75-1.875 5 2.5 5-2.5 3.75 1.875V4.25H3.25v15.25zM11.5 5.5v13h1v-13h-1z"></path></g></svg>
                </NavIcon>
                <NavIcon>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-muted-foreground"><g><path d="M14 6c0 2.21-1.791 4-4 4S6 8.21 6 6s1.791-4 4-4 4 1.791 4 4zm-4 10.5c-2.93 0-5.542-1.32-7.252-3.398-.246-.3-.68-.344-.979-.098-.298.246-.343.68-.097.979 2.008 2.44 5.076 3.992 8.328 3.992 3.25 0 6.32-1.55 8.327-3.991.246-.3.201-.734-.097-.98-.298-.245-.733-.2-.979.1C15.542 15.18 12.93 16.5 10 16.5z"></path></g></svg>
                </NavIcon>
                <NavIcon>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-muted-foreground"><g><path d="M1.998 5.5c0-1.38 1.119-2.5 2.5-2.5h15.004c1.381 0 2.5 1.12 2.5 2.5v13c0 1.38-1.119 2.5-2.5 2.5H4.498c-1.381 0-2.5-1.12-2.5-2.5v-13zm2.5-1.5c-.552 0-1 .448-1 1v.374l9.502 5.068 9.502-5.068v-.374c0-.552-.448-1-1-1H4.498zm16.504 14.5v-11.45l-8.79 4.688c-.22.118-.465.176-.712.176-.246 0-.492-.058-.711-.176l-8.791-4.688v11.45c0 .552.448 1 1 1h15.004c.552 0 1-.448 1-1z"></path></g></svg>
                </NavIcon>
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 z-50 h-1 w-36 -translate-x-1/2 rounded-full bg-black/90 dark:bg-white/90 backdrop-blur-md"></div>
        </div>
    );
}

function NavIcon({ children, active }: { children: React.ReactNode; active?: boolean }) {
    return (
        <div className="flex flex-col items-center gap-1 cursor-pointer">
            <div className={clsx("relative", active && "text-foreground", !active && "text-muted-foreground")}>
                {children}
            </div>
        </div>
    );
}
