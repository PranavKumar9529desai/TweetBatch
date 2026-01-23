import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getAuth } from '@repo/auth'

const app = new Hono<{
    Bindings: CloudflareBindings
}>()

console.log("Backend process starting...");

app.use('*', async (c, next) => {
    const corsMiddleware = cors({
        origin: c.env.FRONTEND_URL || "http://localhost:5173",
        allowHeaders: ["Content-Type", "Authorization", "Upgrade-Insecure-Requests"],
        allowMethods: ["POST", "GET", "OPTIONS"],
        exposeHeaders: ["Content-Length"],
        maxAge: 600,
        credentials: true,
    });
    return corsMiddleware(c, next);
});

// Root route
app.get('/', (c) => {
    return c.json({
        message: 'Hello from Backend!'
    })
})

// Handle auth requests
app.all("/api/auth/**", (c) => {
    console.log("Auth Request (API):", c.req.url, !!c.env.DATABASE_URL);
    return getAuth(c.env).handler(c.req.raw);
})
app.all("/auth/**", (c) => {
    console.log("Auth Request:", c.req.url, !!c.env.DATABASE_URL);
    return getAuth(c.env).handler(c.req.raw);
})

export const handle = app.fetch
export default app
