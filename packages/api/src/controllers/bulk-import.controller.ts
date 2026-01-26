import { Hono } from "hono";
import { createDb } from "@repo/db";
import { ScheduledPostService } from "../services/scheduled-post.service";
import { RateLimitService, RATE_LIMITS } from "../services/rate-limit.service";
import type { Bindings } from "../types";

/**
 * Bulk Import Route
 * Handles bulk import of scheduled posts with rate limit validation.
 */
interface BulkImportRequest {
    posts: {
        content: string;
        scheduledAt: string; // ISO 8601 format
    }[];
}

interface ImportedPost {
    id: string;
    content: string;
    scheduledAt: string;
    status: string;
}

interface BulkImportResponse {
    success: boolean;
    imported: number;
    violations?: {
        bulkLimit?: {
            count: number;
            maxAllowed: number;
            message: string;
        };
        dailyLimits?: {
            date: string;
            existingCount: number;
            newCount: number;
            totalCount: number;
            maxAllowed: number;
            message: string;
        }[];
        weeklyLimit?: {
            weekStart: string;
            existingCount: number;
            newCount: number;
            totalCount: number;
            maxAllowed: number;
            message: string;
        };
    };
    posts?: ImportedPost[];
    error?: string;
}

/**
 * Bulk Import Route
 * Handles bulk import of scheduled posts with rate limit validation.
 */
export const bulkImportRoute = new Hono<{ Bindings: Bindings }>()
    .post("/bulk-import", async (c) => {
        const env = c.env;

        // Get user from auth header or session
        // For now, we'll require userId in the request body for testing
        // In production, this should come from authenticated session
        const body = await c.req.json<BulkImportRequest & { userId?: string }>();

        if (!body.userId) {
            return c.json<BulkImportResponse>(
                {
                    success: false,
                    imported: 0,
                    error: "Missing userId - authentication required",
                },
                401
            );
        }

        const { userId, posts } = body;

        // Validate request structure
        if (!Array.isArray(posts) || posts.length === 0) {
            return c.json<BulkImportResponse>(
                {
                    success: false,
                    imported: 0,
                    error: "Invalid request: posts must be a non-empty array",
                },
                400
            );
        }

        // Parse and validate each post
        const parsedPosts: { content: string; scheduledAt: Date }[] = [];
        const now = new Date();
        const validationErrors: string[] = [];

        for (let i = 0; i < posts.length; i++) {
            const post = posts[i]!; // Non-null assertion - we know the index is valid

            // Validate content
            if (!post.content || typeof post.content !== "string") {
                validationErrors.push(`Post ${i + 1}: missing or invalid content`);
                continue;
            }

            if (post.content.length > 280) {
                validationErrors.push(`Post ${i + 1}: content exceeds 280 characters`);
                continue;
            }

            // Validate scheduledAt
            if (!post.scheduledAt || typeof post.scheduledAt !== "string") {
                validationErrors.push(`Post ${i + 1}: missing or invalid scheduledAt`);
                continue;
            }

            const scheduledAt = new Date(post.scheduledAt);
            if (isNaN(scheduledAt.getTime())) {
                validationErrors.push(`Post ${i + 1}: invalid date format for scheduledAt`);
                continue;
            }

            if (scheduledAt <= now) {
                validationErrors.push(`Post ${i + 1}: scheduledAt must be in the future`);
                continue;
            }

            parsedPosts.push({
                content: post.content.trim(),
                scheduledAt,
            });
        }

        if (validationErrors.length > 0) {
            return c.json<BulkImportResponse>(
                {
                    success: false,
                    imported: 0,
                    error: `Validation errors:\n${validationErrors.join("\n")}`,
                },
                400
            );
        }

        // Initialize services
        const db = createDb(env.DATABASE_URL);
        const rateLimitService = new RateLimitService(db);
        const postService = new ScheduledPostService(db);

        // Validate rate limits
        const validation = await rateLimitService.validateBulkImportLimits(userId, parsedPosts);

        if (!validation.valid) {
            const violations: BulkImportResponse["violations"] = {};

            if (validation.violations.bulkLimit) {
                violations.bulkLimit = {
                    ...validation.violations.bulkLimit,
                    message: `Bulk import limit exceeded: ${validation.violations.bulkLimit.count} posts submitted, maximum ${validation.violations.bulkLimit.maxAllowed} allowed`,
                };
            }

            if (validation.violations.dailyLimits) {
                violations.dailyLimits = validation.violations.dailyLimits.map((v) => ({
                    ...v,
                    message: `Daily limit exceeded for ${v.date}: ${v.existingCount} existing + ${v.newCount} new = ${v.totalCount} posts (max ${v.maxAllowed})`,
                }));
            }

            if (validation.violations.weeklyLimit) {
                violations.weeklyLimit = {
                    ...validation.violations.weeklyLimit,
                    message: `Weekly limit exceeded for week starting ${validation.violations.weeklyLimit.weekStart}: ${validation.violations.weeklyLimit.existingCount} existing + ${validation.violations.weeklyLimit.newCount} new = ${validation.violations.weeklyLimit.totalCount} posts (max ${validation.violations.weeklyLimit.maxAllowed})`,
                };
            }

            return c.json<BulkImportResponse>(
                {
                    success: false,
                    imported: 0,
                    violations,
                },
                400
            );
        }

        // All validations passed - create the posts
        const createdPosts = await postService.createScheduledPosts(
            parsedPosts.map((p) => ({
                userId,
                content: p.content,
                scheduledAt: p.scheduledAt,
            }))
        );

        console.log(`Bulk imported ${createdPosts.length} posts for user ${userId}`);

        return c.json<BulkImportResponse>({
            success: true,
            imported: createdPosts.length,
            posts: createdPosts.map((p) => ({
                id: p.id,
                content: p.content,
                scheduledAt: p.scheduledAt ? p.scheduledAt.toISOString() : new Date().toISOString(),
                status: p.status,
            })),
        });
    })
    /**
     * GET /limits
     * Get current rate limit constants.
     */
    .get("/limits", (c) => {
        return c.json({
            limits: {
                maxPostsPerDay: RATE_LIMITS.MAX_POSTS_PER_DAY,
                maxPostsPerWeek: RATE_LIMITS.MAX_POSTS_PER_WEEK,
                maxBulkImportSize: RATE_LIMITS.MAX_BULK_IMPORT_SIZE,
            },
        });
    });
