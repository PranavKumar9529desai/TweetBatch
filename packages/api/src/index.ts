import { Hono } from "hono";
import { Bindings, Variables } from "./types";
import { notificationsRoute } from "./controllers/notifications.controller";
import { postsRoute } from "./controllers/posts.controller";
import { analyticsRoute } from "./controllers/analytics.controller";
import { qstashWebhookRoute } from "./controllers/qstash-webhook.controller";
import { authMiddleware } from "./middleware/auth";

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// Protected routes middleware - apply before mounting routes
app.use("/posts/*", authMiddleware);
app.use("/notifications/*", authMiddleware);
app.use("/analytics/*", authMiddleware);
app.use("/tweet", authMiddleware);

const routes = app
  .route("/qstash", qstashWebhookRoute)
  .route("/posts", postsRoute)
  .route("/notifications", notificationsRoute)
  .route("/analytics", analyticsRoute);

// Export types and services
export * from "./types";
export * from "./services/twitter.service";
export * from "./services/qstash.service";
export * from "./services/scheduled-post.service";
export * from "./services/rate-limit.service";
export * from "./controllers/qstash-webhook.controller";
export * from "./controllers/bulk-import.controller";
export * from "./controllers/posts.controller";
export * from "./controllers/notifications.controller";
export * from "./controllers/analytics.controller";
export * from "./services/notification.service";
export * from "./services/analytics.service";
export * from "./cron/sync-cron";

export type AppType = typeof routes;
export default routes;

