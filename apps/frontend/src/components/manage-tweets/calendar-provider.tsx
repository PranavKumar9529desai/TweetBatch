import type { ReactNode } from 'react';
import { DndContext, type DragEndEvent, type DragStartEvent, DragOverlay } from '@dnd-kit/core';
import { useState } from 'react';
import { CalendarProvider, useCalendarContext } from './calendar-context';
import { useManageTweets, type ScheduledPost } from '../../hooks/use-manage-tweets';
import { useDndSensors } from './dnd-setup';
import { TweetCard } from './tweet-card';
import { Toaster } from '@repo/ui/components/ui/sonner';

interface CalendarContextWrapperProps {
    children: ReactNode;
}

/**
 * CalendarContextWrapper
 * 
 * Wraps the calendar and its children with:
 * - CalendarProvider (state management for week, search, drag, etc.)
 * - DndContext (drag-and-drop functionality)
 * - Toast notifications (for user feedback)
 * 
 * This is the main provider that all calendar components must be wrapped with.
 */
export function CalendarContextWrapper({
    children,
}: CalendarContextWrapperProps) {
    return (
        <CalendarProvider>
            <CalendarDnDHandler>
                {children}
            </CalendarDnDHandler>
            <Toaster />
        </CalendarProvider>
    );
}

function CalendarDnDHandler({ children }: { children: ReactNode }) {
    const sensors = useDndSensors();
    const { currentWeekStart, searchQuery } = useCalendarContext();

    // Calculate end of the week (Start + 7 days) to match CalendarProvider's fetch
    // This ensures the manual cache update in useManageTweets targets the correct query key
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const { reschedulePost } = useManageTweets({
        startDate: currentWeekStart,
        endDate: currentWeekEnd,
        search: searchQuery
    });
    const [activePost, setActivePost] = useState<ScheduledPost | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.post) {
            setActivePost(event.active.data.current.post as ScheduledPost);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        // Reset active post always
        setActivePost(null);

        if (!over) return;

        const overId = over.id as string;

        // Parse drop target ID (format: cell-{dayIndex}-{hour})
        if (overId.startsWith('cell-')) {
            const parts = overId.split('-');
            if (parts.length !== 3) return;

            const dayIndex = parseInt(parts[1], 10);
            const hour = parseInt(parts[2], 10);

            // Calculate target date
            const targetDate = new Date(currentWeekStart);
            targetDate.setDate(targetDate.getDate() + dayIndex);
            targetDate.setHours(hour, 0, 0, 0);

            // Verify the dragged item is a post
            const post = active.data.current?.post as ScheduledPost;
            if (!post) return;

            // Only reschedule if the time actually changed
            const currentScheduledAt = post.scheduledAt ? new Date(post.scheduledAt) : null;
            if (
                currentScheduledAt &&
                currentScheduledAt.getTime() === targetDate.getTime()
            ) {
                return;
            }

            reschedulePost.mutate({
                postId: post.id,
                scheduledAt: targetDate,
            });
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {children}
            <DragOverlay dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
                {activePost ? (
                    <div className="w-[300px] shadow-2xl scale-105 cursor-grabbing">
                        <TweetCard post={activePost} />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

export { CalendarProvider };
