import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiclient } from "@/lib/api.client";
import type { ScheduledPost } from "./use-manage-tweets";
import { toast } from "@repo/ui/components/ui/sonner";

export function useScheduledPost(postId?: string) {
  const queryClient = useQueryClient();

  // Query: Fetch single post
  const {
    data: post,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["posts", "detail", postId],
    queryFn: async () => {
      if (!postId) return null;

      const response = await apiclient.posts[":id"].$get({
        param: { id: postId },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch post");
      }

      const data = await response.json();
      if (!data.success) {
        // @ts-ignore
        throw new Error(data.error || "Failed to fetch post");
      }

      return data.post as ScheduledPost;
    },
    enabled: !!postId,
  });

  // Mutation: Update post content
  const updatePost = useMutation({
    mutationFn: async ({
      content,
      scheduledAt,
    }: {
      content: string;
      scheduledAt?: Date;
    }) => {
      if (!postId) throw new Error("No post ID provided");

      const response = await apiclient.posts[":id"].$patch({
        param: { id: postId },
        json: {
          content,
          scheduledAt: scheduledAt ? scheduledAt.toISOString() : undefined,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update post");
      }

      const data = await response.json();
      // @ts-ignore
      if (!data.success) {
        // @ts-ignore
        throw new Error(data.error || "Failed to update post");
      }

      return data.post as ScheduledPost;
    },
    onSuccess: (updatedPost) => {
      toast.success("Post updated successfully");

      // Update detail cache
      queryClient.setQueryData(["posts", "detail", postId], updatedPost);

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["posts", "search"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update post",
      );
    },
  });

  return {
    post,
    isLoading,
    isError,
    error,
    updatePost,
  };
}
