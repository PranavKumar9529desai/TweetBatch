import { Hono } from "hono";
import { createDb } from "@repo/db";
import { ScheduledPostService } from "../services/scheduled-post.service";
import { QStashService } from "../services/qstash.service";
import { RateLimitService } from "../services/rate-limit.service";
import type { Bindings, Variables } from "../types";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

/**
 * Posts Route
 * Handles CRUD operations for scheduled posts.
 */
import { bulkImportRoute } from "./bulk-import.controller";

/**
 * Posts Route
 * Handles CRUD operations for scheduled posts.
 */
const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Helper to get services
const getServices = (env: Bindings) => {
    const db = createDb(env.DATABASE_URL);
    const postService = new ScheduledPostService(db);
    const qstashService = new QStashService({
        token: env.QSTASH_TOKEN,
        currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY,
        backendUrl: env.BACKEND_URL,
    });
    const rateLimitService = new RateLimitService(db);
    return { postService, qstashService, rateLimitService };
};

// Helper to validate ISO 8601 date format
const isValidIsoDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString === date.toISOString();
};

/**
 * Posts Route
 * Handles CRUD operations for scheduled posts.
 */
export const postsRoute = app
    // Mount bulk import routes (handles /bulk-import and /limits)
    // This must be registered BEFORE the /:id route to avoid conflict
    .route("/", bulkImportRoute)

    /**
     * POST /
     * Create a single scheduled post (draft or scheduled).
     * If scheduledAt is provided, creates pending post ready for sync.
     * If scheduledAt is omitted, creates draft post to be scheduled later in kanban.
     */
    .post("/", async (c) => {
        const env = c.env;
        const body = await c.req.json<{ userId: string; content: string; scheduledAt?: string }>();
        const { userId, content, scheduledAt } = body;
        console.log("body", body);
        if (!userId || !content) {
            return c.json({ success: false, error: "Missing userId or content" }, 400);
        }

        if (content.length > 280) {
            return c.json({ success: false, error: "Content exceeds 280 characters" }, 400);
        }

        const { postService, rateLimitService } = getServices(env);

        let scheduledDate: Date | null = null;

        // If scheduledAt is provided, validate it and prepare for immediate sync
        if (scheduledAt) {
            scheduledDate = new Date(scheduledAt);
            if (isNaN(scheduledDate.getTime())) {
                return c.json({ success: false, error: "Invalid scheduledAt date" }, 400);
            }

            if (scheduledDate <= new Date()) {
                return c.json({ success: false, error: "Scheduled time must be in the future" }, 400);
            }

            // Check rate limits only if scheduling immediately
            const limits = await rateLimitService.validateBulkImportLimits(userId, [{ content, scheduledAt: scheduledDate }]);
            if (!limits.valid) {
                return c.json({ success: false, error: "Rate limit exceeded", violations: limits.violations }, 400);
            }
        }

        const post = await postService.createScheduledPost({
            userId,
            content,
            scheduledAt: scheduledDate || new Date(),
        });

        return c.json({
            success: true,
            post: {
                ...post,
                message: scheduledDate ? "Post scheduled successfully" : "Post created as draft. Schedule it in Manage Tweets."
            }
        });
    })

    /**
     * GET /
     * List scheduled posts for a user.
     */
    .get("/", async (c) => {
        const env = c.env;
        const userId = c.req.query("userId");
        const status = c.req.query("status") as any;
        const limit = parseInt(c.req.query("limit") || "50");
        const offset = parseInt(c.req.query("offset") || "0");

        if (!userId) {
            return c.json({ success: false, error: "Missing userId" }, 400);
        }

        const { postService } = getServices(env);
        const posts = await postService.getScheduledPosts(userId, { status, limit, offset });

        return c.json({ success: true, posts });
    })

    /**
     * Task 1.1: GET /search
     * Get posts with optional filtering.
     * 
     * Query parameters:
     * - startDate (optional): ISO 8601 date
     * - endDate (optional): ISO 8601 date
     * - search (optional): Case-insensitive substring match on content
     * 
     * Validates:
     * - If dates provided, both must be valid ISO 8601 format
     * - If dates provided, Date range is <= 90 days
     * - User is authenticated
     * 
     * Returns: Array of posts sorted by scheduledAt ascending
     */
    .get("/search", async (c) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const env = c.env;
        const startDateStr = c.req.query("startDate");
        const endDateStr = c.req.query("endDate");
        const searchQuery = c.req.query("search");

        let startDate: Date | undefined;
        let endDate: Date | undefined;

        // If dates are provided, validate them and check constraints
        if (startDateStr && endDateStr) {
            startDate = new Date(startDateStr);
            endDate = new Date(endDateStr);

            // Only force end-of-day if the input is just a date (no time component)
            // This allows frontend to pass precise ISO ranges
            if (!endDateStr.includes('T')) {
                endDate.setUTCHours(23, 59, 59, 999);
            }

            if (isNaN(startDate.getTime())) {
                return c.json({ error: "Invalid startDate format. Use ISO 8601 (e.g., 2026-01-27)" }, 400);
            }

            if (isNaN(endDate.getTime())) {
                return c.json({ error: "Invalid endDate format. Use ISO 8601 (e.g., 2026-02-03)" }, 400);
            }

            // Validate date range
            if (startDate > endDate) {
                return c.json({ error: "startDate must be before or equal to endDate" }, 400);
            }

            // Check max 90 days constraint
            const diffMs = endDate.getTime() - startDate.getTime();
            const diffDays = diffMs / (1000 * 60 * 60 * 24);
            if (diffDays > 90) {
                return c.json({ error: "Date range cannot exceed 90 days" }, 400);
            }
        } else if (startDateStr || endDateStr) {
            return c.json({ error: "Both startDate and endDate must be provided if one is present" }, 400);
        }

        try {
            const { postService } = getServices(env);
            const posts = await postService.searchPosts(
                user.id,
                startDate,
                endDate,
                searchQuery
            );

            return c.json({ success: true, posts });
        } catch (error: any) {
            console.error("Error fetching posts:", error);
            return c.json({ error: "Failed to fetch posts" }, 500);
        }
    })

    /**
     * GET /:id
     * Get details of a single post.
     */
    .get("/:id", async (c) => {
        const env = c.env;
        const id = c.req.param("id");
        const { postService } = getServices(env);

        const post = await postService.getScheduledPost(id);
        if (!post) {
            return c.json({ success: false, error: "Post not found" }, 404);
        }

        return c.json({ success: true, post });
    })

    /**
     * PATCH /:id
     * Update a scheduled post.
     */
    .patch("/:id", async (c) => {
        const env = c.env;
        const id = c.req.param("id");
        const body = await c.req.json<{ content?: string; scheduledAt?: string }>();
        const { postService, qstashService } = getServices(env);

        const updateData: any = {};
        if (body.content) updateData.content = body.content;
        if (body.scheduledAt) {
            const date = new Date(body.scheduledAt);
            if (isNaN(date.getTime())) return c.json({ success: false, error: "Invalid date" }, 400);
            if (date <= new Date()) return c.json({ success: false, error: "Time must be in future" }, 400);
            updateData.scheduledAt = date;
        }

        try {
            const result = await postService.updateScheduledPost(id, updateData);

            // If we updated the time and it was synced, cancel the old message
            if (result.needsQStashCancel && result.oldMessageId) {
                await qstashService.cancelMessage(result.oldMessageId);
                console.log(`Cancelled QStash message ${result.oldMessageId} for updated post ${id}`);
            }

            return c.json({ success: true, post: result.updated });
        } catch (error: any) {
            return c.json({ success: false, error: error.message }, 400);
        }
    })

    /**
     * DELETE /:id
     * Delete (cancel) a scheduled post.
     */
    .delete("/:id", async (c) => {
        const env = c.env;
        const id = c.req.param("id");
        const { postService, qstashService } = getServices(env);

        try {
            const result = await postService.deleteScheduledPost(id);

            if (result.qstashMessageId) {
                await qstashService.cancelMessage(result.qstashMessageId);
                console.log(`Cancelled QStash message ${result.qstashMessageId} for deleted post ${id}`);
            }

            return c.json({ success: true, deleted: true });
        } catch (error: any) {
            return c.json({ success: false, error: error.message }, 400);
        }
    })



    /**
     * Task 1.2: POST /:id/reschedule
     * Reschedule a post to a new time.
     * 
     * Request body: { scheduledAt: ISO 8601 timestamp }
     * 
     * Validates:
     * - Post exists and belongs to authenticated user
     * - scheduledAt is >= now + 1 minute
     * - scheduledAt is <= 90 days from now
     * - Post status is not 'posted'
     * - Resets status to 'pending' if it was 'queued' or 'failed'
     * 
     * Returns: Updated post object
     */
    .post(
        "/:id/reschedule",
        zValidator(
            "json",
            z.object({
                scheduledAt: z.string().datetime(),
            })
        ),
        async (c) => {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const env = c.env;
            const postId = c.req.param("id");
            const { scheduledAt } = c.req.valid("json");

            try {
                const newScheduledAt = new Date(scheduledAt);
                if (isNaN(newScheduledAt.getTime())) {
                    return c.json({ error: "Invalid scheduledAt format. Use ISO 8601 timestamp" }, 400);
                }

                const { postService } = getServices(env);
                const updatedPost = await postService.reschedulePost(
                    postId,
                    user.id,
                    newScheduledAt
                );

                return c.json({ success: true, post: updatedPost });
            } catch (error: any) {
                const message = error.message || "Failed to reschedule post";

                // Distinguish between validation errors and server errors
                if (
                    message.includes("not found") ||
                    message.includes("Unauthorized") ||
                    message.includes("already been posted") ||
                    message.includes("must be at least") ||
                    message.includes("cannot be more than")
                ) {
                    return c.json({ error: message }, 400);
                }

                console.error("Error rescheduling post:", error);
                return c.json({ error: "Failed to reschedule post" }, 500);
            }
        }
    )

    /**
     * Task 1.3: POST /:id/cancel
     * Cancel a post (soft delete by setting status='cancelled').
     * 
     * Validates:
     * - Post exists and belongs to authenticated user
     * - Post status is 'pending' or 'failed'
     * - Rejects if status is 'queued' or 'posted'
     * 
     * Returns: Success response with updated post
     */
    .post(
        "/:id/cancel",
        zValidator("json", z.object({})),
        async (c) => {
            const user = c.get("user");
            if (!user) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const env = c.env;
            const postId = c.req.param("id");

            try {
                const { postService } = getServices(env);
                const cancelledPost = await postService.cancelPost(postId, user.id);

                return c.json({ success: true, post: cancelledPost });
            } catch (error: any) {
                const message = error.message || "Failed to cancel post";

                // Distinguish between validation errors and server errors
                if (
                    message.includes("not found") ||
                    message.includes("Unauthorized") ||
                    message.includes("Cannot cancel")
                ) {
                    return c.json({ error: message }, 400);
                }

                console.error("Error cancelling post:", error);
                return c.json({ error: "Failed to cancel post" }, 500);
            }
        }
    );
