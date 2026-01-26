# AI Coding Agent Instructions for Twitter Scheduler

## Project Overview
Twitter Scheduler is a serverless Twitter bulk posting application. It uses a **4-window cron strategy** to sync scheduled tweets from Postgres to Upstash QStash, which then delivers them to Twitter API at their scheduled times.

**Tech Stack:** Bun (package manager), TypeScript, Hono (web framework), Drizzle ORM, Cloudflare Workers, Neon Postgres, Upstash QStash, Better-Auth, Vite + React + TanStack Router (frontend), shadcn/ui components.

## Architecture: Data Flow & Key Systems

### Data Flow
1. **User Action** → Scheduled posts created in React frontend
2. **DB Sync** → 4 crons (12am, 6am, 12pm, 6pm UTC) fetch posts from DB in 6-hour windows
3. **QStash Sync** → Posts pushed to QStash with `delay` calculated as `(scheduledAt - now)`
4. **QStash Webhook** → At scheduled time, QStash calls `/api/qstash/post-tweet` endpoint
5. **Twitter API** → Authenticated request posts tweet; status updated in DB
6. **Failure Recovery** → Recovery cron runs every 30min to catch missed/failed posts

### Critical Package Boundaries
- **`packages/api`** — Shared API logic: Controllers, services, routes (exported to backend)
- **`packages/db`** — Database schema (Drizzle) and migrations
- **`packages/auth`** — Better-Auth configuration and helpers
- **`packages/ui`** — shadcn/ui component exports + CSS globals
- **`apps/backend`** — Cloudflare Worker entry point; mounts `@repo/api`
- **`apps/frontend`** — Vite React app with TanStack Router; talks to `/api/*` endpoints

### Service Architecture
- **ScheduledPostService** — CRUD for scheduled_post table; manages status transitions
- **QStashService** — Client wrapper; sends messages to QStash with signature verification
- **TwitterService** — Handles OAuth2 token refresh and tweet posting
- **AccountService** — Manages user Twitter account connections + disconnection tracking
- **NotificationService** — Sends user notifications (in-app, email if added)

## Critical Rules & Constraints

### Database
- **MUST use** `@neondatabase/serverless` + `drizzle-orm/neon-http` (HTTP pooling required for QStash concurrency)
- **NEVER use** `drizzle-orm/postgres-js` or standard `pg` driver
- **Avoid** `db.transaction()` interactive blocks; use `db.batch()` for multi-write operations
- Schema in [packages/db/src/schema.ts](packages/db/src/schema.ts)

### Cloudflare Workers & Environment
- Access env vars via Hono context (`c.env`), NOT `process.env`
- No Node.js native APIs: No `fs`, `child_process`; use `fetch` for all network calls
- Deployment target: Cloudflare Workers (ap-south-1 region via Smart Placement)
- Cron jobs defined in [apps/backend/wrangler.jsonc](apps/backend/wrangler.jsonc)

### Naming Conventions
- **File names:** kebab-case (e.g., `scheduled-post.service.ts`, `qstash-webhook.controller.ts`)
- **Component names:** PascalCase inside files (e.g., `export function TweetEditor()`)

### Package Management
- **ALWAYS use `bun`** for package install, `bun run <script>`, and local development
- **NEVER use** npm, yarn, or pnpm

## Build & Development Commands

```bash
# Root workspace
bun run dev          # Run all dev servers
bun run build        # Build all packages
bun run lint         # Lint all code
bun run check-types  # Type check

# Database
bun run drizzle-kit generate  # Create new migration from schema changes
bun run drizzle-kit migrate   # Apply pending migrations

# Cloudflare (from apps/backend)
wrangler dev         # Local dev worker
wrangler deploy      # Deploy worker
```

## Authentication Flow
- Better-Auth handles OAuth + session management
- Auth middleware ([packages/api/src/middleware/auth.ts](packages/api/src/middleware/auth.ts)) verifies session on protected routes
- User & session objects stored in Hono context via `c.get("user")`, `c.get("session")`
- Frontend: `useAuth()` hook (from `@repo/auth`) reads from `/api/auth/*`

## Common Development Patterns

### Adding a New API Endpoint
1. Create controller in `packages/api/src/controllers/{resource}.controller.ts`
2. Use Hono routing with Bindings type
3. Protect with `app.use("/{route}/*", authMiddleware)` for protected endpoints
4. Export route from `packages/api/src/index.ts`
5. Backend mounts via `app.route("/api", api)` in [apps/backend/src/index.ts](apps/backend/src/index.ts)

### Scheduling a Post
1. Create record in `scheduled_post` table with status='pending'
2. Cron triggers → queries pending posts in time window
3. Push to QStash via `QStashService.pushPost(postId, delaySeconds)`
4. QStash sends signed webhook to `/api/qstash/post-tweet` at delivery time

### Handling Twitter API Errors
- Use `classifyTwitterError()` to categorize failures (rate limit, invalid token, etc.)
- **Disconnected tokens:** Set `account.disconnectedAt` + `disconnectedReason` for re-auth flow
- Retries managed by QStash (max 5 attempts before DLQ)

## File Organization Examples
- Service files: `src/services/{resource}.service.ts`
- Controllers: `src/controllers/{resource}.controller.ts`
- Middleware: `src/middleware/{concern}.ts`
- Routes: `src/routes/{resource}.ts` (optional if small)
- React components: `src/components/{feature}/{component-name}.tsx`
- Page routes: `src/routes/{path}/index.tsx` (TanStack Router)

## Important Files to Reference
- Global env config: [turbo.json](turbo.json) (lists required env vars)
- Database schema: [packages/db/src/schema.ts](packages/db/src/schema.ts)
- QStash webhook: [packages/api/src/controllers/qstash-webhook.controller.ts](packages/api/src/controllers/qstash-webhook.controller.ts)
- Cron sync logic: [packages/api/src/cron/sync-cron.ts](packages/api/src/cron/sync-cron.ts)
- Backend entry: [apps/backend/src/index.ts](apps/backend/src/index.ts)
- Frontend routes: [apps/frontend/src/routes/](apps/frontend/src/routes/)
- UI components: [packages/ui/src/components/](packages/ui/src/components/) (shadcn exports)
