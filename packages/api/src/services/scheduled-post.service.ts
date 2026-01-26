import { createDb, scheduledPost, eq, and, gte, lte, desc, like } from "@repo/db";
import { randomUUID } from "crypto";

type DbClient = ReturnType<typeof createDb>;

export interface CreateScheduledPostInput {
    userId: string;
    content: string;
    scheduledAt: Date;
}

export interface UpdateScheduledPostInput {
    content?: string;
    scheduledAt?: Date;
}

export interface GetScheduledPostsFilters {
    status?: "pending" | "queued" | "posted" | "failed" | "cancelled";
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
}

export interface ScheduledPostResponse {
    id: string;
    content: string;
    scheduledAt: Date | null;
    status: string;
    tweetId: string | null;
    errorMessage: string | null;
    createdAt: Date;
}

/**
 * Service for managing scheduled posts in the database.
 */
export class ScheduledPostService {
    private db: DbClient;

    constructor(db: DbClient) {
        this.db = db;
    }

    /**
     * Create a new scheduled post.
     */
    async createScheduledPost(input: CreateScheduledPostInput) {
        const id = randomUUID().slice(0, 16);

        const [post] = await this.db
            .insert(scheduledPost)
            .values({
                id,
                userId: input.userId,
                content: input.content,
                scheduledAt: input.scheduledAt || null,
                status: "draft",
                syncedToQStash: false,
                retryCount: 0,
            })
            .returning();

        return post;
    }

    /**
     * Transition a draft post to pending status.
     * Called when user sets scheduled time in kanban/manage-tweet view.
     * Requires scheduledAt to be set.
     */
    async draftToPending(postId: string, scheduledAt: Date) {
        if (scheduledAt <= new Date()) {
            throw new Error("Scheduled time must be in the future");
        }

        const existing = await this.getScheduledPost(postId);
        if (!existing) {
            throw new Error(`Post ${postId} not found`);
        }

        if (existing.status !== "draft") {
            throw new Error(`Cannot transition post with status '${existing.status}' to pending. Only drafts can be scheduled.`);
        }

        const [updated] = await this.db
            .update(scheduledPost)
            .set({
                status: "pending",
                scheduledAt: scheduledAt,
            })
            .where(eq(scheduledPost.id, postId))
            .returning();

        return updated;
    }

    /**
     * Get a single scheduled post by ID.
     */
    async getScheduledPost(postId: string) {
        return this.db.query.scheduledPost.findFirst({
            where: (post, { eq }) => eq(post.id, postId),
        });
    }

    /**
     * Get all scheduled posts for a user with optional filters.
     */
    async getScheduledPosts(userId: string, filters: GetScheduledPostsFilters = {}) {
        const { status, from, to, limit = 50, offset = 0 } = filters;

        const conditions = [eq(scheduledPost.userId, userId)];

        if (status) {
            conditions.push(eq(scheduledPost.status, status));
        }

        if (from) {
            conditions.push(gte(scheduledPost.scheduledAt, from));
        }

        if (to) {
            conditions.push(lte(scheduledPost.scheduledAt, to));
        }

        return this.db.query.scheduledPost.findMany({
            where: and(...conditions),
            orderBy: [desc(scheduledPost.scheduledAt)],
            limit,
            offset,
        });
    }

    /**
     * Update a scheduled post.
     * Only allows updating content and scheduledAt.
     * Cannot update if already posted or failed.
     */
    async updateScheduledPost(postId: string, updates: UpdateScheduledPostInput) {
        // First check current status
        const existing = await this.getScheduledPost(postId);

        if (!existing) {
            throw new Error(`Post ${postId} not found`);
        }

        if (existing.status === "posted" || existing.status === "failed") {
            throw new Error(`Cannot update post with status: ${existing.status}`);
        }

        const updateData: Record<string, unknown> = {};

        if (updates.content !== undefined) {
            updateData.content = updates.content;
        }

        if (updates.scheduledAt !== undefined) {
            updateData.scheduledAt = updates.scheduledAt;
            // If already synced to QStash, we need to re-sync
            // Mark as not synced so the cron picks it up again
            if (existing.syncedToQStash) {
                updateData.syncedToQStash = false;
                updateData.status = "pending";
                // Note: The old QStash message should be cancelled separately
            }
        }

        const [updated] = await this.db
            .update(scheduledPost)
            .set(updateData)
            .where(eq(scheduledPost.id, postId))
            .returning();

        return { updated, needsQStashCancel: existing.syncedToQStash && updates.scheduledAt !== undefined, oldMessageId: existing.qstashMessageId };
    }

    /**
     * Cancel a scheduled post.
     * Returns the QStash message ID if it needs to be cancelled.
     */
    async cancelScheduledPost(postId: string) {
        const existing = await this.getScheduledPost(postId);

        if (!existing) {
            throw new Error(`Post ${postId} not found`);
        }

        if (existing.status === "posted") {
            throw new Error("Cannot cancel a post that has already been posted");
        }

        if (existing.status === "cancelled") {
            return { post: existing, qstashMessageId: null };
        }

        const [cancelled] = await this.db
            .update(scheduledPost)
            .set({ status: "cancelled" })
            .where(eq(scheduledPost.id, postId))
            .returning();

        return {
            post: cancelled,
            qstashMessageId: existing.syncedToQStash ? existing.qstashMessageId : null,
        };
    }

    /**
     * Delete a scheduled post permanently.
     * Returns the QStash message ID if it needs to be cancelled.
     */
    async deleteScheduledPost(postId: string) {
        const existing = await this.getScheduledPost(postId);

        if (!existing) {
            throw new Error(`Post ${postId} not found`);
        }

        if (existing.status === "posted") {
            throw new Error("Cannot delete a post that has already been posted");
        }

        await this.db.delete(scheduledPost).where(eq(scheduledPost.id, postId));

        return {
            deleted: true,
            qstashMessageId: existing.syncedToQStash ? existing.qstashMessageId : null,
        };
    }

    /**
     * Mark a post as posted (called after successful tweet).
     */
    async markAsPosted(postId: string, tweetId: string) {
        const [updated] = await this.db
            .update(scheduledPost)
            .set({
                status: "posted",
                tweetId,
                postedAt: new Date(),
            })
            .where(eq(scheduledPost.id, postId))
            .returning();

        return updated;
    }

    /**
     * Mark a post as failed.
     */
    async markAsFailed(postId: string, errorMessage: string, incrementRetry = true) {
        const existing = await this.getScheduledPost(postId);
        const retryCount = incrementRetry ? (existing?.retryCount ?? 0) + 1 : existing?.retryCount ?? 0;

        const [updated] = await this.db
            .update(scheduledPost)
            .set({
                status: "failed",
                errorMessage,
                retryCount,
                failedAt: new Date(),
            })
            .where(eq(scheduledPost.id, postId))
            .returning();

        return updated;
    }

    /**
     * Get unsynced posts for a time window (used by cron).
     */
    async getUnsyncedPostsForWindow(windowStart: Date, windowEnd: Date) {
        return this.db.query.scheduledPost.findMany({
            where: (post, { and, eq, gte, lte }) =>
                and(
                    eq(post.status, "pending"),
                    eq(post.syncedToQStash, false),
                    gte(post.scheduledAt, windowStart),
                    lte(post.scheduledAt, windowEnd),
                ),
            orderBy: [desc(scheduledPost.scheduledAt)],
        });
    }

    /**
     * Mark posts as synced to QStash.
     */
    async markAsSynced(postId: string, qstashMessageId: string) {
        const [updated] = await this.db
            .update(scheduledPost)
            .set({
                syncedToQStash: true,
                qstashMessageId,
                status: "queued",
            })
            .where(eq(scheduledPost.id, postId))
            .returning();

        return updated;
    }

    /**
     * Create multiple scheduled posts in a batch.
     * Used for bulk import functionality.
     */
    async createScheduledPosts(inputs: CreateScheduledPostInput[]) {
        if (inputs.length === 0) {
            return [];
        }

        const posts = inputs.map((input) => ({
            id: randomUUID().slice(0, 16),
            userId: input.userId,
            content: input.content,
            scheduledAt: input.scheduledAt,
            status: "pending" as const,
            syncedToQStash: false,
            retryCount: 0,
        }));

        const inserted = await this.db
            .insert(scheduledPost)
            .values(posts)
            .returning();

        return inserted;
    }

    /**
     * Cancel all pending posts for a user.
     * Used when account is disconnected to prevent processing posts that will fail.
     * Returns the count of cancelled posts.
     */
    async cancelAllPendingPostsForUser(userId: string, reason: string): Promise<number> {
        const result = await this.db
            .update(scheduledPost)
            .set({
                status: "cancelled",
                errorMessage: reason,
            })
            .where(
                and(
                    eq(scheduledPost.userId, userId),
                    eq(scheduledPost.status, "pending")
                )
            )
            .returning();

        return result.length;
    }

    /**
     * Cancel all queued posts for a user and return their QStash message IDs.
     * Used when account is disconnected to cancel scheduled QStash messages.
     */
    async cancelAllQueuedPostsForUser(userId: string, reason: string): Promise<string[]> {
        const posts = await this.db.query.scheduledPost.findMany({
            where: (post, { and, eq }) =>
                and(
                    eq(post.userId, userId),
                    eq(post.status, "queued")
                ),
        });

        const qstashMessageIds: string[] = [];

        for (const post of posts) {
            if (post.qstashMessageId) {
                qstashMessageIds.push(post.qstashMessageId);
            }
        }

        // Update all queued posts to cancelled
        if (posts.length > 0) {
            await this.db
                .update(scheduledPost)
                .set({
                    status: "cancelled",
                    errorMessage: reason,
                })
                .where(
                    and(
                        eq(scheduledPost.userId, userId),
                        eq(scheduledPost.status, "queued")
                    )
                );
        }

        return qstashMessageIds;
    }

    /**
     * Get posts by date range with optional search query.
     * Task 1.1: Used by GET /api/posts endpoint.
     * 
     * @param userId The user ID to filter posts by
     * @param startDate Start of date range (inclusive)
     * @param endDate End of date range (inclusive)
     * @param searchQuery Optional search term for case-insensitive content matching
     * @returns Array of posts matching the criteria, sorted by scheduledAt ascending
     */
    /**
     * Search posts by date range and query.
     * Task 1.1: Used by GET /api/posts endpoint.
     * 
     * @param userId The user ID to filter posts by
     * @param startDate Optional start of date range (inclusive)
     * @param endDate Optional end of date range (inclusive)
     * @param searchQuery Optional search term for case-insensitive content matching
     * @returns Array of posts matching the criteria, sorted by scheduledAt ascending
     */
    async searchPosts(
        userId: string,
        startDate?: Date,
        endDate?: Date,
        searchQuery?: string
    ): Promise<ScheduledPostResponse[]> {
        const conditions = [
            eq(scheduledPost.userId, userId),
        ];

        if (startDate) {
            conditions.push(gte(scheduledPost.scheduledAt, startDate));
        }

        if (endDate) {
            conditions.push(lte(scheduledPost.scheduledAt, endDate));
        }

        if (searchQuery) {
            conditions.push(
                like(scheduledPost.content, `%${searchQuery}%`)
            );
        }

        const posts = await this.db.query.scheduledPost.findMany({
            where: and(...conditions),
            orderBy: [scheduledPost.scheduledAt],
        });

        return posts.map((post) => ({
            id: post.id,
            content: post.content,
            scheduledAt: post.scheduledAt,
            status: post.status,
            tweetId: post.tweetId,
            errorMessage: post.errorMessage,
            createdAt: post.createdAt,
        }));
    }

    /**
     * Reschedule a post to a new time.
     * Task 1.2: Used by POST /api/posts/{id}/reschedule endpoint.
     * 
     * Validates that:
     * - Post exists and belongs to user
     * - New time is >= now + 1 minute and <= 90 days from now
     * - Post status is not 'posted'
     * - If status is 'queued' or 'failed', resets to 'pending'
     * 
     * @param postId The post ID to reschedule
     * @param userId The user ID (for authorization)
     * @param newScheduledAt The new scheduled time (ISO 8601)
     * @returns The updated post object
     * @throws Error if validation fails
     */
    async reschedulePost(
        postId: string,
        userId: string,
        newScheduledAt: Date
    ): Promise<ScheduledPostResponse> {
        // 1. Verify post exists and belongs to user
        const post = await this.getScheduledPost(postId);
        if (!post) {
            throw new Error("Post not found");
        }

        if (post.userId !== userId) {
            throw new Error("Unauthorized: post does not belong to this user");
        }

        // 2. Check if post is already posted
        if (post.status === "posted") {
            throw new Error("Cannot reschedule a post that has already been posted");
        }

        // 3. Validate new scheduled time
        const now = new Date();
        const minTime = new Date(now.getTime() + 60 * 1000); // now + 1 minute
        const maxTime = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // now + 90 days

        if (newScheduledAt < minTime) {
            throw new Error("Scheduled time must be at least 1 minute in the future");
        }

        if (newScheduledAt > maxTime) {
            throw new Error("Scheduled time cannot be more than 90 days in the future");
        }

        // 4. Update the post
        let newStatus = post.status;
        if (post.status === "queued" || post.status === "failed" || post.status === "draft") {
            newStatus = "pending";
        }

        const updated = await this.db
            .update(scheduledPost)
            .set({
                scheduledAt: newScheduledAt,
                status: newStatus,
                syncedToQStash: false, // Mark for re-sync if it was queued
            })
            .where(eq(scheduledPost.id, postId))
            .returning();

        if (!updated || updated.length === 0) {
            throw new Error("Failed to update post");
        }

        const result = updated[0]!;
        return {
            id: result.id,
            content: result.content,
            scheduledAt: result.scheduledAt,
            status: result.status,
            tweetId: result.tweetId,
            errorMessage: result.errorMessage,
            createdAt: result.createdAt,
        };
    }

    /**
     * Cancel a post (soft delete).
     * Task 1.3: Used by POST /api/posts/{id}/cancel endpoint.
     * 
     * Validates that:
     * - Post exists and belongs to user
     * - Post status is 'pending' or 'failed' (reject if 'queued' or 'posted')
     * - Sets status to 'cancelled'
     * 
     * @param postId The post ID to cancel
     * @param userId The user ID (for authorization)
     * @returns The updated post object with status='cancelled'
     * @throws Error if validation fails
     */
    async cancelPost(
        postId: string,
        userId: string
    ): Promise<ScheduledPostResponse> {
        // 1. Verify post exists and belongs to user
        const post = await this.getScheduledPost(postId);
        if (!post) {
            throw new Error("Post not found");
        }

        if (post.userId !== userId) {
            throw new Error("Unauthorized: post does not belong to this user");
        }

        // 2. Check if post status allows cancellation
        if (post.status === "queued" || post.status === "posted") {
            throw new Error(
                `Cannot cancel a post with status '${post.status}'. ` +
                "Only pending or failed posts can be cancelled."
            );
        }

        // 3. Set status to cancelled
        const updated = await this.db
            .update(scheduledPost)
            .set({
                status: "cancelled",
            })
            .where(eq(scheduledPost.id, postId))
            .returning();

        if (!updated || updated.length === 0) {
            throw new Error("Failed to cancel post");
        }

        const result = updated[0]!;
        return {
            id: result.id,
            content: result.content,
            scheduledAt: result.scheduledAt,
            status: result.status,
            tweetId: result.tweetId,
            errorMessage: result.errorMessage,
            createdAt: result.createdAt,
        };
    }

    /**
     * Get posts by status.
     * Task 1.4: Helper method used by other endpoints and crons.
     * 
     * @param userId The user ID to filter posts by
     * @param status The status to filter by
     * @returns Array of posts with the specified status
     */
    async getPostsByStatus(
        userId: string,
        status: string
    ): Promise<ScheduledPostResponse[]> {
        const posts = await this.db.query.scheduledPost.findMany({
            where: (post, { and, eq }) =>
                and(
                    eq(post.userId, userId),
                    eq(post.status, status)
                ),
            orderBy: [desc(scheduledPost.scheduledAt)],
        });

        return posts.map((post) => ({
            id: post.id,
            content: post.content,
            scheduledAt: post.scheduledAt,
            status: post.status,
            tweetId: post.tweetId,
            errorMessage: post.errorMessage,
            createdAt: post.createdAt,
        }));
    }
}

