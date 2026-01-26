import { Hono } from "hono";
import { createDb } from "@repo/db";
import { ScheduledPostService } from "../services/scheduled-post.service";
import { QStashService } from "../services/qstash.service";
import { RateLimitService } from "../services/rate-limit.service";
import type { Bindings } from "../types";

/**
 * Posts Route
 * Handles CRUD operations for scheduled posts.
 */
import { bulkImportRoute } from "./bulk-import.controller";

/**
 * Posts Route
 * Handles CRUD operations for scheduled posts.
 */
const app = new Hono<{ Bindings: Bindings }>();

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
     * Create a single scheduled post.
     */
    .post("/", async (c) => {
        const env = c.env;
        const body = await c.req.json<{ userId: string; content: string; scheduledAt: string }>();
        const { userId, content, scheduledAt } = body;
        console.log("body", body);
        if (!userId || !content || !scheduledAt) {
            return c.json({ success: false, error: "Missing required fields" }, 400);
        }

        const scheduledDate = new Date(scheduledAt);
        if (isNaN(scheduledDate.getTime())) {
            return c.json({ success: false, error: "Invalid scheduledAt date" }, 400);
        }

        if (scheduledDate <= new Date()) {
            return c.json({ success: false, error: "Scheduled time must be in the future" }, 400);
        }

        if (content.length > 280) {
            return c.json({ success: false, error: "Content exceeds 280 characters" }, 400);
        }

        const { postService, rateLimitService } = getServices(env);

        // Check rate limits
        const limits = await rateLimitService.validateBulkImportLimits(userId, [{ content, scheduledAt: scheduledDate }]);
        if (!limits.valid) {
            return c.json({ success: false, error: "Rate limit exceeded", violations: limits.violations }, 400);
        }

        const post = await postService.createScheduledPost({
            userId,
            content,
            scheduledAt: scheduledDate,
        });

        return c.json({ success: true, post });
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
    });
