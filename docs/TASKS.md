# QStash Bulk Scheduler - Implementation Tasks

> Master task list for building the Twitter bulk scheduling system.
> Reference: [QSTASH_ARCHITECTURE.md](./QSTASH_ARCHITECTURE.md)

---

## Project Context

**Goal**: Build a bulk tweet scheduler that allows users to schedule tweets (individually or via JSON import) and have them automatically posted at the scheduled time using QStash.

**Tech Stack**:
- Backend: Cloudflare Workers (Hono)
- Database: PostgreSQL with Drizzle ORM
- Auth: Better Auth with Twitter OAuth
- Scheduler: Upstash QStash
- Existing: `TwitterService` for posting tweets with token refresh

---

## Phase 1: Database & Schema

- [x] Create `scheduled_post` table migration
  - [x] Add all required columns (id, userId, content, scheduledAt, status, etc.)
  - [x] Add QStash tracking fields (syncedToQStash, qstashMessageId)
  - [x] Add result fields (tweetId, errorMessage, retryCount)
  - [x] Create necessary indexes
- [x] Export schema and relations from `@repo/db`
- [x] Run migration on development database

---

## Phase 2: QStash Setup

- [x] Create Upstash account and QStash instance
- [x] Add environment variables
  - [x] `QSTASH_TOKEN`
  - [x] `QSTASH_CURRENT_SIGNING_KEY`
  - [x] `QSTASH_NEXT_SIGNING_KEY`
- [x] Install `@upstash/qstash` package
- [x] Create QStash client utility in `packages/api`

---

## Phase 3: Core Scheduling Logic

- [x] Create QStash service (`packages/api/src/services/qstash.ts`)
  - [x] `pushToQStash(post)` - Push single post with delay
  - [x] `pushBatchToQStash(posts)` - Chunked batch push with rate limiting
  - [x] `cancelQStashMessage(messageId)` - Cancel scheduled message
- [x] Create scheduled post service (`packages/api/src/services/scheduled-post.ts`)
  - [x] `createScheduledPost(userId, content, scheduledAt)`
  - [x] `getScheduledPosts(userId, filters)`
  - [x] `updateScheduledPost(postId, updates)`
  - [x] `cancelScheduledPost(postId)`
  - [x] `deleteScheduledPost(postId)`

---

## Phase 4: Cron Jobs (4-Window Strategy)

- [x] Configure Cloudflare Cron Triggers in `wrangler.jsonc`
  - [x] 12:00 AM IST - Sync posts for 00:00-06:00
  - [x] 6:00 AM IST - Sync posts for 06:00-12:00
  - [x] 12:00 PM IST - Sync posts for 12:00-18:00
  - [x] 6:00 PM IST - Sync posts for 18:00-00:00
- [x] Implement cron handler in backend
  - [x] Query unsynced posts for time window
  - [x] Chunked push to QStash (100 at a time, 500ms delay)
  - [x] Update `syncedToQStash` flag
  - [x] Error handling and logging
- [x] Implement recovery cron (30 min after each main cron)
  - [x] Find missed posts
  - [x] Mark as failed and notify users

---

## Phase 5: QStash Webhook Endpoint

- [x] Create `/api/qstash/post-tweet` endpoint
  - [x] Signature verification (security)
  - [x] Fetch post from database by postId
  - [x] Status checks (skip if cancelled/posted/deleted)
  - [x] Call `TwitterService.postTweet()`
  - [x] Update post status on success
  - [x] Handle errors (recoverable vs permanent)
  - [x] Return appropriate status codes for QStash retry logic

---

## Phase 6: Failure Handling

- [x] Implement error classification logic
  - [x] `classifyTwitterError(error)` function in `error-handler.ts`
  - [x] Handle 401 (auth expired after refresh attempt)
  - [x] Handle 403 (account revoked/suspended)
  - [x] Handle 429 (rate limited)
  - [x] Handle 5xx (Twitter server down)
  - [x] Handle network errors (timeout, ECONNRESET)
  - [x] Handle duplicate tweet errors
  - [x] Handle invalid content (400)
- [x] Update post status on failure
  - [x] Set `status = 'failed'`
  - [x] Store `errorMessage`
  - [x] Increment `retryCount`
  - [x] Set `failedAt` timestamp
- [x] Handle permanently disconnected accounts
  - [x] Add `disconnectedAt`/`disconnectedReason` to account schema
  - [x] Mark account as disconnected via `AccountService`
  - [x] Cancel all pending posts for user
  - [x] Cancel all queued posts and their QStash messages
  - [ ] Queue user notification (deferred to Phase 9)

---

## Phase 7: Bulk Import Feature

- [x] Create rate limit service (`packages/api/src/services/rate-limit.ts`)
  - [x] Define rate limit constants (3/day, 20/week, 50/import)
  - [x] `countPostsForDay(userId, date)` - Count posts for a day
  - [x] `countPostsForWeek(userId, weekStart)` - Count posts for a week
  - [x] `validateBulkImportLimits(userId, posts)` - Check all limits
- [x] Add bulk creation method to `ScheduledPostService`
  - [x] `createScheduledPosts(inputs)` - Batch insert posts
- [x] Create `/api/posts/bulk-import` endpoint
  - [x] Parse and validate JSON structure
  - [x] Validate tweet content (max 280 chars)
  - [x] Validate all scheduled times are in future
  - [x] Enforce rate limits with clear error messages
  - [x] Batch insert valid posts
  - [x] Return import summary with violations
- [x] Export and integrate route in backend

---

## Phase 8: API Endpoints (CRUD)

- [x] `POST /api/posts` - Create single scheduled post
- [x] `GET /api/posts` - List user's scheduled posts (with filters)
- [x] `GET /api/posts/:id` - Get single post details
- [x] `PATCH /api/posts/:id` - Update post content/time
  - [x] If already synced to QStash, cancel old message
  - [x] Re-sync with new time
- [x] `DELETE /api/posts/:id` - Cancel/delete post
  - [x] If synced to QStash, cancel message

---

## Phase 9: User Notifications

- [x] Design notification system
  - [x] In-app notifications table
  - [ ] Email integration **(Deferred to Phase 9.5)**
- [x] Implement notification triggers
  - [x] On permanent failure
  - [x] On account disconnection
  - [x] On successful post (optional)
- [x] Create notification templates

---

## Phase 10: Frontend Integration

- [x] Scheduler UI components
  - [x] Date/time picker for scheduling
  - [x] Content editor with character count
  - [x] Preview component
- [/] Scheduled posts list view
  - [ ] Filter by status
  - [ ] Sort by scheduled time
  - [ ] Bulk actions
- [ ] Bulk import UI
  - [ ] JSON file upload
  - [ ] Preview before import
  - [ ] Import results display
- [x] Post status indicators
  - [x] Pending, Queued, Posted, Failed, Cancelled

---

## Phase 11: Testing & Verification

- [ ] Unit tests for services
  - [ ] QStash service
  - [ ] Scheduled post service
  - [ ] Error classification
- [ ] Integration tests
  - [ ] Cron job simulation
  - [ ] Webhook endpoint
  - [ ] Full flow: create → sync → post
- [ ] Manual testing
  - [ ] Create single post, verify posting
  - [ ] Bulk import, verify batch processing
  - [ ] Token expiry, verify refresh
  - [ ] Cancel post, verify no posting

---

## Phase 12: Monitoring & Observability

- [ ] Add logging throughout the flow
- [ ] Set up Cloudflare analytics
- [ ] Create admin dashboard (optional)
  - [ ] View all scheduled posts
  - [ ] DLQ viewer
  - [ ] Cron job status
- [ ] Configure alerts
  - [ ] Cron failure
  - [ ] High failure rate
  - [ ] DLQ depth

---

## Current Progress

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Database | ✅ Complete | `scheduled_post` table created |
| Phase 2: QStash Setup | ✅ Complete | Client + service created |
| Phase 3: Core Logic | ✅ Complete | QStash + ScheduledPost services |
| Phase 4: Cron Jobs | ✅ Complete | 4-window sync + recovery cron |
| Phase 5: Webhook | ✅ Complete | Signature verification + error handling |
| Phase 6: Failure Handling | ✅ Complete | Error classification + account disconnection |
| Phase 7: Bulk Import | ✅ Complete | Rate limits: 3/day, 20/week, 50/import |
| Phase 8: API Endpoints | ✅ Complete | CRUD endpoints created & verified |
| Phase 9: Notifications | ✅ Complete | In-app system implemented (Email deferred) |
| Phase 10: Frontend | ⬜ Not Started | |
| Phase 11: Testing | ⬜ Not Started | |
| Phase 12: Monitoring | ⬜ Not Started | |

---

## Dependencies

```
Phase 1 (Database) 
    ↓
Phase 2 (QStash Setup)
    ↓
Phase 3 (Core Logic) ← Depends on 1 & 2
    ↓
Phase 4 (Cron) ─────┬─── Phase 5 (Webhook)
                    │
                    ↓
              Phase 6 (Failure Handling)
                    ↓
Phase 7 (Bulk Import) ← Can start after Phase 3
Phase 8 (API) ← Can start after Phase 3
                    ↓
              Phase 9 (Notifications)
                    ↓
              Phase 10 (Frontend)
                    ↓
              Phase 11 & 12 (Testing & Monitoring)
```

---

## Quick Reference

### Key Files (to be created)
- `packages/db/src/schema/scheduled-post.ts` - Schema
- `packages/api/src/services/qstash.ts` - QStash client
- `packages/api/src/services/scheduled-post.ts` - Business logic
- `apps/backend/src/routes/posts.ts` - API routes
- `apps/backend/src/routes/qstash-webhook.ts` - Webhook handler
- `apps/backend/src/cron/sync-to-qstash.ts` - Cron handler

### Key Environment Variables
```
QSTASH_TOKEN=
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=
BACKEND_URL=
```
