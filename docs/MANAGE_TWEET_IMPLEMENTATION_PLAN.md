# Manage Tweet (Kanban Calendar) Feature - Complete Todo List

**Status:** Planning Phase  
**Date Created:** January 27, 2026  
**Last Updated:** January 27, 2026  
**Feature:** Week-view calendar with drag-drop scheduling, search, and edit actions  

---

## Table of Contents

1. [Phase 1: Backend Foundation](#phase-1-backend-foundation-completed)
2. [Phase 2: Frontend Setup & Hooks](#phase-2-frontend-setup--hooks)
3. [Phase 3: Core UI Components](#phase-3-core-ui-components)
4. [Phase 4: Integration & State Management](#phase-4-integration--state-management)
5. [Phase 5: Polish & Edge Cases](#phase-5-polish--edge-cases)

---

## Phase 1: Backend Foundation ✅ COMPLETED

> All backend tasks completed and tested. API ready for frontend integration.

### ✅ 1.1 Create GET /api/posts/search Endpoint
- **Status:** ✅ COMPLETED
- **Description:** Fetch posts by date range with optional search filter
- **Files Modified:**
  - `packages/api/src/controllers/posts.controller.ts`
  - `packages/api/src/services/scheduled-post.service.ts`
- **Acceptance Criteria:**
  - ✅ Query posts from DB by userId, startDate, endDate
  - ✅ Support optional search param (substring match)
  - ✅ Validate ISO 8601 date format
  - ✅ Enforce max 90-day range
  - ✅ Return sorted array by scheduledAt
  - ✅ Protect with authentication

### ✅ 1.2 Create POST /api/posts/{id}/reschedule Endpoint
- **Status:** ✅ COMPLETED
- **Description:** Reschedule post to new time
- **Files Modified:**
  - `packages/api/src/controllers/posts.controller.ts`
  - `packages/api/src/services/scheduled-post.service.ts`
- **Acceptance Criteria:**
  - ✅ Validate scheduledAt >= now + 1 minute
  - ✅ Reject if status='posted'
  - ✅ Revert queued/failed → pending
  - ✅ Validate user ownership
  - ✅ Return updated post object

### ✅ 1.3 Create POST /api/posts/{id}/cancel Endpoint
- **Status:** ✅ COMPLETED
- **Description:** Soft delete post (set status='cancelled')
- **Files Modified:**
  - `packages/api/src/controllers/posts.controller.ts`
  - `packages/api/src/services/scheduled-post.service.ts`
- **Acceptance Criteria:**
  - ✅ Only allow pending/failed status
  - ✅ Reject if queued/posted
  - ✅ Soft delete (don't hard delete)
  - ✅ Validate user ownership

### ✅ 1.4 Update ScheduledPostService
- **Status:** ✅ COMPLETED
- **Description:** Add service layer methods
- **File:** `packages/api/src/services/scheduled-post.service.ts`
- **Methods Added:**
  - ✅ `getPostsByDateRange(userId, startDate, endDate, searchQuery?)`
  - ✅ `reschedulePost(postId, userId, newScheduledAt)`
  - ✅ `cancelPost(postId, userId)`
  - ✅ `getPostsByStatus(userId, status)`

### ✅ 1.5 Write Integration Tests
- **Status:** ✅ COMPLETED
- **File:** `packages/api/src/controllers/__tests__/posts.controller.test.ts`
- **Test Coverage:**
  - ✅ GET /api/posts/search returns posts in date range
  - ✅ GET /api/posts/search filters by search query
  - ✅ GET /api/posts/search rejects without auth
  - ✅ POST /api/posts/{id}/reschedule updates time
  - ✅ POST /api/posts/{id}/reschedule rejects if in past
  - ✅ POST /api/posts/{id}/reschedule rejects if posted
  - ✅ POST /api/posts/{id}/cancel soft-deletes
  - ✅ POST /api/posts/{id}/cancel rejects if queued
  - ✅ Authorization checks work

---

## Phase 2: Frontend Setup & Hooks

### 2.1 Create Calendar Context
- **Status:** ⏳ NOT STARTED
- **Description:** Manage local UI state for calendar
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/calendar-context.tsx`
- **State to Manage:**
  - `currentWeekStart: Date` - Start of displayed week
  - `searchQuery: string` - Search filter text
  - `draggedPostId: string | null` - Currently dragged tweet
  - `hoveredCell: { day: number; hour: number } | null` - Hover state
  - `selectedPost: ScheduledPost | null` - For detail modal
- **Acceptance Criteria:**
  - [ ] Context provider exports all state + setters
  - [ ] useCalendarContext hook available
  - [ ] No API calls (pure UI state)
  - [ ] Properly typed with TypeScript

### 2.2 Create useManageTweets Hook
- **Status:** ⏳ NOT STARTED
- **Description:** TanStack Query integration for tweet CRUD
- **File:** `apps/frontend/src/routes/dashboard/hooks/use-manage-tweets.ts`
- **Hook Interface:**
  - Query: `posts` - Array of posts for current week
  - Query: `isLoading` - Initial fetch loading state
  - Query: `isError` - Fetch error state
  - Mutation: `reschedulePost` - Reschedule mutation
  - Mutation: `cancelPost` - Cancel mutation
  - Mutation: `refetch` - Manually refetch posts
- **TanStack Query Setup:**
  - [ ] Create query key factory
  - [ ] Setup initial fetch by startDate/endDate
  - [ ] Implement reschedulePost mutation with optimistic update
  - [ ] Implement cancelPost mutation with optimistic update
  - [ ] Handle onMutate (optimistic), onSuccess, onError
  - [ ] Add refetch on error recovery
  - [ ] Return proper loading/error states
- **Acceptance Criteria:**
  - [ ] Posts fetched on mount
  - [ ] Mutation updates cache immediately (optimistic)
  - [ ] Error rollback works (revert if API fails)
  - [ ] Success toast shown on successful mutation
  - [ ] Error toast shown on failure
  - [ ] Proper TypeScript types throughout

### 2.3 Install & Configure dnd-kit
- **Status:** ⏳ NOT STARTED
- **Description:** Setup headless drag-drop library
- **Files:**
  - `apps/frontend/package.json` - Add @dnd-kit dependencies
  - `apps/frontend/src/routes/dashboard/components/manage-tweets/dnd-setup.ts` - Setup helpers
- **Packages to Install:**
  - [ ] `@dnd-kit/core`
  - [ ] `@dnd-kit/utilities`
  - [ ] `@dnd-kit/sortable`
  - [ ] `@dnd-kit/modifiers`
- **Acceptance Criteria:**
  - [ ] DndContext wrapper ready to use
  - [ ] DragOverlay component available
  - [ ] Sensor config (pointer + keyboard)
  - [ ] Helper utilities exported

---

## Phase 3: Core UI Components

### 3.1 Build Calendar Context Wrapper
- **Status:** ⏳ NOT STARTED
- **Description:** Provider component for calendar state
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/calendar-provider.tsx`
- **Implementation:**
  - [ ] Wrap with CalendarContextProvider
  - [ ] Wrap with DndContext
  - [ ] Wrap with TanStack Query provider (if not global)
  - [ ] Setup toast notifications
- **Acceptance Criteria:**
  - [ ] All children have access to context
  - [ ] No prop drilling
  - [ ] Proper TypeScript types

### 3.2 Build Calendar Grid Component
- **Status:** ⏳ NOT STARTED
- **Description:** 7×24 grid for week view
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/calendar-grid.tsx`
- **Layout:**
  - [ ] 8 columns: time (sticky left) + 7 days
  - [ ] 24 rows: 6am-12am (1-hour slots, or configurable)
  - [ ] Sticky header (day names + dates)
  - [ ] Sticky time column
  - [ ] Scrollable body
- **Styling:**
  - [ ] Grid cells: min-height 60px
  - [ ] Current time: visual indicator (horizontal line)
  - [ ] Dark theme from globals.css
  - [ ] Responsive grid gaps
- **Drop Zone Setup:**
  - [ ] Each cell = drop zone
  - [ ] Droppable setup with dnd-kit
  - [ ] Visual feedback on hover
- **Acceptance Criteria:**
  - [ ] Grid renders correctly
  - [ ] Proper time display (6am, 7am, etc.)
  - [ ] Current time highlighted
  - [ ] Theme consistent with app
  - [ ] Mobile scrollable

### 3.3 Build Calendar Cell Component
- **Status:** ⏳ NOT STARTED
- **Description:** Individual cell (1 day × 1 hour)
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/calendar-cell.tsx`
- **Features:**
  - [ ] Act as drop zone
  - [ ] Display tweet cards in cell
  - [ ] Show count badge if multiple tweets
  - [ ] Hover highlight effect
  - [ ] Handle drop event
- **Drop Behavior:**
  - [ ] Calculate target day/hour from cell ID
  - [ ] Call reschedulePost mutation on drop
  - [ ] Show loading state during mutation
- **Acceptance Criteria:**
  - [ ] Drop zone works with dnd-kit
  - [ ] Visual feedback on drag over
  - [ ] Post is rescheduled on drop
  - [ ] Error handled gracefully

### 3.4 Build Tweet Card Component
- **Status:** ⏳ NOT STARTED
- **Description:** Draggable tweet item
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/tweet-card.tsx`
- **Visual Design:**
  - [ ] Drag handle indicator
  - [ ] Tweet content (truncated ~100 chars)
  - [ ] Status badge (color-coded)
  - [ ] Three-dot menu button
  - [ ] Hover effects
- **Status Badges:**
  - [ ] pending = yellow/amber
  - [ ] queued = blue
  - [ ] posted = green
  - [ ] failed = red
  - [ ] cancelled = gray
- **Drag Behavior:**
  - [ ] Implement useDraggable from dnd-kit
  - [ ] Show drag overlay while dragging
  - [ ] Animate on drop
- **Acceptance Criteria:**
  - [ ] Draggable within dnd-kit context
  - [ ] Visual feedback while dragging
  - [ ] Status correctly displayed
  - [ ] Menu opens without dragging interference

### 3.5 Build Tweet Actions Menu
- **Status:** ⏳ NOT STARTED
- **Description:** Three-dot dropdown menu
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/tweet-actions-menu.tsx`
- **Menu Options:**
  - [ ] **Edit** → Navigate to `/dashboard/create?postId={id}`
    - Only enabled if status = pending
    - Disabled for posted/queued tweets
  - [ ] **Delete** → Open delete confirmation dialog
    - Only enabled if status = pending or failed
    - Disabled for posted/queued tweets
  - [ ] **Copy** (optional) → Copy content to clipboard
- **Implementation:**
  - [ ] Use shadcn/ui DropdownMenu
  - [ ] Conditional enable/disable based on status
  - [ ] Proper icon indicators
- **Acceptance Criteria:**
  - [ ] Menu opens/closes properly
  - [ ] Edit redirects to create page
  - [ ] Delete opens confirmation
  - [ ] Status-based disabling works
  - [ ] Icons clear and intuitive

### 3.6 Build Calendar Header Component
- **Status:** ⏳ NOT STARTED
- **Description:** Date range display, navigation, search
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/calendar-header.tsx`
- **Layout:**
  ```
  [← | Today | →]  Jan 26 – Feb 1, 2026    [Search...]
  ```
- **Components:**
  - [ ] Date range text display
  - [ ] Previous week button (← )
  - [ ] Today button (jump to current week)
  - [ ] Next week button (→ )
  - [ ] Search input (debounced 500ms)
- **Navigation Behavior:**
  - [ ] Clicking buttons updates currentWeekStart in context
  - [ ] Automatic refetch of posts for new date range
  - [ ] Calendar grid updates to show new week
- **Search Behavior:**
  - [ ] Debounce input changes
  - [ ] Filter posts in queue + calendar by content
  - [ ] Case-insensitive substring match
- **Acceptance Criteria:**
  - [ ] Navigation works smoothly
  - [ ] Date range displays correctly
  - [ ] Search filters in real-time
  - [ ] No lag on search input

### 3.7 Build Tweet Queue Sidebar
- **Status:** ⏳ NOT STARTED
- **Description:** Unscheduled tweets (drafts) list
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/tweet-queue-sidebar.tsx`
- **Features:**
  - [ ] Display unscheduled tweets (no scheduledAt)
  - [ ] Vertical scrollable list
  - [ ] Each item draggable to calendar
  - [ ] Content preview (truncated ~50 chars)
  - [ ] Filterable by search query
- **Visual Design:**
  - [ ] Sidebar container (20% width)
  - [ ] "Queue" or "Drafts" header
  - [ ] Item numbering (1, 2, 3, ...)
  - [ ] Subtle drag handle indicator
  - [ ] Hover effects
- **Drag Integration:**
  - [ ] Items are useDraggable
  - [ ] Can drag to calendar cells
  - [ ] Show drag overlay
- **Acceptance Criteria:**
  - [ ] Drafts load properly
  - [ ] Items draggable to calendar
  - [ ] Search filter works
  - [ ] Responsive on mobile
  - [ ] Empty state message shown

---

## Phase 4: Integration & State Management

### 4.1 Wire TanStack Query Optimistic Updates
- **Status:** ⏳ NOT STARTED
- **Description:** Implement full optimistic update flow
- **File:** `apps/frontend/src/routes/dashboard/hooks/use-manage-tweets.ts`
- **Reschedule Mutation:**
  - [ ] `onMutate` handler:
    - Cancel ongoing queries
    - Snapshot old data
    - Update cache optimistically
    - Return context for rollback
  - [ ] `onSuccess` handler:
    - Invalidate query to refetch
    - Show success toast
  - [ ] `onError` handler:
    - Rollback cache to previous data
    - Show error toast with message
- **Cancel Mutation:**
  - [ ] Similar pattern:
    - `onMutate`: Remove from cache
    - `onSuccess`: Confirm removal
    - `onError`: Restore to cache
- **Acceptance Criteria:**
  - [ ] UI updates instantly on mutation
  - [ ] Failed mutations rollback smoothly
  - [ ] No flash/flicker
  - [ ] Toast notifications appear correctly
  - [ ] Cache remains consistent

### 4.2 Integrate dnd-kit Drag-Drop
- **Status:** ⏳ NOT STARTED
- **Description:** Complete drag-drop flow with mutations
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/calendar-grid.tsx`
- **Setup:**
  - [ ] Wrap grid with DndContext
  - [ ] Define droppable zones (each calendar cell)
  - [ ] Configure sensors (pointer + keyboard)
  - [ ] Setup drag overlay
- **Handle Drop Event:**
  - [ ] Extract `active` (dragged item) and `over` (drop zone)
  - [ ] Calculate target day/hour from cell ID
  - [ ] Convert to scheduledAt timestamp
  - [ ] Call `reschedulePost` mutation
  - [ ] Show loading state during mutation
- **Validation:**
  - [ ] Prevent drops outside grid
  - [ ] Prevent drops in past
  - [ ] Disable if user not authenticated
- **Acceptance Criteria:**
  - [ ] Drag preview shows while dragging
  - [ ] Drop zones highlight on drag over
  - [ ] Post reschedules on drop
  - [ ] Loading state visible
  - [ ] Errors handled gracefully

### 4.3 Implement Search Filter Logic
- **Status:** ⏳ NOT STARTED
- **Description:** Debounced search with filtering
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/calendar-header.tsx` + hooks
- **Implementation:**
  - [ ] Create debounced search handler (500ms)
  - [ ] Update searchQuery in context
  - [ ] Filter posts array in useManageTweets
  - [ ] Display "No results" if empty
- **Filtering Logic:**
  - [ ] Case-insensitive substring match
  - [ ] Search in tweet content only
  - [ ] Apply to both queue and calendar
- **Performance:**
  - [ ] Debounce prevents excessive re-renders
  - [ ] Filter on client (already fetched)
  - [ ] No additional API calls
- **Acceptance Criteria:**
  - [ ] Search is responsive (no lag)
  - [ ] Results update in real-time
  - [ ] Debounce works (no spam)
  - [ ] Empty state clear

### 4.4 Connect to Page Route
- **Status:** ⏳ NOT STARTED
- **Description:** Create main manage-tweets page
- **File:** `apps/frontend/src/routes/dashboard/manage-tweets/index.tsx`
- **Layout:**
  ```
  <div className="flex h-screen">
    <TweetQueueSidebar />
    <div className="flex-1 flex flex-col">
      <CalendarHeader />
      <CalendarGrid />
    </div>
  </div>
  ```
- **Setup:**
  - [ ] Mount CalendarProvider
  - [ ] Setup useManageTweets hook
  - [ ] Initialize current week
  - [ ] Fetch initial posts
- **Page Props:**
  - [ ] Route: `/dashboard/manage-tweets`
  - [ ] Protected by auth middleware
  - [ ] Full-height layout
- **Acceptance Criteria:**
  - [ ] Page loads without errors
  - [ ] All components render
  - [ ] Data fetches on mount
  - [ ] Theme consistent
  - [ ] Layout responsive

### 4.5 Implement Week Navigation
- **Status:** ⏳ NOT STARTED
- **Description:** Navigate between weeks smoothly
- **File:** `apps/frontend/src/routes/dashboard/components/manage-tweets/calendar-header.tsx`
- **Button Behavior:**
  - [ ] **Prev Week (←):**
    - Subtract 7 days from currentWeekStart
    - Update context
    - Refetch posts for new range
  - [ ] **Today:**
    - Calculate current week's Monday
    - Set currentWeekStart
    - Refetch posts
  - [ ] **Next Week (→):**
    - Add 7 days to currentWeekStart
    - Update context
    - Refetch posts for new range
- **Date Display:**
  - [ ] Show "Jan 26 – Feb 1, 2026" format
  - [ ] Update as user navigates
- **Acceptance Criteria:**
  - [ ] Navigation buttons work
  - [ ] Calendar updates to correct week
  - [ ] Posts refetch automatically
  - [ ] No missing dates at boundaries

---

## Phase 5: Polish & Edge Cases

### 5.1 Add Error Handling & Validation
- **Status:** ⏳ NOT STARTED
- **Description:** Comprehensive error management
- **Files:**
  - `apps/frontend/src/routes/dashboard/hooks/use-manage-tweets.ts`
  - All components
- **Validations:**
  - [ ] Cannot schedule in past (frontend check)
  - [ ] Disable actions for posted tweets
  - [ ] Disable actions for queued tweets
  - [ ] Warn if editing/deleting active tweets
- **Error Toasts:**
  - [ ] "Cannot schedule in the past"
  - [ ] "Cannot modify posted tweets"
  - [ ] "Failed to reschedule. Please try again."
  - [ ] "Failed to delete. Please try again."
  - [ ] Network timeout errors
- **Retry Logic:**
  - [ ] Show retry button on failure
  - [ ] Retry mutation on retry click
- **Acceptance Criteria:**
  - [ ] All errors show clear messages
  - [ ] User cannot create invalid state
  - [ ] Retry works reliably
  - [ ] No silent failures

### 5.2 Add Loading States & Visual Feedback
- **Status:** ⏳ NOT STARTED
- **Description:** Visual indicators for async operations
- **Files:** All components
- **Initial Load:**
  - [ ] Spinner while fetching posts
  - [ ] Skeleton grid if available
  - [ ] "Loading calendar..." message
- **Mutation States:**
  - [ ] Card opacity 50% during reschedule
  - [ ] Button disabled during delete
  - [ ] Spinner in modal during save
- **Visual Effects:**
  - [ ] Hover effects on draggable cards
  - [ ] Drop zone highlight on drag over
  - [ ] Current time highlight (vertical line)
  - [ ] Status badge colors
  - [ ] Tweet card shadows/borders
- **Acceptance Criteria:**
  - [ ] Loading state shows immediately
  - [ ] No jarring transitions
  - [ ] User knows operation is pending
  - [ ] Improves perceived performance

### 5.3 Add Empty States & Guidance
- **Status:** ⏳ NOT STARTED
- **Description:** User-friendly empty state messages
- **Files:** Components
- **Empty Queue:**
  - [ ] Message: "No unscheduled tweets. Create one to get started."
  - [ ] Link to create page
- **Empty Calendar:**
  - [ ] Message: "No tweets scheduled for this week."
  - [ ] Hint: "Drag tweets from the left to schedule them"
- **No Search Results:**
  - [ ] Message: "No tweets match '{{query}}'"
  - [ ] Suggestion: "Try different keywords"
- **Acceptance Criteria:**
  - [ ] Messages clear and helpful
  - [ ] No confusing states
  - [ ] Users know what to do

### 5.4 Add Accessibility Support
- **Status:** ⏳ NOT STARTED
- **Description:** WCAG 2.1 AA compliance
- **Files:** All components
- **ARIA Labels:**
  - [ ] Draggable items: `role="button"` + `aria-description`
  - [ ] Drop zones: `aria-dropeffect="move"`
  - [ ] Status badges: `aria-label="{status}"`
  - [ ] Buttons: `aria-label` for icon-only buttons
- **Keyboard Navigation:**
  - [ ] Tab through draggable items
  - [ ] Enter to focus, Space to grab
  - [ ] Arrow keys to move within grid (optional)
  - [ ] Escape to cancel drag
- **Screen Reader:**
  - [ ] Announce post content
  - [ ] Announce status changes
  - [ ] Announce successful mutations
- **Testing:**
  - [ ] Test with screen reader (NVDA/JAWS)
  - [ ] Test keyboard nav
  - [ ] Axe DevTools audit
- **Acceptance Criteria:**
  - [ ] No accessibility violations
  - [ ] Keyboard navigation works
  - [ ] Screen reader compatible
  - [ ] WCAG AA compliant

### 5.5 Write End-to-End Tests
- **Status:** ⏳ NOT STARTED
- **Description:** Comprehensive E2E test coverage
- **File:** `apps/frontend/e2e/manage-tweets.spec.ts`
- **Test Scenarios:**
  - [ ] Load calendar → posts render
  - [ ] Search tweets → filter works
  - [ ] Drag tweet → reschedule succeeds
  - [ ] Reschedule to past → error shown
  - [ ] Click three-dot menu → options appear
  - [ ] Click edit → redirect to create page
  - [ ] Click delete → confirmation dialog
  - [ ] Confirm delete → post removed
  - [ ] Navigate weeks → posts update
  - [ ] Network fails → error toast, retry works
- **Test Framework:**
  - [ ] Use Playwright/Cypress
  - [ ] Test against test environment
  - [ ] Mock API if needed
- **Acceptance Criteria:**
  - [ ] All scenarios pass
  - [ ] No flaky tests
  - [ ] Good coverage (>80%)
  - [ ] Tests run in CI/CD

### 5.6 Add Timezone Support (Optional Phase 2)
- **Status:** ⏳ NOT STARTED
- **Description:** Display calendar in user's timezone
- **Files:**
  - Database schema: Add `user.timezone` field
  - Calendar components: Convert UTC ↔ local
- **Implementation:**
  - [ ] Add migration: `ALTER TABLE user ADD COLUMN timezone`
  - [ ] Fetch user timezone on load
  - [ ] Convert scheduledAt (UTC) → local for display
  - [ ] Convert local input → UTC for API
  - [ ] Show timezone in header
- **Acceptance Criteria:**
  - [ ] Migration runs cleanly
  - [ ] Conversions accurate
  - [ ] No double-conversion bugs
  - [ ] Timezone displayed clearly
- **Note:** Defer to Phase 2 after MVP

---

## Summary Table

| # | Task | Phase | Status | Priority | Est. Time |
|---|------|-------|--------|----------|-----------|
| 1.1 | GET /api/posts/search | 1 | ✅ Done | Critical | - |
| 1.2 | POST /api/posts/{id}/reschedule | 1 | ✅ Done | Critical | - |
| 1.3 | POST /api/posts/{id}/cancel | 1 | ✅ Done | Critical | - |
| 1.4 | ScheduledPostService methods | 1 | ✅ Done | Critical | - |
| 1.5 | Backend tests | 1 | ✅ Done | Critical | - |
| 2.1 | Calendar Context | 2 | ⏳ TODO | High | 2h |
| 2.2 | useManageTweets hook | 2 | ⏳ TODO | High | 4h |
| 2.3 | dnd-kit setup | 2 | ⏳ TODO | High | 1h |
| 3.1 | Calendar Provider | 3 | ⏳ TODO | High | 1h |
| 3.2 | Calendar Grid | 3 | ⏳ TODO | High | 3h |
| 3.3 | Calendar Cell | 3 | ⏳ TODO | High | 2h |
| 3.4 | Tweet Card | 3 | ⏳ TODO | High | 2h |
| 3.5 | Tweet Actions Menu | 3 | ⏳ TODO | High | 1.5h |
| 3.6 | Calendar Header | 3 | ⏳ TODO | High | 2h |
| 3.7 | Tweet Queue Sidebar | 3 | ⏳ TODO | High | 2h |
| 4.1 | Query optimistic updates | 4 | ⏳ TODO | High | 3h |
| 4.2 | dnd-kit integration | 4 | ⏳ TODO | High | 3h |
| 4.3 | Search filter logic | 4 | ⏳ TODO | High | 2h |
| 4.4 | Connect page route | 4 | ⏳ TODO | High | 1h |
| 4.5 | Week navigation | 4 | ⏳ TODO | High | 1h |
| 5.1 | Error handling | 5 | ⏳ TODO | Medium | 2h |
| 5.2 | Loading states | 5 | ⏳ TODO | Medium | 2h |
| 5.3 | Empty states | 5 | ⏳ TODO | Medium | 1h |
| 5.4 | Accessibility | 5 | ⏳ TODO | Medium | 3h |
| 5.5 | E2E tests | 5 | ⏳ TODO | Medium | 4h |
| 5.6 | Timezone support | 5 | ⏳ TODO | Low | 3h |

---

## Implementation Notes & Constraints

### Architecture Decisions
- **Custom Grid vs Library:** Using custom Flexbox grid (not react-big-calendar) for full theme control
- **Headless Drag-Drop:** dnd-kit is headless (no styles) → full control, less conflicts
- **Query State:** TanStack Query handles all server state, Context for UI state only
- **Optimistic Updates:** All mutations update cache immediately for snappy UX
- **Soft Delete:** Posts set to `status='cancelled'`, not hard deleted (audit trail)

### File Structure
```
apps/frontend/src/routes/dashboard/
├── manage-tweets/
│   ├── index.tsx (main page)
│   └── components/
│       ├── calendar-context.tsx
│       ├── calendar-provider.tsx
│       ├── calendar-grid.tsx
│       ├── calendar-cell.tsx
│       ├── calendar-header.tsx
│       ├── tweet-card.tsx
│       ├── tweet-actions-menu.tsx
│       └── tweet-queue-sidebar.tsx
└── hooks/
    └── use-manage-tweets.ts
```

### Key Dependencies
- **TanStack Query:** Server state management + mutations
- **dnd-kit:** Headless drag-drop library
- **shadcn/ui:** Pre-built accessible components
- **React Context:** Local UI state
- **TanStack Router:** Already in use for routing

### Testing Strategy
1. **Unit:** Component snapshot tests (jest)
2. **Integration:** Hook tests (test-library)
3. **E2E:** Full user flows (Playwright/Cypress)
4. **Accessibility:** Axe DevTools + manual testing

### Known Limitations & Future Enhancements
- MVP: Week view only (month/year in Phase 2)
- MVP: No real-time polling (consider WebSocket later)
- MVP: No offline support (all operations online)
- MVP: No timezone per-tweet (user-level only in Phase 2)

---

## Success Criteria (MVP Complete)

✅ All Phase 1 backend tasks completed  
⏳ User can view scheduled tweets in week calendar  
⏳ User can drag tweets from queue to calendar cells  
⏳ User can reschedule existing tweets via drag  
⏳ User can search/filter tweets by content  
⏳ User can edit tweet via three-dot menu  
⏳ User can delete/cancel tweets  
⏳ Week navigation (prev/next/today) works  
⏳ Optimistic updates provide instant feedback  
⏳ Errors rollback UI to previous state  
⏳ Calendar theme matches rest of app  
⏳ Mobile responsive  
⏳ Accessible (WCAG AA)  

---

## Questions & Clarifications

- **Timezone:** Should calendar display in user's local timezone or UTC? → Defer to Phase 2
- **Time Slots:** 1-hour or 30-min granularity? → 1-hour for MVP
- **Bulk Actions:** Can user reschedule multiple tweets at once? → Not in MVP
- **Notifications:** Should user get notified when tweets post? → Already in system
- **Undo/Redo:** Should reschedules be undoable? → Nice-to-have Phase 2

---

**Last Updated:** January 27, 2026  
**Next Review:** After Phase 2.1-2.3 completion
