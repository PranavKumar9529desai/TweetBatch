import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiclient } from '@/lib/api.client';
import type { scheduledPost } from '@repo/db';
import { toast } from '@repo/ui/components/ui/sonner';

// export type ScheduledPost = typeof scheduledPost.$inferSelect;
export interface ScheduledPost {
  id: string;
  content: string;
  scheduledAt: string | null; // API returns ISO string
  status: 'draft' | 'pending' | 'queued' | 'posted' | 'failed' | 'cancelled';
  tweetId: string | null;
  errorMessage: string | null;
  createdAt: string; // API returns ISO string
}

// Query key factory
const queryKeys = {
  all: ['posts'] as const,
  search: (startDate?: Date, endDate?: Date, search?: string) => [
    ...queryKeys.all,
    'search',
    startDate ? startDate.toISOString() : 'all',
    endDate ? endDate.toISOString() : 'all',
    search,
  ] as const,
  detail: (id: string) => [...queryKeys.all, 'detail', id] as const,
};

interface UseManageTweetsOptions {
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

interface UseManageTweetsReturn {
  posts: ScheduledPost[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  reschedulePost: {
    mutate: (variables: { postId: string; scheduledAt: Date }) => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
  cancelPost: {
    mutate: (postId: string) => void;
    isPending: boolean;
    isError: boolean;
    error: Error | null;
  };
}

export function useManageTweets({
  startDate,
  endDate,
  search,
}: UseManageTweetsOptions): UseManageTweetsReturn {
  const queryClient = useQueryClient();

  // Query: Fetch posts by date range
  const {
    data: posts = [],
    isLoading,
    isError,
    error,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: queryKeys.search(startDate, endDate, search),
    queryFn: async () => {
      const queryParams: any = {};
      if (startDate) queryParams.startDate = startDate.toISOString().split('T')[0];
      if (endDate) queryParams.endDate = endDate.toISOString().split('T')[0];
      if (search) queryParams.search = search;

      const response = await apiclient.posts.search.$get({
        query: queryParams,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      // @ts-ignore - TS doesn't know about error field in success union
      if (!data.success) {
        // @ts-ignore
        throw new Error(data.error || 'Failed to fetch posts');
      }

      return (data.posts as ScheduledPost[]) || [];
    },
    enabled: true,
  });

  // Mutation: Reschedule post with optimistic updates
  const reschedulePostMutation = useMutation({
    mutationFn: async ({ postId, scheduledAt }: { postId: string; scheduledAt: Date }) => {
      const response = await apiclient.posts[':id'].reschedule.$post({
        param: { id: postId },
        json: {
          scheduledAt: scheduledAt.toISOString(),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule post');
      }

      const data = await response.json();
      // @ts-ignore
      if (!data.success) {
        // @ts-ignore
        throw new Error(data.error || 'Failed to reschedule post');
      }

      return data.post as ScheduledPost;
    },
    onMutate: async ({ postId, scheduledAt }) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.search(startDate, endDate, search),
      });

      // Get previous data
      const previousPosts = queryClient.getQueryData<ScheduledPost[]>(
        queryKeys.search(startDate, endDate, search)
      );

      // Optimistically update the cache
      if (previousPosts) {
        const updatedPosts = previousPosts.map((post) =>
          post.id === postId ? { ...post, scheduledAt } : post
        );
        queryClient.setQueryData(
          queryKeys.search(startDate, endDate, search),
          updatedPosts
        );
      }

      return { previousPosts };
    },
    onSuccess: (updatedPost) => {
      toast.success('Post rescheduled successfully');
      // Update the detail cache if it exists
      queryClient.setQueryData(queryKeys.detail(updatedPost.id), updatedPost);
      // Invalidate all lists to ensure queue/calendar sync
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(
          queryKeys.search(startDate, endDate, search),
          context.previousPosts
        );
      }

      toast.error(error instanceof Error ? error.message : 'Failed to reschedule post');
    },
  });

  // Mutation: Cancel post with optimistic updates
  const cancelPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiclient.posts[':id'].cancel.$post({
        param: { id: postId },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel post');
      }

      const data = await response.json();
      // @ts-ignore
      if (!data.success) {
        // @ts-ignore
        throw new Error(data.error || 'Failed to cancel post');
      }

      return data.post as ScheduledPost;
    },
    onMutate: async (postId) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.search(startDate, endDate, search),
      });

      // Get previous data
      const previousPosts = queryClient.getQueryData<ScheduledPost[]>(
        queryKeys.search(startDate, endDate, search)
      );

      // Optimistically update the cache
      if (previousPosts) {
        const updatedPosts = previousPosts.map((post) =>
          post.id === postId ? { ...post, status: 'cancelled' } : post
        );
        queryClient.setQueryData(
          queryKeys.search(startDate, endDate, search),
          updatedPosts
        );
      }

      return { previousPosts };
    },
    onSuccess: (cancelledPost) => {
      toast.success('Post cancelled successfully');
      // Update the detail cache if it exists
      queryClient.setQueryData(queryKeys.detail(cancelledPost.id), cancelledPost);
      // Invalidate all lists to ensure queue/calendar sync
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(
          queryKeys.search(startDate, endDate, search),
          context.previousPosts
        );
      }

      toast.error(error instanceof Error ? error.message : 'Failed to cancel post');
    },
  });

  const refetch = async () => {
    await refetchPosts();
  };

  return {
    posts,
    isLoading,
    isError,
    error: (error as Error) || null,
    refetch,
    reschedulePost: {
      mutate: reschedulePostMutation.mutate,
      isPending: reschedulePostMutation.isPending,
      isError: reschedulePostMutation.isError,
      error: (reschedulePostMutation.error as Error) || null,
    },
    cancelPost: {
      mutate: cancelPostMutation.mutate,
      isPending: cancelPostMutation.isPending,
      isError: cancelPostMutation.isError,
      error: (cancelPostMutation.error as Error) || null,
    },
  };
}
