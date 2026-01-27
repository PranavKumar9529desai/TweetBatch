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
                return 'bg-yellow-500/10 border-yellow-500/20 hover:bg-yellow-500/20';
            case 'queued':
                return 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20';
            case 'posted':
                return 'bg-green-500/10 border-green-500/20 hover:bg-green-500/20';
            case 'failed':
                return 'bg-red-500/10 border-red-500/20 hover:bg-red-500/20';
            case 'cancelled':
                return 'bg-gray-500/10 border-gray-500/20 hover:bg-gray-500/20';
            default:
                return 'bg-card border-border';
        }
    };

    // Helper to strip HTML tags for preview
    const stripHtml = (html: string) => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const plainText = post.content ? stripHtml(post.content) : '';
    const contentPreview = plainText
        ? plainText.substring(0, 60) + (plainText.length > 60 ? '...' : '')
        : '(empty)';

    const status = post.status || 'pending';

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'relative flex items-start gap-1.5 border rounded-md p-1.5 text-xs transition-all w-full',
                getStatusGradient(status),
                'group hover:shadow-md cursor-grab active:cursor-grabbing',
                isDragging && 'opacity-50 shadow-lg cursor-grabbing',
                isLoadingDrop && 'opacity-60'
            )}
            {...attributes}
            {...listeners}
        >
            {/* Drag handle - Visual only now (whole card is draggable) */}
            <div
                className="flex-shrink-0 mt-0.5 text-muted-foreground/50 group-hover:text-foreground transition-colors"
            >
                <GripVertical className="h-3 w-3" />
            </div>

            {/* Content preview */}
            <div className="flex-1 min-w-0">
                <div className="text-xs text-foreground line-clamp-2 break-words leading-tight">
                    {contentPreview}
                </div>
            </div>

            {/* Three-dot menu button */}
            <div className="flex-shrink-0 relative z-10" onPointerDown={(e) => e.stopPropagation()}>
                {/* stopPropagation needed so dnd-kit doesn't think we are dragging when clicking menu */}
                <TweetActionsMenu post={post}>
                    <button
                        className={cn(
                            'p-0.5 text-muted-foreground hover:text-foreground transition-colors',
                            'rounded hover:bg-background/80',
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
                </TweetActionsMenu>
            </div>
        </div>
    );
}
