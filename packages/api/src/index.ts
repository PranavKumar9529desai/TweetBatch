import { Hono } from "hono";
import { Bindings, Variables } from "./types";
import { postTweet } from "./controllers/twitter.controller";
import { notificationsRoute } from "./controllers/notifications.controller";
import { postsRoute } from "./controllers/posts.controller";
import { qstashWebhookRoute } from "./controllers/qstash-webhook.controller";
import { authMiddleware } from "./middleware/auth";

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

app.use("/posts/*", authMiddleware);
app.use("/notifications/*", authMiddleware);
app.use("/tweet", authMiddleware);

const routes = app
  .route("/posts", postsRoute)
  .route("/notifications", notificationsRoute)
  .route("/webhooks/qstash", qstashWebhookRoute);

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
export * from "./services/notification.service";
export * from "./cron/sync-cron";

export type AppType = typeof routes;
export default app;

