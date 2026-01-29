import { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Inbox } from 'lucide-react';
import { useCalendarContext } from './calendar-context';
import { useManageTweets, type ScheduledPost } from '@/hooks/use-manage-tweets';
import { cn } from '@repo/ui/lib/utils';

/**
 * TweetQueueSidebar
 * 
 * Displays unscheduled tweets (drafts) in a vertical scrollable list
 * Features:
 * - Each item is draggable to calendar cells
 * - Content preview (truncated about 50 chars)
 * - Filterable by search query
 * - Item numbering
 * - Drag handle indicator
 * - Hover effects
 * - Empty state message
 */
export function TweetQueueSidebar() {
    const { searchQuery } = useCalendarContext();

    // Get posts without a scheduledAt time (drafts)
    const { posts } = useManageTweets({
        search: searchQuery,
    });

    const draftPosts = useMemo(() => {
        return posts.filter(
            (post) =>
                (post.status === 'draft' || !post.scheduledAt) && // Draft status OR no time
                post.status !== 'cancelled' && // Not cancelled
                post.status !== 'posted' // Not already posted
        );
    }, [posts]);

    // Filter by search query
    const filteredDrafts = useMemo(() => {
        if (!searchQuery) return draftPosts;

        return draftPosts.filter((post) =>
            post.content?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [draftPosts, searchQuery]);

    return (
        <div className="w-80 flex flex-col border-l border-border bg-muted/20 h-full">
            {/* Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Queue</h2>
                <p className="text-xs text-muted-foreground mt-1">
                    {filteredDrafts.length} {filteredDrafts.length === 1 ? 'draft' : 'drafts'}
                </p>
            </div>

            {/* List of drafts */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                {filteredDrafts.length > 0 ? (
                    <div className="divide-y divide-border p-2">
                        {filteredDrafts.map((post, idx) => (
                            <DraftItem
                                key={post.id}
                                post={post}
                                index={idx + 1}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <Inbox className="h-12 w-12 text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">
                            {searchQuery ? 'No drafts match your search' : 'No drafts'}
                        </p>
                        {!searchQuery && (
                            <p className="text-xs text-muted-foreground/70 mt-2">
                                Create a tweet to get started
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * DraftItem
 * 
 * Individual draggable draft tweet item
 */
interface DraftItemProps {
    post: ScheduledPost;
    index: number;
}

function DraftItem({ post, index }: DraftItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: `draft-${post.id}`,
        data: { post },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    const contentPreview = post.content
        ? post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')
        : '(empty)';

    const { schedulingTargetSlot, setSchedulingTargetSlot, reschedulePost, setQueueDrawerOpen } = useCalendarContext();

    const isTargeting = !!schedulingTargetSlot;

    const handleClick = () => {
        if (schedulingTargetSlot) {
            const { date, hour } = schedulingTargetSlot;
            const targetDate = new Date(date);
            targetDate.setHours(hour, 0, 0, 0);

            reschedulePost({
                postId: post.id,
                scheduledAt: targetDate,
            });

            // Clear state and close drawer
            setSchedulingTargetSlot(null);
            setQueueDrawerOpen(false);
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={handleClick}
            className={cn(
                'flex items-start gap-2 p-3 rounded-md transition-all select-none',
                isTargeting
                    ? 'hover:bg-primary/10 cursor-pointer border border-dashed border-transparent hover:border-primary/40 bg-primary/5'
                    : 'hover:bg-muted/80 cursor-move group',
                isDragging && 'opacity-50 shadow-lg'
            )}
            {...attributes}
            {...listeners}
        >
            {/* Item number */}
            <div className="flex-shrink-0 w-6 text-right">
                <span className={cn(
                    "text-xs font-semibold",
                    isTargeting ? "text-primary" : "text-muted-foreground"
                )}>
                    {index}
                </span>
            </div>

            {/* Drag handle - Hidden on mobile/targeting */}
            <div className={cn(
                "flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                isTargeting && "hidden"
            )}>
                <GripVertical className="h-4 w-4" />
            </div>

            {/* Content preview */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2 break-words">
                    {contentPreview}
                </p>
                <p className={cn(
                    "text-xs mt-1",
                    isTargeting ? "text-primary font-medium" : "text-muted-foreground"
                )}>
                    {isTargeting ? 'Tap to schedule here' : 'Drag to schedule'}
                </p>
            </div>
        </div>
    );
}
