import { createFileRoute } from '@tanstack/react-router'
import { CalendarContextWrapper } from '@/components/manage-tweets/calendar-provider'
import { CalendarHeader } from '@/components/manage-tweets/calendar-header'
import { CalendarGrid } from '@/components/manage-tweets/calendar-grid'
import { TweetQueueSidebar } from '@/components/manage-tweets/tweet-queue-sidebar'
import { useCalendarContext } from '@/components/manage-tweets/calendar-context'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/components/ui/sheet'
import { MobileAgendaView } from '@/components/manage-tweets/mobile-agenda-view'

import { ManageTweetSkeleton } from '@/components/dashboard/skeletons'
import { apiclient } from '@/lib/api.client'

export const Route = createFileRoute('/dashboard/manage-tweet')({
  loader: async ({ context }) => {
    const { queryClient, auth } = context;
    if (!auth.user?.id) return;

    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek;
    const currentWeekStart = new Date(today.setDate(diff));
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
    currentWeekEnd.setHours(23, 59, 59, 999);

    await queryClient.ensureQueryData({
      queryKey: ['posts', 'search', currentWeekStart.toISOString(), currentWeekEnd.toISOString(), '', 50, 0],
      queryFn: async () => {
        const response = await apiclient.posts.search.$get({
          query: {
            startDate: currentWeekStart.toISOString(),
            endDate: currentWeekEnd.toISOString(),
            search: '',
            limit: '50',
            offset: '0'
          },
        });
        if (!response.ok) throw new Error('Failed to fetch posts');
        const data = await response.json();
        // @ts-ignore
        if (!data.success) throw new Error(data.error || 'Failed to fetch posts');
        return data.posts || [];
      }
    });
  },
  pendingComponent: ManageTweetSkeleton,
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
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <CalendarHeader />
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative min-w-0 h-full overflow-hidden">
          {/* Desktop View */}
          <div className="hidden md:block h-full overflow-hidden">
            <CalendarGrid />
          </div>

          {/* Mobile View */}
          <div className="block md:hidden h-full overflow-hidden">
            <MobileAgendaView />
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block border-l border-border h-full w-80">
          <TweetQueueSidebar />
        </div>

        {/* Mobile Drawer */}
        <Sheet open={isQueueDrawerOpen} onOpenChange={setQueueDrawerOpen}>
          <SheetContent side="right" className="p-0 w-[85%] sm:w-[350px]">
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
