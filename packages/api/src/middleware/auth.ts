import { Context, Next } from "hono";
import { getAuth } from "@repo/auth";
import { Bindings, Variables } from "../types";

export const authMiddleware = async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    const auth = getAuth(c.env);
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (!session) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", session.user);
    c.set("session", session.session);
    await next();
};
