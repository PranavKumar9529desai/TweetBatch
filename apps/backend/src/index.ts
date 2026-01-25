import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getAuth } from '@repo/auth'
import { qstashWebhookRoute, bulkImportRoute, postsRoute, notificationsRoute, syncPostsToQStash } from '@repo/api'

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

// Handle auth requests
app.all("/api/auth/*", (c) => {
    return getAuth(c.env).handler(c.req.raw);
})

app.get('/', (c) => {
    return c.json({
        message: 'Hello from Backend!'
    })
})



// QStash webhook routes
app.route('/api/qstash', qstashWebhookRoute);

// Posts routes (bulk import, CRUD, etc.)
app.route('/api/posts', postsRoute);

// Notifications routes
app.route('/api/notifications', notificationsRoute);

export const handle = app.fetch

// Export for Cloudflare Workers with cron support
export default {
    fetch: app.fetch,
    async scheduled(event: ScheduledEvent, env: CloudflareBindings, ctx: ExecutionContext) {
        console.log(`Cron triggered at: ${new Date().toISOString()}`);
        ctx.waitUntil(syncPostsToQStash(env));
    }
}

