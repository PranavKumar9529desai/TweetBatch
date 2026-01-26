"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "./tabs";

export interface BottomNavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  isFloating?: boolean;
}

export interface BottomNavigationProps {
  items: BottomNavItem[];
  currentPath: string;
  onNavigate?: (path: string) => void;
  renderLink?: (
    item: BottomNavItem,
    children: React.ReactNode,
    className: string,
  ) => React.ReactNode;
}

export function BottomNavigation({
  items,
  currentPath,
  onNavigate,
  renderLink,
}: BottomNavigationProps) {
  // Universal fix for mobile tap blue overlay
  const noTapHighlight = {
    WebkitTapHighlightColor: "transparent",
    textDecoration: "none",
  };

  const handleValueChange = (value: string) => {
    onNavigate?.(value);
  };

  return (
    <Tabs
      value={currentPath}
      onValueChange={handleValueChange}
      className="fixed bottom-0 left-0 z-50 w-full"
    >
      <TabsList
        className={cn(
          "w-full h-16 bg-background border-t border-border pb-safe rounded-none",
          "grid max-w-lg mx-auto p-0",
          items.length === 3 && "grid-cols-3",
          items.length === 4 && "grid-cols-4",
          items.length === 5 && "grid-cols-5",
        )}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          // --- FLOATING BUTTON (SCAN) ---
          if (item.isFloating) {
            const floatingContent = (
              <>
                <Icon className="w-6 h-6" fill="none" absoluteStrokeWidth />
                <span className="sr-only">{item.label}</span>
              </>
            );

            const floatingClassName = cn(
              "absolute -top-16",
              "flex items-center justify-center w-14 h-14",
              "rounded-full shadow-lg border-4 border-background",
              "transition-transform active:scale-95",
              "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "select-none cursor-pointer",
              "data-[state=active]:bg-background data-[state=active]:text-primary",
              "data-[state=inactive]:bg-muted data-[state=inactive]:text-muted-foreground",
            );

            return (
              <div
                key={item.path}
                className="relative flex items-center justify-center"
              >
                {renderLink ? (
                  <TabsTrigger
                    value={item.path}
                    className={floatingClassName}
                    style={noTapHighlight}
                    asChild
                  >
                    {renderLink(item, floatingContent, floatingClassName)}
                  </TabsTrigger>
                ) : (
                  <TabsTrigger
                    value={item.path}
                    className={floatingClassName}
                    style={noTapHighlight}
                  >
                    {floatingContent}
                  </TabsTrigger>
                )}
              </div>
            );
          }

          // --- STANDARD NAV ITEMS (HOME, ASSISTANT) ---
          const navItemContent = (
            <>
              <Icon
                className={cn(
                  "w-6 h-6 mb-1 transition-all group-active:scale-90",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
                strokeWidth={isActive ? 2.75 : 2}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </>
          );

          const navClassName = cn(
            "inline-flex flex-col items-center justify-center px-5 h-full",
            "transition-colors group",
            "outline-none select-none rounded-none",
            "[@media(hover:hover)]:hover:bg-accent/50",
            "data-[state=active]:bg-transparent data-[state=active]:shadow-none",
            "text-muted-foreground",
          );

          return renderLink ? (
            <TabsTrigger
              key={item.path}
              value={item.path}
              className={navClassName}
              style={noTapHighlight}
              asChild
            >
              {renderLink(item, navItemContent, navClassName)}
            </TabsTrigger>
          ) : (
            <TabsTrigger
              key={item.path}
              value={item.path}
              className={navClassName}
              style={noTapHighlight}
            >
              {navItemContent}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
