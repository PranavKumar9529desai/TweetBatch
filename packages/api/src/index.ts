import { Hono } from 'hono'

const app = new Hono()

const routes = app.get('/', (c) => {
    return c.json({
        message: 'Hello from shared API!'
    })
})

export type AppType = typeof routes
export default app
