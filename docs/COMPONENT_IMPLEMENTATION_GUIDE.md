# Component Implementation Guide

This guide provides component-level specifications for implementing the Twitter Bulk Scheduler UI. Each component includes props, structure, and implementation details.

---

## File Structure

```
src/
├── routes/
│   └── scheduler/
│       ├── create.tsx        # Create Tweet view
│       ├── calendar.tsx      # Calendar Scheduler view
│       └── import.tsx        # Bulk Import view
├── components/
│   ├── tweet/
│   │   ├── TweetEditor.tsx
│   │   ├── TweetPreview.tsx
│   │   ├── MobileFrame.tsx
│   │   ├── MediaUploader.tsx
│   │   ├── CharacterCounter.tsx
│   │   └── TweetCard.tsx
│   ├── calendar/
│   │   ├── CalendarGrid.tsx
│   │   ├── CalendarHeader.tsx
│   │   ├── CalendarCell.tsx
│   │   ├── TimeColumn.tsx
│   │   ├── TweetQueue.tsx
│   │   ├── DraggableTweet.tsx
│   │   └── DroppableCell.tsx
│   ├── import/
│   │   ├── ImportContainer.tsx
│   │   ├── FileDropZone.tsx
│   │   ├── JsonPasteArea.tsx
│   │   ├── FileBrowser.tsx
│   │   └── ImportPreview.tsx
│   └── shared/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useTweets.ts
│   ├── useCalendar.ts
│   ├── useDragAndDrop.ts
│   └── useFileUpload.ts
├── stores/
│   └── tweetStore.ts
└── types/
    └── index.ts
```

---

## Component Specifications

### 1. Tweet Editor Components

#### TweetEditor

```tsx
// Path: src/components/tweet/TweetEditor.tsx

interface TweetEditorProps {
  initialContent?: string;
  initialMedia?: MediaAttachment[];
  onSave: (tweet: TweetDraft) => void;
  maxCharacters?: number; // default: 280
}

// Structure:
// <div className="tweet-editor">
//   <div className="editor-header">
//     <span>Create a Tweet</span>
//   </div>
//   <div className="editor-content">
//     <RichTextArea />
//     <CharacterCounter />
//   </div>
//   <MediaUploader />
//   <div className="editor-actions">
//     <Button onClick={handleSave}>Save</Button>
//   </div>
// </div>
```

**Implementation requirements:**

- Controlled component with internal state for content
- Debounced auto-save to localStorage (optional)
- Validation before save (non-empty content, within char limit)
- Clear form after successful save

---

#### MobileFrame

```tsx
// Path: src/components/tweet/MobileFrame.tsx

interface MobileFrameProps {
  children: React.ReactNode;
}

// Renders a phone-shaped container
// Fixed dimensions: 280px width x 560px height (or responsive with aspect-ratio)
// Styling: rounded corners (40px), border, optional notch at top
```

**CSS considerations:**

```css
.mobile-frame {
  width: 280px;
  aspect-ratio: 9/16;
  border: 2px solid #ccc;
  border-radius: 40px;
  padding: 20px 12px;
  overflow: hidden;
  background: #fff;
}
```

---

#### TweetPreview

```tsx
// Path: src/components/tweet/TweetPreview.tsx

interface TweetPreviewProps {
  content: string;
  media: MediaAttachment[];
  author?: {
    name: string;
    handle: string;
    avatarUrl: string;
  };
}

// Structure mimics Twitter tweet card:
// <div className="tweet-preview">
//   <div className="tweet-header">
//     <Avatar />
//     <div className="author-info">
//       <span className="name">{author.name}</span>
//       <span className="handle">@{author.handle}</span>
//     </div>
//   </div>
//   <div className="tweet-content">{content}</div>
//   {media.length > 0 && <MediaGrid media={media} />}
//   <div className="tweet-actions">
//     <Icon name="reply" />
//     <Icon name="retweet" />
//     <Icon name="like" />
//     <Icon name="share" />
//   </div>
// </div>
```

---

#### MediaUploader

```tsx
// Path: src/components/tweet/MediaUploader.tsx

interface MediaUploaderProps {
  media: MediaAttachment[];
  onMediaAdd: (files: File[]) => void;
  onMediaRemove: (id: string) => void;
  maxFiles?: number; // default: 4
  acceptedTypes?: string[]; // default: ['image/*', 'image/gif']
}

// Features:
// - Drag and drop zone (use react-dropzone)
// - Click to browse files
// - Thumbnail grid for uploaded files
// - Remove button on each thumbnail
// - File size validation
// - File type validation
```

**Validation rules:**

- Images: max 5MB each
- GIFs: max 15MB
- Max 4 files total
- Show error toast on validation failure

---

#### CharacterCounter

```tsx
// Path: src/components/tweet/CharacterCounter.tsx

interface CharacterCounterProps {
  current: number;
  max: number;
}

// Visual states:
// - Green: < 80% of max
// - Yellow/Orange: 80-99% of max
// - Red: >= max
// - Display: "current/max" or circular progress indicator
```

---

### 2. Calendar Components

#### CalendarGrid

```tsx
// Path: src/components/calendar/CalendarGrid.tsx

interface CalendarGridProps {
  weekStart: Date; // Starting date of the displayed week
  scheduledTweets: Map<string, Tweet>; // key: ISO date-time string
  onTweetDrop: (tweetId: string, scheduledAt: Date) => void;
  onTweetMove: (tweetId: string, newScheduledAt: Date) => void;
}

// Structure:
// <div className="calendar-grid">
//   <CalendarHeader weekStart={weekStart} />
//   <div className="calendar-body">
//     <TimeColumn />
//     {days.map(day => (
//       <div className="day-column" key={day}>
//         {hours.map(hour => (
//           <DroppableCell
//             key={`${day}-${hour}`}
//             day={day}
//             hour={hour}
//             scheduledTweet={getScheduledTweet(day, hour)}
//           />
//         ))}
//       </div>
//     ))}
//   </div>
// </div>
```

---

#### CalendarHeader

```tsx
// Path: src/components/calendar/CalendarHeader.tsx

interface CalendarHeaderProps {
  weekStart: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

// Structure:
// <div className="calendar-header">
//   <div className="nav-controls">
//     <Button onClick={onPreviousWeek}>←</Button>
//     <Button onClick={onToday}>Today</Button>
//     <Button onClick={onNextWeek}>→</Button>
//   </div>
//   <div className="day-headers">
//     <div className="time-header">time</div>
//     <div className="day-header">Sun</div>
//     <div className="day-header">Mon</div>
//     <div className="day-header">Tues</div>
//     <div className="day-header">Wed</div>
//     <div className="day-header">Thur</div>
//     <div className="day-header">Fri</div>
//     <div className="day-header">Sat</div>
//   </div>
// </div>
```

---

#### TimeColumn

```tsx
// Path: src/components/calendar/TimeColumn.tsx

interface TimeColumnProps {
  interval?: 30 | 60; // minutes, default: 60
  format?: "12h" | "24h"; // default: '12h'
}

// Generates time labels:
// 12 am, 1 am, 2 am, ... 11 am, 12 pm, 1 pm, ... 11 pm
// Each label positioned at the start of its time slot
```

---

#### TweetQueue

```tsx
// Path: src/components/calendar/TweetQueue.tsx

interface TweetQueueProps {
  tweets: Tweet[]; // Unscheduled tweets only
  onReorder: (fromIndex: number, toIndex: number) => void;
}

// Structure:
// <div className="tweet-queue">
//   <div className="queue-header">Tweet</div>
//   <div className="queue-list">
//     {tweets.map((tweet, index) => (
//       <DraggableTweet
//         key={tweet.id}
//         tweet={tweet}
//         index={index}
//       />
//     ))}
//   </div>
// </div>
```

---

#### DraggableTweet

```tsx
// Path: src/components/calendar/DraggableTweet.tsx

interface DraggableTweetProps {
  tweet: Tweet;
  index: number;
}

// Uses @dnd-kit/core or react-beautiful-dnd
// Structure:
// <div
//   className="draggable-tweet"
//   draggable
//   data-tweet-id={tweet.id}
// >
//   <span className="tweet-number">{index + 1})</span>
//   <span className="tweet-preview">{truncate(tweet.content, 30)}</span>
//   <span className="drag-handle">⋮⋮</span>
// </div>
```

---

#### DroppableCell

```tsx
// Path: src/components/calendar/DroppableCell.tsx

interface DroppableCellProps {
  day: Date;
  hour: number;
  minute?: number; // default: 0
  scheduledTweet?: Tweet;
  onDrop: (tweetId: string) => void;
}

// Visual states:
// - Empty: subtle background, border on hover
// - Drag over: highlighted background (e.g., blue tint)
// - Has tweet: displays TweetCard

// Structure:
// <div
//   className="droppable-cell"
//   onDragOver={handleDragOver}
//   onDrop={handleDrop}
// >
//   {scheduledTweet && (
//     <TweetCard tweet={scheduledTweet} compact />
//   )}
// </div>
```

---

### 3. Import Components

#### ImportContainer

```tsx
// Path: src/components/import/ImportContainer.tsx

interface ImportContainerProps {
  onImport: (tweets: TweetDraft[]) => Promise<void>;
}

// Structure:
// <div className="import-container">
//   <h2>Standard Input</h2>
//   <ul className="import-options">
//     <li><FileDropZone onFileDrop={handleFile} /></li>
//     <li><JsonPasteArea onPaste={handlePaste} /></li>
//     <li><FileBrowser onSelect={handleFile} /></li>
//   </ul>
//   <Button onClick={handleUpload}>Upload</Button>
// </div>
```

---

#### FileDropZone

```tsx
// Path: src/components/import/FileDropZone.tsx

interface FileDropZoneProps {
  onFileDrop: (file: File) => void;
  acceptedFormats?: string[]; // default: ['.json', '.csv']
}

// Structure:
// <div
//   className="file-drop-zone"
//   onDragOver={handleDragOver}
//   onDragLeave={handleDragLeave}
//   onDrop={handleDrop}
// >
//   <span className="drop-label">drop the file</span>
//   <span className="drop-hint">JSON or CSV format</span>
// </div>

// Visual states:
// - Default: dashed border, muted text
// - Drag over: solid border, highlighted background
// - File accepted: show filename, success indicator
```

---

#### JsonPasteArea

```tsx
// Path: src/components/import/JsonPasteArea.tsx

interface JsonPasteAreaProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

// Structure:
// <div className="json-paste-area">
//   <label>paste json</label>
//   <textarea
//     value={value}
//     onChange={handleChange}
//     placeholder='[{"content": "Tweet text..."}]'
//   />
//   {error && <span className="error">{error}</span>}
// </div>

// Validation:
// - On blur or on change (debounced): validate JSON syntax
// - Show inline error if invalid
```

---

#### FileBrowser

```tsx
// Path: src/components/import/FileBrowser.tsx

interface FileBrowserProps {
  onSelect: (file: File) => void;
  acceptedFormats?: string; // default: '.json,.csv'
}

// Structure:
// <div className="file-browser">
//   <label htmlFor="file-input">Choose from pc</label>
//   <input
//     id="file-input"
//     type="file"
//     accept={acceptedFormats}
//     onChange={handleFileSelect}
//     hidden
//   />
//   <Button onClick={() => inputRef.current?.click()}>
//     Browse
//   </Button>
// </div>
```

---

## Hooks

### useTweets

```tsx
// Path: src/hooks/useTweets.ts

interface UseTweetsReturn {
  tweets: Tweet[];
  scheduledTweets: Tweet[];
  unscheduledTweets: Tweet[];
  createTweet: (draft: TweetDraft) => Promise<Tweet>;
  updateTweet: (id: string, updates: Partial<Tweet>) => Promise<Tweet>;
  deleteTweet: (id: string) => Promise<void>;
  scheduleTweet: (id: string, scheduledAt: Date) => Promise<void>;
  unscheduleTweet: (id: string) => Promise<void>;
  importTweets: (drafts: TweetDraft[]) => Promise<Tweet[]>;
}

// Implementation notes:
// - Integrate with backend API
// - Handle optimistic updates
// - Error handling with rollback
```

---

### useCalendar

```tsx
// Path: src/hooks/useCalendar.ts

interface UseCalendarReturn {
  weekStart: Date;
  weekEnd: Date;
  days: Date[]; // Array of 7 dates for the current week
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  goToToday: () => void;
  goToDate: (date: Date) => void;
  getScheduledTweetsForDay: (day: Date) => Tweet[];
  getScheduledTweetForSlot: (day: Date, hour: number) => Tweet | undefined;
}
```

---

## State Store

### Zustand Store Example

```tsx
// Path: src/stores/tweetStore.ts

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TweetState {
  tweets: Tweet[];
  currentDraft: TweetDraft | null;

  // Actions
  setTweets: (tweets: Tweet[]) => void;
  addTweet: (tweet: Tweet) => void;
  updateTweet: (id: string, updates: Partial<Tweet>) => void;
  removeTweet: (id: string) => void;
  setCurrentDraft: (draft: TweetDraft | null) => void;

  // Computed
  getUnscheduledTweets: () => Tweet[];
  getScheduledTweets: () => Tweet[];
  getTweetsByDate: (date: Date) => Tweet[];
}

export const useTweetStore = create<TweetState>()(
  persist(
    (set, get) => ({
      tweets: [],
      currentDraft: null,

      setTweets: (tweets) => set({ tweets }),

      addTweet: (tweet) =>
        set((state) => ({
          tweets: [...state.tweets, tweet],
        })),

      updateTweet: (id, updates) =>
        set((state) => ({
          tweets: state.tweets.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        })),

      removeTweet: (id) =>
        set((state) => ({
          tweets: state.tweets.filter((t) => t.id !== id),
        })),

      setCurrentDraft: (draft) => set({ currentDraft: draft }),

      getUnscheduledTweets: () => get().tweets.filter((t) => !t.scheduledAt),

      getScheduledTweets: () =>
        get().tweets.filter((t) => t.scheduledAt !== null),

      getTweetsByDate: (date) =>
        get().tweets.filter(
          (t) => t.scheduledAt && isSameDay(new Date(t.scheduledAt), date),
        ),
    }),
    {
      name: "tweet-storage",
    },
  ),
);
```

---

## API Integration

### Expected Endpoints

| Method | Endpoint                   | Description        |
| ------ | -------------------------- | ------------------ |
| GET    | `/api/tweets`              | Fetch all tweets   |
| POST   | `/api/tweets`              | Create new tweet   |
| PUT    | `/api/tweets/:id`          | Update tweet       |
| DELETE | `/api/tweets/:id`          | Delete tweet       |
| POST   | `/api/tweets/:id/schedule` | Schedule a tweet   |
| DELETE | `/api/tweets/:id/schedule` | Unschedule a tweet |
| POST   | `/api/tweets/bulk`         | Bulk import tweets |

---

## Testing Checklist

### Unit Tests

- [ ] TweetEditor: character counting, validation
- [ ] CharacterCounter: visual state changes
- [ ] MediaUploader: file type/size validation
- [ ] JsonPasteArea: JSON validation
- [ ] Calendar date calculations

### Integration Tests

- [ ] Create tweet flow: edit → save → appears in queue
- [ ] Schedule tweet: drag from queue → drop on calendar
- [ ] Bulk import: file upload → preview → confirm → tweets in queue
- [ ] Reschedule: move tweet between calendar cells

### E2E Tests

- [ ] Full workflow: create → schedule → verify in calendar
- [ ] Bulk import with various file formats
- [ ] Error handling for failed API calls
