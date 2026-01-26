import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiclient } from '@/lib/api.client';
import type { scheduledPost } from '@repo/db';
import { toast } from '@repo/ui/components/ui/sonner';

export type ScheduledPost = typeof scheduledPost.$inferSelect;

// Query key factory
const queryKeys = {
  all: ['posts'] as const,
  search: (startDate: Date, endDate: Date, search?: string) => [
    ...queryKeys.all,
    'search',
    startDate.toISOString(),
    endDate.toISOString(),
    search,
  ] as const,
  detail: (id: string) => [...queryKeys.all, 'detail', id] as const,
};

interface UseManageTweetsOptions {
  startDate: Date;
  endDate: Date;
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
      const response = await apiclient.posts.search.$get({
        query: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          ...(search && { search }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch posts');
      }

      return (data.posts as ScheduledPost[]) || [];
    },
    enabled: true,
  });

  // Mutation: Reschedule post with optimistic updates
  const reschedulePostMutation = useMutation({
    mutationFn: async ({ postId, scheduledAt }: { postId: string; scheduledAt: Date }) => {
      const response = await apiclient.posts[':id'].reschedule.$post(
        { id: postId },
        {
          json: {
            scheduledAt: scheduledAt.toISOString(),
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reschedule post');
      }

      const data = await response.json();
      if (!data.success) {
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
      toast({
        title: 'Success',
        description: 'Post rescheduled successfully',
        duration: 3000,
      });
      // Update the detail cache if it exists
      queryClient.setQueryData(queryKeys.detail(updatedPost.id), updatedPost);
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(
          queryKeys.search(startDate, endDate, search),
          context.previousPosts
        );
      }

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reschedule post',
        variant: 'destructive',
        duration: 3000,
      });
    },
  });

  // Mutation: Cancel post with optimistic updates
  const cancelPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiclient.posts[':id'].cancel.$post(
        { id: postId },
        {}
      );

      if (!response.ok) {
        throw new Error('Failed to cancel post');
      }

      const data = await response.json();
      if (!data.success) {
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
      toast({
        title: 'Success',
        description: 'Post cancelled successfully',
        duration: 3000,
      });
      // Update the detail cache if it exists
      queryClient.setQueryData(queryKeys.detail(cancelledPost.id), cancelledPost);
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(
          queryKeys.search(startDate, endDate, search),
          context.previousPosts
        );
      }

      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel post',
        variant: 'destructive',
        duration: 3000,
      });
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
