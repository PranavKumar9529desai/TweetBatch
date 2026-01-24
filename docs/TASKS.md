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

- [ ] Create `scheduled_post` table migration
  - [ ] Add all required columns (id, userId, content, scheduledAt, status, etc.)
  - [ ] Add QStash tracking fields (syncedToQStash, qstashMessageId)
  - [ ] Add result fields (tweetId, errorMessage, retryCount)
  - [ ] Create necessary indexes
- [ ] Export schema and relations from `@repo/db`
- [ ] Run migration on development database

---

## Phase 2: QStash Setup

- [ ] Create Upstash account and QStash instance
- [ ] Add environment variables
  - [ ] `QSTASH_TOKEN`
  - [ ] `QSTASH_CURRENT_SIGNING_KEY`
  - [ ] `QSTASH_NEXT_SIGNING_KEY`
- [ ] Install `@upstash/qstash` package
- [ ] Create QStash client utility in `packages/api`

---

## Phase 3: Core Scheduling Logic

- [ ] Create QStash service (`packages/api/src/services/qstash.ts`)
  - [ ] `pushToQStash(post)` - Push single post with delay
  - [ ] `pushBatchToQStash(posts)` - Chunked batch push with rate limiting
  - [ ] `cancelQStashMessage(messageId)` - Cancel scheduled message
- [ ] Create scheduled post service (`packages/api/src/services/scheduled-post.ts`)
  - [ ] `createScheduledPost(userId, content, scheduledAt)`
  - [ ] `getScheduledPosts(userId, filters)`
  - [ ] `updateScheduledPost(postId, updates)`
  - [ ] `cancelScheduledPost(postId)`
  - [ ] `deleteScheduledPost(postId)`

---

## Phase 4: Cron Jobs (4-Window Strategy)

- [ ] Configure Cloudflare Cron Triggers in `wrangler.toml`
  - [ ] 12:00 AM IST - Sync posts for 00:00-06:00
  - [ ] 6:00 AM IST - Sync posts for 06:00-12:00
  - [ ] 12:00 PM IST - Sync posts for 12:00-18:00
  - [ ] 6:00 PM IST - Sync posts for 18:00-00:00
- [ ] Implement cron handler in backend
  - [ ] Query unsynced posts for time window
  - [ ] Chunked push to QStash (100 at a time, 500ms delay)
  - [ ] Update `syncedToQStash` flag
  - [ ] Error handling and logging
- [ ] Implement recovery cron (30 min after each main cron)
  - [ ] Find missed posts
  - [ ] Mark as failed and notify users

---

## Phase 5: QStash Webhook Endpoint

- [ ] Create `/api/qstash/post-tweet` endpoint
  - [ ] Signature verification (security)
  - [ ] Fetch post from database by postId
  - [ ] Status checks (skip if cancelled/posted/deleted)
  - [ ] Call `TwitterService.postTweet()`
  - [ ] Update post status on success
  - [ ] Handle errors (recoverable vs permanent)
  - [ ] Return appropriate status codes for QStash retry logic

---

## Phase 6: Failure Handling

- [ ] Implement error classification logic
  - [ ] `isRecoverableError(error)` function
  - [ ] Handle 401 (refresh token)
  - [ ] Handle 403 (account revoked)
  - [ ] Handle 429 (rate limited)
  - [ ] Handle 5xx (Twitter down)
- [ ] Update post status on failure
  - [ ] Set `status = 'failed'`
  - [ ] Store `errorMessage`
  - [ ] Increment `retryCount`
  - [ ] Set `failedAt` timestamp
- [ ] Handle permanently disconnected accounts
  - [ ] Mark account as disconnected
  - [ ] Cancel all pending posts for user
  - [ ] Queue user notification

---

## Phase 7: Bulk Import Feature

- [ ] Create JSON schema for bulk import
- [ ] Create `/api/posts/bulk-import` endpoint
  - [ ] Parse and validate JSON
  - [ ] Validate all scheduled times are in future
  - [ ] Check for duplicates (content + time hash)
  - [ ] Batch insert to database
  - [ ] Return import summary (success/skipped/errors)
- [ ] Add rate limit validation
  - [ ] Warn if import exceeds Twitter daily limits
  - [ ] Suggest spreading posts across days

---

## Phase 8: API Endpoints (CRUD)

- [ ] `POST /api/posts` - Create single scheduled post
- [ ] `GET /api/posts` - List user's scheduled posts (with filters)
- [ ] `GET /api/posts/:id` - Get single post details
- [ ] `PATCH /api/posts/:id` - Update post content/time
  - [ ] If already synced to QStash, cancel old message
  - [ ] Re-sync with new time
- [ ] `DELETE /api/posts/:id` - Cancel/delete post
  - [ ] If synced to QStash, cancel message

---

## Phase 9: User Notifications

- [ ] Design notification system
  - [ ] In-app notifications table
  - [ ] Email integration (optional)
- [ ] Implement notification triggers
  - [ ] On permanent failure
  - [ ] On account disconnection
  - [ ] On successful post (optional)
- [ ] Create notification templates

---

## Phase 10: Frontend Integration

- [ ] Scheduler UI components
  - [ ] Date/time picker for scheduling
  - [ ] Content editor with character count
  - [ ] Preview component
- [ ] Scheduled posts list view
  - [ ] Filter by status
  - [ ] Sort by scheduled time
  - [ ] Bulk actions
- [ ] Bulk import UI
  - [ ] JSON file upload
  - [ ] Preview before import
  - [ ] Import results display
- [ ] Post status indicators
  - [ ] Pending, Queued, Posted, Failed, Cancelled

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
| Phase 3: Core Logic | ⬜ Not Started | |
| Phase 4: Cron Jobs | ⬜ Not Started | |
| Phase 5: Webhook | ⬜ Not Started | |
| Phase 6: Failure Handling | ⬜ Not Started | |
| Phase 7: Bulk Import | ⬜ Not Started | |
| Phase 8: API Endpoints | ⬜ Not Started | |
| Phase 9: Notifications | ⬜ Not Started | |
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
