import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Edit2, Trash2, Copy, AlertCircle } from 'lucide-react';
import { useManageTweets, type ScheduledPost } from '@/hooks/use-manage-tweets';
import { toast } from '@repo/ui/components/ui/sonner';
import { Button } from '@repo/ui/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/ui/components/ui/dialog';
import { cn } from '@repo/ui/lib/utils';

interface TweetActionsMenuProps {
    post: ScheduledPost;
    onClose: () => void;
}

/**
 * TweetActionsMenu
 * 
 * Three-dot dropdown menu using shadcn/ui patterns
 * Menu options:
 * - Edit (navigate to /dashboard/create with postId, only if status pending)
 * - Delete (open delete confirmation, only if status pending or failed)
 * - Copy (copy content to clipboard, always enabled)
 */
export function TweetActionsMenu({ post, onClose }: TweetActionsMenuProps) {
    const navigate = useNavigate();
    const { cancelPost } = useManageTweets({
        startDate: new Date(),
        endDate: new Date(),
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const canEdit = post.status === 'pending';
    const canDelete = post.status === 'pending' || post.status === 'failed';

    const handleEdit = () => {
        navigate({
            to: '/dashboard/create-tweet',
            search: { postId: post.id } as any,
        });
    };
    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        cancelPost.mutate(post.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(post.content || '');
            toast.success('Tweet content copied to clipboard');
            onClose();
        } catch {
            toast.error('Failed to copy to clipboard');
            return (
                <>
                    {/* Menu dropdown */}
                    <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-md shadow-md py-1 z-50 min-w-[160px]">
                        {/* Edit option */}
                        <button
                            onClick={handleEdit}
                            disabled={!canEdit}
                            className={cn(
                                'flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors',
                                canEdit
                                    ? 'hover:bg-muted cursor-pointer text-foreground'
                                    : 'text-muted-foreground cursor-not-allowed opacity-50'
                            )}
                            title={!canEdit ? 'Only pending tweets can be edited' : ''}
                        >
                            <Edit2 className="h-3 w-3" />
                            Edit
                        </button>

                        {/* Delete option */}
                        <button
                            onClick={handleDelete}
                            disabled={!canDelete}
                            className={cn(
                                'flex items-center gap-2 w-full px-3 py-2 text-xs text-left transition-colors',
                                canDelete
                                    ? 'hover:bg-red-500/10 hover:text-red-700 cursor-pointer text-foreground'
                                    : 'text-muted-foreground cursor-not-allowed opacity-50'
                            )}
                            title={!canDelete ? 'Only pending or failed tweets can be deleted' : ''}
                        >
                            <Trash2 className="h-3 w-3" />
                            Delete
                        </button>

                        {/* Copy option (always enabled) */}
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left hover:bg-muted transition-colors text-foreground cursor-pointer border-t border-border"
                        >
                            <Copy className="h-3 w-3" />
                            Copy
                        </button>
                    </div>

                    {/* Delete confirmation dialog */}
                    {showDeleteConfirm && (
                        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                            <DialogContent className="max-w-sm">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <AlertCircle className="h-5 w-5 text-red-500" />
                                        Delete Tweet
                                    </DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete this tweet? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>

                                {/* Preview of tweet being deleted */}
                                <div className="bg-muted rounded-md p-3 my-3">
                                    <p className="text-sm text-foreground line-clamp-3">
                                        {post.content}
                                    </p>
                                </div>

                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDeleteConfirm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={confirmDelete}
                                        disabled={cancelPost.isPending}
                                    >
                                        {cancelPost.isPending ? 'Deleting...' : 'Delete'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </>
            );
        }
    }
}