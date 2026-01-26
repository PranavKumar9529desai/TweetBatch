import React, { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useCalendarContext } from './calendar-context';
import { useManageTweets, type ScheduledPost } from '../../hooks/use-manage-tweets';
import { TweetCard } from './tweet-card';
import { cn } from '@repo/ui/lib/utils';

interface CalendarCellProps {
    dayIndex: number;
    hour: number;
    date: Date;
}

/**
 * CalendarCell
 * 
 * Individual cell representing 1 hour on 1 day
 * Features:
 * - Drop zone for dragging tweets
 * - Displays tweet cards in the cell
 * - Shows count badge if multiple tweets
 * - Hover highlight effect
 * - Loading state during mutation
 */
export function CalendarCell({ dayIndex, hour, date }: CalendarCellProps) {
    const { getPostsForSlot, searchQuery } = useCalendarContext();
    const { reschedulePost } = useManageTweets({
        search: searchQuery,
    }); // We only keep this for the mutation ability

    const [isLoadingDrop, setIsLoadingDrop] = useState(false);

    // Create unique ID for this cell
    const cellId = `cell-${dayIndex}-${hour}`;

    // Set up drop zone
    const { setNodeRef, isOver } = useDroppable({
        id: cellId,
    });

    // Get posts efficiently from Context (O(1) lookup)
    const postsInCell = getPostsForSlot(dayIndex, hour);

    // Calculate target time for drop
    const getTargetTime = (): Date => {
        const target = new Date(date);
        target.setHours(hour, 0, 0, 0);
        return target;
    };

    // Handle drop event
    const handleDrop = async (draggedPost: ScheduledPost) => {
        setIsLoadingDrop(true);
        try {
            const targetTime = getTargetTime();
            reschedulePost.mutate({
                postId: draggedPost.id,
                scheduledAt: targetTime,
            });
        } finally {
            setIsLoadingDrop(false);
        }
    };

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'h-[60px] min-h-[60px] flex flex-col gap-0.5 p-1 relative transition-colors',
                'hover:bg-muted/50',
                isOver && 'bg-primary/20 ring-2 ring-primary/50',
                isLoadingDrop && 'opacity-60 pointer-events-none'
            )}
            data-testid={cellId}
        >
            {/* Tweet cards in this cell */}
            <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                {postsInCell.length > 0 && (
                    <>
                        {postsInCell.slice(0, 2).map((post) => (
                            <div key={post.id} className="flex-shrink-0">
                                <TweetCard
                                    post={post}
                                    onDrop={handleDrop}
                                    isLoadingDrop={reschedulePost.isPending}
                                />
                            </div>
                        ))}

                        {/* Count badge if more than 2 tweets */}
                        {postsInCell.length > 2 && (
                            <div className="flex-shrink-0 flex items-center justify-center">
                                <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-semibold">
                                    +{postsInCell.length - 2}
                                </span>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Drop indicator */}
            {isOver && postsInCell.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-xs text-primary/60 font-medium">Drop here</div>
                </div>
            )}
        </div>
    );
}
