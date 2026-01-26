import { createFileRoute } from '@tanstack/react-router'
import { CalendarContextWrapper } from '@/components/manage-tweets/calendar-provider'
import { CalendarHeader } from '@/components/manage-tweets/calendar-header'
import { CalendarGrid } from '@/components/manage-tweets/calendar-grid'
import { TweetQueueSidebar } from '@/components/manage-tweets/tweet-queue-sidebar'

export const Route = createFileRoute('/dashboard/manage-tweet')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="h-full bg-background flex flex-col">
      <CalendarContextWrapper>
        <CalendarHeader />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 relative min-w-0">
            <CalendarGrid />
          </div>
          <TweetQueueSidebar />
        </div>
      </CalendarContextWrapper>
    </div>
  )
}
