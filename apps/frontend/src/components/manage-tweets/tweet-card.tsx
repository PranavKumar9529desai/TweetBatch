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

    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
            case 'queued':
                return 'bg-blue-500/10 text-blue-700 border-blue-200';
            case 'posted':
                return 'bg-green-500/10 text-green-700 border-green-200';
            case 'failed':
                return 'bg-red-500/10 text-red-700 border-red-200';
            case 'cancelled':
                return 'bg-gray-500/10 text-gray-700 border-gray-200';
            default:
                return 'bg-gray-500/10 text-gray-700 border-gray-200';
        }
    };

    const contentPreview = post.content
        ? post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '')
        : '(empty)';

    const status = post.status || 'pending';
    const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative flex items-start gap-2 bg-card border border-border rounded-md p-2 text-xs transition-all',
                'group hover:shadow-md hover:border-primary/50',
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
                <div className="text-xs text-foreground line-clamp-2 break-words">
                    {contentPreview}
                </div>

                {/* Status badge */}
                <div className={cn(
                    'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded border text-xs font-medium',
                    getStatusColor(status)
                )}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {statusDisplay}
                </div>
            </div>

            {/* Three-dot menu button */}
            <div className="flex-shrink-0 relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className={cn(
                        'p-1 text-muted-foreground hover:text-foreground transition-colors',
                        'rounded hover:bg-muted',
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
