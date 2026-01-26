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
        }, 1000); // Update every minute is enough usually, but 1s keeps it synced better on mount

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
            <div className="absolute left-1/2 top-0 z-20 h-[28px] w-[110px] -translate-x-1/2 rounded-b-[18px] bg-black pointer-events-none">
                {/* Camera reflection */}
                <div className="absolute right-3 top-2.5 h-3 w-3 rounded-full bg-[#1a1a1a] ring-1 ring-white/5"></div>
            </div>

            {/* Status Bar */}
            <div className="relative z-10 flex h-12 w-full items-center justify-between px-7 pt-3.5 text-[13px] font-semibold select-none text-secondary">
                <span className="tracking-wide tabular-nums ">{time || "9:41"}</span>
                <div className="flex gap-1.5 items-center opacity-90">
                    <Signal className="h-3.5 w-3.5 fill-current" strokeWidth={2.5} />
                    <Wifi className="h-3.5 w-3.5" strokeWidth={2.5} />
                    <Battery className="h-[18px] w-[18px]" strokeWidth={2.5} />
                </div>
            </div>

            {/* Content Area */}
            <div className="relative h-[calc(100%-2rem)] w-full overflow-y-auto overflow-x-hidden scrollbar-hide bg-background ">
                {children}
            </div>

            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 z-30 h-1 w-36 -translate-x-1/2 rounded-full bg-black/90 dark:bg-white/90 backdrop-blur-md"></div>
        </div>
    );
}
