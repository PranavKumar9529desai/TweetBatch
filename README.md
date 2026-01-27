# Twitter Bulk Scheduler (Serverless)

**Live Demo:** [https://tweetbatch-frontend.fullstackwebdeveloper123.workers.dev](https://tweetbatch-frontend.fullstackwebdeveloper123.workers.dev)

A high-performance, serverless application for scheduling tweets, built on the Cloudflare ecosystem.

## ⚡ Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Runtime** | Cloudflare Workers | Serverless execution environment (Bun/Node compat) |
| **Language** | TypeScript | Type-safe development |
| **Framework** | Hono | Lightweight, ultrafast web framework |
| **Database** | Neon | Serverless Postgres with HTTP pooling |
| **ORM** | Drizzle | TypeScript ORM for type-safe queries |
| **Scheduler** | Upstash QStash | Serverless messaging and scheduling |

## 🏗️ Architecture Highlights

### Database Strategy
We use `@neondatabase/serverless` (HTTP driver) instead of standard TCP connections.
- **Why?** To support connection pooling and handle concurrency spikes typical in serverless environments.
- **Transactions:** We prefer `db.batch()` for non-interactive multiple writes.

### Deployment
- **Target:** Cloudflare Workers
- **Region:** Optimized for `ap-south-1` (Mumbai) via Smart Placement
- **Config:** Managed via `wrangler.toml`

## 🛠️ Development

This project uses **Bun** as the primary package manager.

### Prerequisites
- [Bun](https://bun.sh/) installed

### Commands

```bash
# Install dependencies
bun install

# Internal development options
bun run dev                  # Start local dev server
bun run drizzle-kit generate # Generate DB migrations
bun run deploy               # Deploy to Cloudflare Workers
```

## 🎨 UI & Styling

- **Component Library:** Custom integration of [shadcn/ui](https://ui.shadcn.com/) located in `@repo/ui`.
- **Styling:** Tailwind CSS using defined color variables in `packages/ui`.
- **Conventions:** `PascalCase` for components, `kebab-case` for files.

## 📝 Coding Standards

- **Variables:** Prefer `const` over `let`.
- **Async:** Use `async/await` for all DB and network calls.
- **Networking:** Use `fetch` API; avoid Node.js native `fs` or `child_process`.
