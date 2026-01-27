import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Edit2, Trash2, Copy, AlertCircle } from 'lucide-react';
import { useManageTweets, type ScheduledPost } from '@/hooks/use-manage-tweets';
import { toast } from '@repo/ui/components/ui/sonner';
import { Button } from '@repo/ui/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@repo/ui/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@repo/ui/components/ui/dialog';


interface TweetActionsMenuProps {
    post: ScheduledPost;
    children: React.ReactNode;
}

/**
 * TweetActionsMenu
 * 
 * Three-dot dropdown menu using shadcn/ui DropdownMenu (Radix UI)
 * Uses Portals to avoid being cropped by calendar cells.
 */
export function TweetActionsMenu({ post, children }: TweetActionsMenuProps) {
    const navigate = useNavigate();
    const { cancelPost } = useManageTweets({
        enabled: false,
    });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const canEdit = post.status === 'pending';
    const canDelete = post.status === 'pending' || post.status === 'failed';

    const handleEdit = () => {
        // Prevent default behavior if needed, but navigate should work
        navigate({
            to: '/dashboard/create-tweet',
            search: { postId: post.id, mode: 'edit' } as any,
        });
    };

    const handleView = () => {
        navigate({
            to: '/dashboard/create-tweet',
            search: { postId: post.id, mode: 'view' } as any,
        });
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Keep dropdown open? No, we want it to close but open dialog
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        cancelPost.mutate(post.id);
        setShowDeleteConfirm(false);
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(post.content || '');
            toast.success('Tweet content copied to clipboard');
        } catch {
            toast.error('Failed to copy to clipboard');
        }
    };

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    {children}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onClick={handleView} className="cursor-pointer">
                        <Edit2 className="mr-2 h-3.5 w-3.5" />
                        <span>View</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={handleEdit}
                        disabled={!canEdit}
                        className="cursor-pointer"
                    >
                        <Edit2 className="mr-2 h-3.5 w-3.5" />
                        <span>Edit</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={handleDeleteClick}
                        disabled={!canDelete}
                        className="text-red-600 focus:text-red-600 cursor-pointer"
                    >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        <span>Delete</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleCopy} className="cursor-pointer">
                        <Copy className="mr-2 h-3.5 w-3.5" />
                        <span>Copy</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Delete confirmation dialog */}
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
        </>
    );
}