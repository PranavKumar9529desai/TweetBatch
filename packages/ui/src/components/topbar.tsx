import * as React from "react";
import { cn } from "../lib/utils";

export interface TopbarProps extends React.HTMLAttributes<HTMLDivElement> {
  leftContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

export function Topbar({
  className,
  leftContent,
  centerContent,
  rightContent,
  ...props
}: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
      {...props}
    >
      <div className="flex h-14 items-center px-4">
        <div className="flex flex-1 items-center justify-start">
          {leftContent}
        </div>
        <div className="flex flex-1 items-center justify-center">
          {centerContent}
        </div>
        <div className="flex flex-1 items-center justify-end">
          {rightContent}
        </div>
      </div>
    </header>
  );
}
