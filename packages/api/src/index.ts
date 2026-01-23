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

const routes = app.get('/', (c) => {
    return c.json({
        message: 'Hello from shared API!'
    })
})


export type AppType = typeof routes
export default app
