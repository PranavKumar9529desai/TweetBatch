import { Hono } from 'hono'
import { auth } from '@repo/auth'

const app = new Hono()

// Mount Better Auth handler
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw))

const routes = app.get('/', (c) => {
    return c.json({
        message: 'Hello from shared API!'
    })
})


export type AppType = typeof routes
export default app
