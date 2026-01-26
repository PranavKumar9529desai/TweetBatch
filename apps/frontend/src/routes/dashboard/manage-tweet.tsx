import { createFileRoute } from '@tanstack/react-router'
import { CalendarProvider } from '@/components/manage-tweets/calendar-provider'
import { CalendarGrid } from '@/components/manage-tweets/calendar-grid'
import { TweetQueueSidebar } from '@/components/manage-tweets/tweet-queue-sidebar'

export const Route = createFileRoute('/dashboard/manage-tweet')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex h-full gap-6 p-6">
      <CalendarProvider>
        <div className="flex-1">
          <CalendarGrid />
        </div>
        <aside className="w-80">
          <TweetQueueSidebar />
        </aside>
      </CalendarProvider>
    </div>
  )
}
