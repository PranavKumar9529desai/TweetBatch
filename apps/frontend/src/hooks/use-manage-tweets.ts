import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiclient } from "@/lib/api.client";

import { toast } from "@repo/ui/components/ui/sonner";

// export type ScheduledPost = typeof scheduledPost.$inferSelect;
export interface ScheduledPost {
  id: string;
  content: string;
  scheduledAt: string | null; // API returns ISO string
  status: "draft" | "pending" | "queued" | "posted" | "failed" | "cancelled";
  tweetId: string | null;
  errorMessage: string | null;
  createdAt: string; // API returns ISO string
}

const queryKeys = {
  all: ["posts"] as const,
  search: (
    startDate?: Date,
    endDate?: Date,
    search?: string,
    limit: number = 50,
    offset: number = 0,
  ) => {
    const startStr = startDate ? startDate.toISOString() : "all";
    const endStr = endDate ? endDate.toISOString() : "all";
    return [
      ...queryKeys.all,
      "search",
      startStr,
      endStr,
      search,
      limit,
      offset,
    ] as const;
  },
  detail: (id: string) => [...queryKeys.all, "detail", id] as const,
};

interface UseManageTweetsOptions {
  startDate?: Date;
  endDate?: Date;
  search?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
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
  limit = 50,
  offset = 0,
  enabled = true,
}: UseManageTweetsOptions): UseManageTweetsReturn {
  const queryClient = useQueryClient();

  // Memoize date strings to ensure query key stability
  const startStr = startDate ? startDate.toISOString() : "all";
  const endStr = endDate ? endDate.toISOString() : "all";

  // Query: Fetch posts by date range
  const {
    data: posts = [],
    isLoading,
    isError,
    error,
    refetch: refetchPosts,
  } = useQuery({
    queryKey: queryKeys.search(startDate, endDate, search, limit, offset),
    queryFn: async () => {
      const queryParams: any = {};
      if (startDate) queryParams.startDate = startStr;
      if (endDate) queryParams.endDate = endStr;
      if (search) queryParams.search = search;
      queryParams.limit = limit.toString();
      queryParams.offset = offset.toString();

      const response = await apiclient.posts.search.$get({
        query: queryParams,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();
      // @ts-ignore - TS doesn't know about error field in success union
      if (!data.success) {
        // @ts-ignore
        throw new Error(data.error || "Failed to fetch posts");
      }

      return (data.posts as ScheduledPost[]) || [];
    },
    enabled: enabled,
    staleTime: 5000, // Keep data fresh for 5 seconds to avoid rapid refetches
    refetchOnWindowFocus: false, // Disable refetch on window focus for stability
  });

  // Mutation: Reschedule post with optimistic updates
  const reschedulePostMutation = useMutation({
    mutationFn: async ({
      postId,
      scheduledAt,
    }: {
      postId: string;
      scheduledAt: Date;
    }) => {
      const response = await apiclient.posts[":id"].reschedule.$post({
        param: { id: postId },
        json: {
          scheduledAt: scheduledAt.toISOString(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to reschedule post");
      }

      const data = await response.json();
      // @ts-ignore
      if (!data.success) {
        // @ts-ignore
        throw new Error(data.error || "Failed to reschedule post");
      }

      return data.post as ScheduledPost;
    },
    onMutate: async ({ postId, scheduledAt }) => {
      // Cancel ongoing queries to avoid overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.all,
      });

      // Optimistically update all search queries
      queryClient.setQueriesData<ScheduledPost[]>(
        { queryKey: [...queryKeys.all, "search"] },
        (oldPosts) => {
          if (!oldPosts) return oldPosts;

          return oldPosts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  scheduledAt: scheduledAt.toISOString(),
                  status: "pending" as const,
                }
              : post,
          );
        },
      );

      return {};
    },
    onSuccess: (updatedPost) => {
      toast.success("Post rescheduled successfully");

      // Update the detail cache if it exists
      queryClient.setQueryData(queryKeys.detail(updatedPost.id), updatedPost);

      //AUTHORITATIVE UPDATE: Update all search queries with the real data from server
      queryClient.setQueriesData<ScheduledPost[]>(
        { queryKey: [...queryKeys.all, "search"] },
        (oldPosts) => {
          if (!oldPosts) return oldPosts;

          const exists = oldPosts.some((p) => p.id === updatedPost.id);

          // If it exists in this specific query result, update it
          if (exists) {
            return oldPosts.map((p) =>
              p.id === updatedPost.id ? updatedPost : p,
            );
          }

          // If it doesn't exist, we might need to ADD it if it belongs to this query's range
          // However, determining if it "belongs" here requires parsing the query key dates.
          // For now, updating existing occurrences is the safest way to avoid duplicates across paginated lists.
          return oldPosts;
        },
      );

      // Also update the "Queue" specifically by removing it if it's no longer a draft
      // (The above map handles update, but if it was a draft and now it's scheduled,
      // some queries might want it removed, and others might want it added).
      // TanStack Query's setQueriesData is powerful here.
    },
    onError: (error) => {
      // Invalidate on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      toast.error(
        error instanceof Error ? error.message : "Failed to reschedule post",
      );
    },
  });

  // Mutation: Cancel post with optimistic updates
  const cancelPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiclient.posts[":id"].cancel.$post({
        param: { id: postId },
        json: {},
      });

      if (!response.ok) {
        throw new Error("Failed to cancel post");
      }

      const data = await response.json();
      // @ts-ignore
      if (!data.success) {
        // @ts-ignore
        throw new Error(data.error || "Failed to cancel post");
      }

      return data.post as ScheduledPost;
    },
    onMutate: async (postId) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.all,
      });

      // Optimistically update all search queries
      queryClient.setQueriesData<ScheduledPost[]>(
        { queryKey: [...queryKeys.all, "search"] },
        (oldPosts) => {
          if (!oldPosts) return oldPosts;
          return oldPosts.map((post) =>
            post.id === postId
              ? { ...post, status: "cancelled" as const }
              : post,
          );
        },
      );

      return {};
    },
    onSuccess: (cancelledPost) => {
      toast.success("Post cancelled successfully");

      // Update the detail cache if it exists
      queryClient.setQueryData(
        queryKeys.detail(cancelledPost.id),
        cancelledPost,
      );

      // Authoritative update across all search caches
      queryClient.setQueriesData<ScheduledPost[]>(
        { queryKey: [...queryKeys.all, "search"] },
        (oldPosts) => {
          if (!oldPosts) return oldPosts;
          return oldPosts.map((p) =>
            p.id === cancelledPost.id ? cancelledPost : p,
          );
        },
      );
    },
    onError: (error) => {
      // Invalidate on error to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.all });
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel post",
      );
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
