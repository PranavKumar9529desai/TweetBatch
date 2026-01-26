import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { scheduledPost } from '@repo/db';

export type ScheduledPost = typeof scheduledPost.$inferSelect;

interface CalendarContextType {
  currentWeekStart: Date;
  setCurrentWeekStart: (date: Date) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  draggedPostId: string | null;
  setDraggedPostId: (id: string | null) => void;
  hoveredCell: { day: number; hour: number } | null;
  setHoveredCell: (cell: { day: number; hour: number } | null) => void;
  selectedPost: ScheduledPost | null;
  setSelectedPost: (post: ScheduledPost | null) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

interface CalendarProviderProps {
  children: ReactNode;
}

export function CalendarProvider({ children }: CalendarProviderProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    return new Date(today.setDate(diff));
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);

  const value: CalendarContextType = {
    currentWeekStart,
    setCurrentWeekStart,
    searchQuery,
    setSearchQuery,
    draggedPostId,
    setDraggedPostId,
    hoveredCell,
    setHoveredCell,
    selectedPost,
    setSelectedPost,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarContext(): CalendarContextType {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendarContext must be used within a CalendarProvider');
  }
  return context;
}
