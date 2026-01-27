import { createDb, scheduledPost, eq, and, sql, gte, lte } from "@repo/db";

type DbClient = ReturnType<typeof createDb>;

export class AnalyticsService {
    private db: DbClient;

    constructor(db: DbClient) {
        this.db = db;
    }

    async getDashboardStats(userId: string) {
        const stats = await this.db
            .select({
                status: scheduledPost.status,
                count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(scheduledPost)
            .where(eq(scheduledPost.userId, userId))
            .groupBy(scheduledPost.status);

        return stats;
    }

    async getActivityHistory(userId: string, days: number = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const history = await this.db
            .select({
                date: sql<string>`DATE(${scheduledPost.scheduledAt})`.as('date'),
                status: scheduledPost.status,
                count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(scheduledPost)
            .where(
                and(
                    eq(scheduledPost.userId, userId),
                    gte(scheduledPost.scheduledAt, startDate)
                )
            )
            .groupBy(sql`DATE(${scheduledPost.scheduledAt})`, scheduledPost.status)
            .orderBy(sql`date`);

        return history;
    }

    async getPostingDistribution(userId: string) {
        // Returns data for the heatmap: Day of week and Hour of day
        const distribution = await this.db
            .select({
                dayOfWeek: sql<number>`EXTRACT(DOW FROM ${scheduledPost.scheduledAt})`.mapWith(Number),
                hourOfDay: sql<number>`EXTRACT(HOUR FROM ${scheduledPost.scheduledAt})`.mapWith(Number),
                count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(scheduledPost)
            .where(eq(scheduledPost.userId, userId))
            .groupBy(
                sql`EXTRACT(DOW FROM ${scheduledPost.scheduledAt})`,
                sql`EXTRACT(HOUR FROM ${scheduledPost.scheduledAt})`
            );

        return distribution;
    }
}
