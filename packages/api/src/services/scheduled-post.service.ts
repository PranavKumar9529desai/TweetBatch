import { createDb, scheduledPost, eq, and, gte, lte, desc } from "@repo/db";
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
}

