import { createFileRoute } from '@tanstack/react-router'
import { CalendarContextWrapper } from '@/components/manage-tweets/calendar-provider'
import { CalendarHeader } from '@/components/manage-tweets/calendar-header'
import { CalendarGrid } from '@/components/manage-tweets/calendar-grid'
import { TweetQueueSidebar } from '@/components/manage-tweets/tweet-queue-sidebar'
import { useCalendarContext } from '@/components/manage-tweets/calendar-context'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/ui/sheet'

export const Route = createFileRoute('/dashboard/manage-tweet')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <CalendarContextWrapper>
      <ManageTweetContent />
    </CalendarContextWrapper>
  )
}

function ManageTweetContent() {
  const { isQueueDrawerOpen, setQueueDrawerOpen } = useCalendarContext();

  return (
    <div className="h-full bg-background flex flex-col">
      <CalendarHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative min-w-0 h-full overflow-hidden">
          <CalendarGrid />
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block border-l border-border h-full">
          <TweetQueueSidebar />
        </div>

        {/* Mobile Drawer */}
        <Sheet open={isQueueDrawerOpen} onOpenChange={setQueueDrawerOpen}>
          <SheetContent side="right" className="p-0 w-[300px] sm:w-[350px]">
            <SheetHeader className="sr-only">
              <SheetTitle>Tweet Queue</SheetTitle>
            </SheetHeader>
            <TweetQueueSidebar />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
