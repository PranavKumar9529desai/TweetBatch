import { createDb, scheduledPost, eq, and, gte, lte, sql } from "@repo/db";

type DbClient = ReturnType<typeof createDb>;

/**
 * Rate limit constants for scheduling tweets.
 */
export const RATE_LIMITS = {
    /** Maximum posts allowed per day per user */
    MAX_POSTS_PER_DAY: 3,
    /** Maximum posts allowed per week per user */
    MAX_POSTS_PER_WEEK: 20,
    /** Maximum posts allowed per bulk import */
    MAX_BULK_IMPORT_SIZE: 50,
} as const;

export interface BulkImportPost {
    content: string;
    scheduledAt: Date;
}

export interface DailyLimitViolation {
    date: string;
    existingCount: number;
    newCount: number;
    totalCount: number;
    maxAllowed: number;
}

export interface WeeklyLimitViolation {
    weekStart: string;
    existingCount: number;
    newCount: number;
    totalCount: number;
    maxAllowed: number;
}

export interface RateLimitValidationResult {
    valid: boolean;
    violations: {
        bulkLimit?: {
            count: number;
            maxAllowed: number;
        };
        dailyLimits?: DailyLimitViolation[];
        weeklyLimit?: WeeklyLimitViolation;
    };
}

/**
 * Service for validating rate limits on scheduled posts.
 */
export class RateLimitService {
    private db: DbClient;

    constructor(db: DbClient) {
        this.db = db;
    }

    /**
     * Count posts scheduled for a specific day (including existing + pending).
     */
    async countPostsForDay(userId: string, date: Date): Promise<number> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const result = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(scheduledPost)
            .where(
                and(
                    eq(scheduledPost.userId, userId),
                    gte(scheduledPost.scheduledAt, startOfDay),
                    lte(scheduledPost.scheduledAt, endOfDay),
                    // Only count active posts (not cancelled or failed permanently)
                    sql`${scheduledPost.status} IN ('pending', 'queued', 'posted')`
                )
            );

        return result[0]?.count ?? 0;
    }

    /**
     * Count posts scheduled for a week starting from a given date.
     */
    async countPostsForWeek(userId: string, weekStart: Date): Promise<number> {
        const startOfWeek = new Date(weekStart);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        endOfWeek.setHours(23, 59, 59, 999);

        const result = await this.db
            .select({ count: sql<number>`count(*)::int` })
            .from(scheduledPost)
            .where(
                and(
                    eq(scheduledPost.userId, userId),
                    gte(scheduledPost.scheduledAt, startOfWeek),
                    lte(scheduledPost.scheduledAt, endOfWeek),
                    sql`${scheduledPost.status} IN ('pending', 'queued', 'posted')`
                )
            );

        return result[0]?.count ?? 0;
    }

    /**
     * Get the start of the week for a given date (Monday).
     */
    private getWeekStart(date: Date): Date {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        d.setDate(diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    /**
     * Format date to YYYY-MM-DD string.
     */
    private formatDate(date: Date): string {
        return date.toISOString().split("T")[0] as string;
    }

    /**
     * Validate bulk import limits for a set of posts.
     * Checks:
     * 1. Bulk import size limit (50 posts max)
     * 2. Daily limits (3 posts per day)
     * 3. Weekly limits (20 posts per week)
     */
    async validateBulkImportLimits(
        userId: string,
        posts: BulkImportPost[]
    ): Promise<RateLimitValidationResult> {
        const violations: RateLimitValidationResult["violations"] = {};

        // Check 1: Bulk import size limit
        if (posts.length > RATE_LIMITS.MAX_BULK_IMPORT_SIZE) {
            violations.bulkLimit = {
                count: posts.length,
                maxAllowed: RATE_LIMITS.MAX_BULK_IMPORT_SIZE,
            };
        }

        // Group posts by day
        const postsByDay = new Map<string, BulkImportPost[]>();
        for (const post of posts) {
            const dateKey = this.formatDate(post.scheduledAt);
            const existing = postsByDay.get(dateKey) || [];
            existing.push(post);
            postsByDay.set(dateKey, existing);
        }

        // Check 2: Daily limits
        const dailyViolations: DailyLimitViolation[] = [];
        for (const [dateKey, dayPosts] of postsByDay) {
            const date = new Date(dateKey);
            const existingCount = await this.countPostsForDay(userId, date);
            const totalCount = existingCount + dayPosts.length;

            if (totalCount > RATE_LIMITS.MAX_POSTS_PER_DAY) {
                dailyViolations.push({
                    date: dateKey,
                    existingCount,
                    newCount: dayPosts.length,
                    totalCount,
                    maxAllowed: RATE_LIMITS.MAX_POSTS_PER_DAY,
                });
            }
        }

        if (dailyViolations.length > 0) {
            violations.dailyLimits = dailyViolations;
        }

        // Check 3: Weekly limits
        // Group posts by week and check each week
        const postsByWeek = new Map<string, BulkImportPost[]>();
        for (const post of posts) {
            const weekStart = this.getWeekStart(post.scheduledAt);
            const weekKey = this.formatDate(weekStart);
            const existing = postsByWeek.get(weekKey) || [];
            existing.push(post);
            postsByWeek.set(weekKey, existing);
        }

        for (const [weekKey, weekPosts] of postsByWeek) {
            const weekStart = new Date(weekKey);
            const existingCount = await this.countPostsForWeek(userId, weekStart);
            const totalCount = existingCount + weekPosts.length;

            if (totalCount > RATE_LIMITS.MAX_POSTS_PER_WEEK) {
                violations.weeklyLimit = {
                    weekStart: weekKey,
                    existingCount,
                    newCount: weekPosts.length,
                    totalCount,
                    maxAllowed: RATE_LIMITS.MAX_POSTS_PER_WEEK,
                };
                break; // Only report first weekly violation
            }
        }

        return {
            valid: Object.keys(violations).length === 0,
            violations,
        };
    }
}
