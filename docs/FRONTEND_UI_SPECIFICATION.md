# Frontend UI Specification - Twitter Bulk Scheduler

This document provides detailed technical specifications for implementing the Twitter Bulk Scheduler frontend interface. The UI consists of three primary routes/views.
using the gsap for frontend animation making it state of art animation for landing page 

---

## Table of Contents

1. [Route Structure](#route-structure)
2. [View 1: Create a Tweet](#view-1-create-a-tweet)
3. [View 2: Calendar Scheduler](#view-2-calendar-scheduler)
4. [View 3: Bulk Import](#view-3-bulk-import)
5. [Shared Components](#shared-components)
6. [Data Models](#data-models)
7. [State Management Requirements](#state-management-requirements)

---

## Route Structure

```
/scheduler
  ├── /create       → Create a Tweet view
  ├── /calendar     → Calendar Scheduler view
  └── /import       → Bulk Import view
```

---

## View 1: Create a Tweet

**Route:** `/scheduler/create`

### Layout Structure

The view uses a two-column layout:

- **Left column (70%):** Tweet editor panel
- **Right column (30%):** Mobile preview frame

### Components

#### 1.1 Tweet Editor Panel

**Container specifications:**

- Bordered container with padding
- Full height of viewport minus header/navigation

**Sub-components:**

##### 1.1.1 Rich Text Editor

- **Purpose:** Compose tweet content with formatting support
- **Requirements:**
  - Character counter (max 280 characters for standard tweets, 25000 for Twitter Blue)
  - Support for line breaks
  - URL detection and shortening display
  - Hashtag and mention (@) highlighting
  - Emoji picker integration
- **Recommended libraries:** `@tiptap/react`, `lexical`, or `slate`

##### 1.1.2 Content Input Area

- **Type:** Multi-line textarea or rich text field
- **Placeholder:** "What's happening?"
- **Validation:**
  - Required field
  - Max character limit enforcement
  - Display remaining character count

##### 1.1.3 Media Input Section

- **Label:** "Input: images . file . docs"
- **Supported file types:**
  - Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
  - Documents: `.pdf`, `.doc`, `.docx` (for reference/notes only)
- **Constraints:**
  - Max 4 images per tweet
  - Max file size: 5MB per image, 15MB for GIFs
- **UI Elements:**
  - Drag-and-drop zone
  - File browser button
  - Thumbnail preview grid for uploaded media
  - Remove button (X) on each thumbnail

##### 1.1.4 Save Button

- **Type:** Primary action button
- **Label:** "Save"
- **Position:** Bottom center of editor panel
- **Behavior:**
  - Validates tweet content
  - Saves tweet to draft state (unscheduled)
  - Tweet appears in Calendar view's tweet queue
- **States:** Default, Hover, Loading, Disabled

#### 1.2 Mobile Preview Frame

**Purpose:** Real-time preview of how the tweet will appear on Twitter mobile app

**Specifications:**

- **Dimensions:** Fixed aspect ratio 9:16 (mobile viewport)
- **Frame styling:** Device frame border with rounded corners, optional notch indicator
- **Content rendering:**
  - Twitter-like card layout
  - User avatar placeholder
  - Username/handle display
  - Tweet content with proper formatting
  - Media preview (if attached)
  - Timestamp placeholder
  - Engagement icons (like, retweet, reply, share) - non-functional display only

**Reactivity:**

- Updates in real-time as user types in editor
- Shows media thumbnails when uploaded
- Handles text overflow with ellipsis for preview

---

## View 2: Calendar Scheduler

**Route:** `/scheduler/calendar`

### Layout Structure

The view uses a Kanban-style horizontal layout:

- **Left sidebar (20%):** Draggable tweet queue
- **Main area (80%):** Weekly calendar grid

### Components

#### 2.1 Tweet Queue Sidebar

**Purpose:** Display unscheduled tweets as draggable items

**Specifications:**

- **Header:** "Tweet" label
- **List behavior:** Vertical scrollable list
- **Item display format:** Numbered list (4, 5, 6, 7, ...)
  - Show tweet content preview (truncated to ~50 chars)
  - Visual drag handle indicator

**Drag behavior:**

- Items are draggable using HTML5 Drag and Drop API or library (e.g., `@dnd-kit/core`, `react-beautiful-dnd`)
- Visual feedback during drag (ghost element, placeholder)
- Drop zones are calendar cells

#### 2.2 Weekly Calendar Grid

**Purpose:** Schedule tweets by dropping them into specific day/time slots

##### 2.2.1 Grid Structure

**Header row:**

- Columns: `time` | `Sun` | `Mon` | `Tues` | `Wed` | `Thur` | `Fri` | `Sat`
- Sticky header for horizontal scroll

**Time column (rows):**

- 24-hour time slots or configurable intervals
- Display format: `12 am`, `1 am`, `2 am`, ... `12 pm`, `1 pm`, ... `11 pm`
- Recommended: 1-hour intervals (24 rows) or 30-minute intervals (48 rows)

**Grid cells:**

- Each cell represents intersection of day + time
- Minimum cell height: 60px
- Visual distinction for current day/time

##### 2.2.2 Scheduled Tweet Display

**Appearance:**

- Tweet cards positioned within cells
- Card content:
  - Tweet number/identifier
  - Content preview (truncated)
  - Visual indicator of scheduled status
- Cards should be movable (re-schedulable) via drag

**Example placements from wireframe:**

- "1) Tweet first" → Monday at approximately 6am-8am
- "2) Tweet sec" → Sunday at 12am-2am
- "4) fourth" → Wednesday at approximately 12pm

##### 2.2.3 Drop Zone Behavior

**On drop:**

- Capture target day (column)
- Capture target time (row)
- Update tweet's scheduled datetime
- Visual confirmation of successful scheduling
- Move tweet from sidebar queue to calendar cell

**Validation:**

- Prevent scheduling in the past
- Optional: Prevent duplicate scheduling at same time
- Optional: Conflict detection with existing scheduled tweets

#### 2.3 Calendar Navigation

**Controls (optional but recommended):**

- Week navigation arrows (previous/next week)
- "Today" button to jump to current week
- Date range display (e.g., "Jan 20 - Jan 26, 2026")

---

## View 3: Bulk Import

**Route:** `/scheduler/import`

### Layout Structure

Single centered container with import options

### Components

#### 3.1 Import Container

**Specifications:**

- Centered on page
- Max width: 600px
- Bordered container with padding

#### 3.2 Standard Input Section

**Header:** "Standard Input"

**Import methods (3 options):**

##### 3.2.1 File Drop Zone

- **Label:** "drop the file"
- **Behavior:**
  - Drag-and-drop area for file upload
  - Accepts `.json`, `.csv` files
  - Visual feedback on drag over (border highlight)
- **Dimensions:** Full width, minimum 150px height

##### 3.2.2 JSON Paste Area

- **Label:** "paste json"
- **Type:** Textarea input
- **Placeholder:** `[{"content": "Tweet text", "scheduledAt": "2026-01-25T10:00:00Z"}]`
- **Validation:** JSON syntax validation on input
- **Error display:** Inline error message for invalid JSON

##### 3.2.3 File Browser

- **Label:** "Choose the from pc"
- **Type:** Native file input with custom styling
- **Accepted formats:** `.json`, `.csv`
- **Behavior:** Opens system file picker dialog

#### 3.3 Upload Button

- **Type:** Primary action button
- **Label:** "Upload"
- **Position:** Bottom center of container
- **Styling:** Outlined/bordered button (as shown in wireframe)
- **Behavior:**
  - Validates imported data format
  - Parses tweets from input
  - Displays preview/confirmation of tweets to import
  - On confirm: Adds tweets to draft queue
- **States:** Default, Hover, Loading, Disabled, Success, Error

#### 3.4 Import Data Format

**Expected JSON structure:**

```json
[
  {
    "content": "Tweet text content here",
    "scheduledAt": "2026-01-25T10:00:00Z",
    "media": [
      {
        "type": "image",
        "url": "https://example.com/image.jpg"
      }
    ]
  }
]
```

**Expected CSV structure:**

```csv
content,scheduledAt,mediaUrls
"Tweet text content",2026-01-25T10:00:00Z,"url1;url2"
```

---

## Shared Components

### Navigation/Header

- Route tabs or links to switch between Create, Calendar, Import views
- Active state indicator for current route

### Toast/Notification System

- Success messages (tweet saved, import complete)
- Error messages (validation failures, API errors)
- Position: Top-right or bottom-center

### Loading States

- Skeleton loaders for calendar grid
- Spinner for async operations
- Disabled state for buttons during loading

---

## Data Models

### Tweet

```typescript
interface Tweet {
  id: string;
  content: string;
  media: MediaAttachment[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface MediaAttachment {
  id: string;
  type: "image" | "gif" | "video";
  url: string;
  thumbnailUrl?: string;
  altText?: string;
}
```

### Calendar Event

```typescript
interface CalendarEvent {
  tweetId: string;
  scheduledAt: Date;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  hour: number; // 0-23
  minute: number; // 0-59
}
```

### Bulk Import Payload

```typescript
interface BulkImportPayload {
  tweets: Array<{
    content: string;
    scheduledAt?: string; // ISO 8601 format
    media?: Array<{
      type: "image" | "gif";
      url: string;
    }>;
  }>;
}
```

---

## State Management Requirements

### Global State

- **Tweet queue:** Array of unscheduled tweets (displayed in calendar sidebar)
- **Scheduled tweets:** Map of date-time to tweet IDs
- **Current draft:** Tweet being edited in Create view

### Persistence

- Auto-save draft tweets to localStorage
- Sync with backend API on explicit save/schedule actions

### Actions

| Action             | Description                         |
| ------------------ | ----------------------------------- |
| `createTweet`      | Add new tweet to draft queue        |
| `updateTweet`      | Modify existing tweet content/media |
| `scheduleTweet`    | Assign datetime to tweet            |
| `unscheduleTweet`  | Remove datetime, return to queue    |
| `deleteTweet`      | Remove tweet entirely               |
| `bulkImportTweets` | Add multiple tweets from import     |
| `reorderQueue`     | Change order of unscheduled tweets  |

---

## Implementation Notes

### Recommended Libraries

| Feature             | Recommended Library                      |
| ------------------- | ---------------------------------------- |
| Drag and Drop       | `@dnd-kit/core` or `react-beautiful-dnd` |
| Rich Text Editor    | `@tiptap/react` or `lexical`             |
| Date/Time           | `date-fns` or `dayjs`                    |
| State Management    | `zustand` or React Context               |
| Form Handling       | `react-hook-form` with `zod` validation  |
| File Upload         | `react-dropzone`                         |
| Toast Notifications | `sonner` or `react-hot-toast`            |

### Accessibility Requirements

- Keyboard navigation for calendar grid
- Screen reader announcements for drag-drop operations
- Focus management when modals/dialogs open
- ARIA labels for all interactive elements
- Color contrast compliance (WCAG 2.1 AA)

### Responsive Behavior

- **Desktop (1024px+):** Full layout as specified
- **Tablet (768px-1023px):**
  - Create view: Stack editor and preview vertically
  - Calendar: Horizontal scroll for week view
- **Mobile (< 768px):**
  - Single column layouts
  - Calendar switches to day view or list view
  - Bottom sheet for tweet queue

# Landing Page 

> stack : Astro with vanial html + react + GSAP for animation 

- following the theme which we were using for the frontend application.
- this make out application look consistent and themed.
- we have state of art animation using ScrollTriger and Svg animation gsap is too good for this.
