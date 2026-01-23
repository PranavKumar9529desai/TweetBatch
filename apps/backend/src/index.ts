import { Hono } from 'hono'
import { getAuth } from '@repo/auth'

const app = new Hono<{
    Bindings: {
        DATABASE_URL: string;
        BETTER_AUTH_SECRET: string;
        BETTER_AUTH_URL: string;
        TWITTER_CLIENT_ID: string;
        TWITTER_CLIENT_SECRET: string;
    }
}>()

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
