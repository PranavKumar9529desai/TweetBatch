import { Hono } from "hono";
import { Bindings } from "./types";
import { postTweet } from "./controllers/twitter";

const app = new Hono<{
  Bindings: Bindings;
}>();

app.post("/tweet", postTweet);

const routes = app.get("/dev-worker/hello", (c) => {
  return c.json({
    message: "Hello from shared API!",
  });
});

// Export types and services
export * from "./types";
export * from "./services/twitter";
export * from "./services/qstash";
export * from "./services/scheduled-post";
export * from "./services/rate-limit";
export * from "./routes/qstash-webhook";
export * from "./routes/bulk-import";
export * from "./cron/sync-cron";

export type AppType = typeof routes;
export default app;

