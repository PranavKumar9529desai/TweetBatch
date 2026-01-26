import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, MoreVertical, Loader2 } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { TweetActionsMenu } from './tweet-actions-menu';
import type { ScheduledPost } from '@/hooks/use-manage-tweets';

interface TweetCardProps {
    post: ScheduledPost;
    onDrop?: (post: ScheduledPost) => void;
    isLoadingDrop?: boolean;
}

/**
 * TweetCard
 * 
 * Draggable tweet item using dnd-kit
 * Features:
 * - Drag handle indicator
 * - Tweet content preview (truncated ~100 chars)
 * - Status badge (color-coded)
 * - Three-dot menu button
 * - Hover effects and animations
 */
export function TweetCard({ post, isLoadingDrop }: TweetCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: post.id,
        data: { post },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    const getStatusGradient = (status: string): string => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500/10 border-yellow-500/20';
            case 'queued':
                return 'bg-blue-500/10 border-blue-500/20';
            case 'posted':
                return 'bg-green-500/10 border-green-500/20';
            case 'failed':
                return 'bg-red-500/10 border-red-500/20';
            case 'cancelled':
                return 'bg-gray-500/10 border-gray-500/20';
            default:
                return 'bg-card border-border';
        }
    };

    const contentPreview = post.content
        ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '')
        : '(empty)';

    const status = post.status || 'pending';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative flex items-start gap-2 border rounded-md p-2 text-xs transition-all',
                getStatusGradient(status),
                'group hover:shadow-md',
                isDragging && 'opacity-50 shadow-lg',
                isLoadingDrop && 'opacity-60'
            )}
            {...attributes}
        >
            {/* Drag handle */}
            <div
                {...listeners}
                className="flex-shrink-0 mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing transition-colors"
                title="Drag to reschedule"
            >
                <GripVertical className="h-3 w-3" />
            </div>

            {/* Content preview */}
            <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground line-clamp-3 break-words leading-relaxed">
                    {contentPreview}
                </div>
            </div>

            {/* Three-dot menu button */}
            <div className="flex-shrink-0 relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={cn(
                        'p-1 text-muted-foreground hover:text-foreground transition-colors',
                        'rounded hover:bg-muted/50',
                        isLoadingDrop && 'pointer-events-none opacity-50'
                    )}
                    title="More actions"
                >
                    {isLoadingDrop ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                        <MoreVertical className="h-3 w-3" />
                    )}
                </button>

                {/* Menu dropdown */}
                {showMenu && (
                    <TweetActionsMenu
                        post={post}
                        onClose={() => setShowMenu(false)}
                    />
                )}
            </div>
        </div>
    );
}
