import { Hono } from "hono";
import { Bindings } from "./types";
import { postTweet } from "./controllers/twitter";

const app = new Hono<{
  Bindings: Bindings;
}>();

app.post("/tweet", postTweet);

const routes = app.get("/", (c) => {
  return c.json({
    message: "Hello from shared API!",
  });
});

export type AppType = typeof routes;
export default app;
