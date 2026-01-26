import { Battery, Signal, Wifi } from "lucide-react";
import clsx from "clsx";
import React from "react";

interface MobileFrameProps {
    children: React.ReactNode;
    className?: string;
}

export function MobileFrame({ children, className }: MobileFrameProps) {
    return (
        <div
            className={clsx(
                "relative mx-auto h-[712px] w-[360px] overflow-hidden rounded-[3.5rem] border-[10px] border-foreground bg-background shadow-[0_0_40px_-10px_rgba(0,0,0,0.1)] ring-1 ring-border/20",
                className
            )}
        >
            {/* Side Buttons - Power/Volume */}
            <div className="absolute -left-[14px] top-32 h-10 w-[4px] rounded-l-md bg-foreground"></div>
            <div className="absolute -left-[14px] top-48 h-12 w-[4px] rounded-l-md bg-foreground"></div>
            <div className="absolute -right-[14px] top-40 h-16 w-[4px] rounded-r-md bg-foreground"></div>

            {/* Notch / Dynamic Island */}
            <div className="absolute left-1/2 top-0 z-20 h-7 w-28 -translate-x-1/2 rounded-b-[18px] bg-foreground">
                {/* Subtle camera lens reflection */}
                <div className="absolute right-2 top-2 h-2 w-2 rounded-full bg-background/20 mix-blend-overlay"></div>
            </div>

            {/* Status Bar */}
            <div className="flex h-12 w-full items-center justify-between px-7 pt-3 text-xs font-semibold text-foreground select-none">
                <span className="tracking-widest">9:41</span>
                <div className="flex gap-1.5 items-center opacity-90">
                    <Signal className="h-3.5 w-3.5 fill-current" />
                    <Wifi className="h-3.5 w-3.5" />
                    <Battery className="h-4 w-4" />
                </div>
            </div>

            {/* Content Area - Background ensures children don't bleed into border radius artifacts */}
            <div className="relative h-[calc(100%-2rem)] w-full overflow-y-auto overflow-x-hidden scrollbar-hide bg-background">
                {children}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 z-30 h-1 w-32 -translate-x-1/2 rounded-full bg-foreground/90 backdrop-blur-md"></div>
        </div>
    );
}
