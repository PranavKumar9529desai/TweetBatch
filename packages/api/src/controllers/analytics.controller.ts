import { Hono } from "hono";
import { createDb } from "@repo/db";
import { AnalyticsService } from "../services/analytics.service";
import type { Bindings, Variables } from "../types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

const getServices = (env: Bindings) => {
    const db = createDb(env.DATABASE_URL);
    const analyticsService = new AnalyticsService(db);
    return { analyticsService };
};

export const analyticsRoute = app
    .get("/dashboard", async (c) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ error: "Unauthorized" }, 401);
        }

        const { analyticsService } = getServices(c.env);

        const [stats, history, distribution] = await Promise.all([
            analyticsService.getDashboardStats(user.id),
            analyticsService.getActivityHistory(user.id),
            analyticsService.getPostingDistribution(user.id),
        ]);

        return c.json({
            success: true,
            data: {
                stats,
                history,
                distribution,
            }
        });
    });
