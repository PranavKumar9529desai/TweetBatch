import { createContext, useContext, useState, type ReactNode, useMemo, useCallback } from 'react';
import { useManageTweets, type ScheduledPost } from '../../hooks/use-manage-tweets';

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
  // New: Centralized Data Access
  getPostsForSlot: (dayIndex: number, hour: number) => ScheduledPost[];
  isLoading: boolean;
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
    // Set to start of the day
    const d = new Date(today.setDate(diff));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ day: number; hour: number } | null>(null);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);

  // FETCH DATA CENTRALLY
  // Calculate end of the week (Start + 7 days)
  const currentWeekEnd = useMemo(() => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [currentWeekStart]);

  const { posts, isLoading } = useManageTweets({
    startDate: currentWeekStart,
    endDate: currentWeekEnd,
    search: searchQuery,
  });

  // NORMALIZE DATA INTO SLOT MAP
  // Key: "dayIndex-hour" (e.g., "1-14" for Tuesday 2pm)
  // Value: Array of posts
  const postsBySlot = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();

    posts.forEach((post) => {
      if (!post.scheduledAt) return;

      const date = new Date(post.scheduledAt);
      // Calculate day index relative to currentWeekStart
      // We need to be careful with timezones here. 
      // We compare the date part of the post with the week days.
      const diffTime = date.getTime() - currentWeekStart.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Ensure it's within the week (0-6)
      if (diffDays < 0 || diffDays > 6) return;

      const hour = date.getHours();
      const key = `${diffDays}-${hour}`;

      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    });

    return map;
  }, [posts, currentWeekStart]);

  // HELPER TO ACCESS DATA
  const getPostsForSlot = useCallback((dayIndex: number, hour: number) => {
    return postsBySlot.get(`${dayIndex}-${hour}`) || [];
  }, [postsBySlot]);

  const value: CalendarContextType = useMemo(() => ({
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
    getPostsForSlot,
    isLoading,
  }), [
    currentWeekStart,
    searchQuery,
    draggedPostId,
    hoveredCell,
    selectedPost,
    getPostsForSlot,
    isLoading
  ]);

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
