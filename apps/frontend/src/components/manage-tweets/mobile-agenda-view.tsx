import { useMemo } from 'react';
import { useCalendarContext } from './calendar-context';
import { TweetCard } from './tweet-card';
import { Button } from '@repo/ui/components/ui/button';
import { Plus, Clock, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

/**
 * MobileAgendaView
 * 
 * A premium vertical feed optimized for mobile devices.
 * Zero-Drag Architecture: focuses on 'Tap-to-Schedule' flow.
 */
export function MobileAgendaView() {
    const {
        currentWeekStart,
        getPostsForSlot,
        setSchedulingTargetSlot,
        setQueueDrawerOpen,
        schedulingTargetSlot
    } = useCalendarContext();

    // Generate 7 days for the current week
    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    }, [currentWeekStart]);

    // Peak hours for scheduling
    const suggestedHours = [9, 12, 15, 18, 21];

    const handleAddClick = (dayIndex: number, hour: number, date: Date) => {
        setSchedulingTargetSlot({ dayIndex, hour, date });
        setQueueDrawerOpen(true);
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-y-auto pb-32">
            {/* Header Hint */}
            <div className="px-6 py-4 bg-gradient-to-r from-primary/10 to-transparent border-b border-border/50">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <p className="text-xs font-medium text-muted-foreground">
                        Tap any slot to schedule from your queue
                    </p>
                </div>
            </div>

            {weekDays.map((date, dayIdx) => {
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const isToday = new Date().toDateString() === date.toDateString();

                return (
                    <div key={date.toISOString()} className="flex flex-col">
                        {/* Sticky Day Header - Glassmorphism */}
                        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md px-6 py-3 border-b border-border/40 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className={cn(
                                    "p-1.5 rounded-lg",
                                    isToday ? "bg-primary/20" : "bg-muted"
                                )}>
                                    <CalendarIcon className={cn("h-3.5 w-3.5", isToday ? "text-primary" : "text-muted-foreground")} />
                                </div>
                                <h3 className={cn(
                                    "text-sm font-bold tracking-tight",
                                    isToday ? "text-foreground" : "text-muted-foreground"
                                )}>
                                    {isToday ? 'Today' : dayName}, {dateStr}
                                </h3>
                            </div>
                            {isToday && (
                                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    Current
                                </span>
                            )}
                        </div>

                        {/* Slots and Posts */}
                        <div className="flex flex-col px-4 py-2 gap-4">
                            {suggestedHours.map((hour) => {
                                const postsInSlot = getPostsForSlot(dayIdx, hour);
                                const timeStr = hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`;
                                const isTargeted = schedulingTargetSlot?.dayIndex === dayIdx && schedulingTargetSlot?.hour === hour;

                                return (
                                    <div key={`${dayIdx}-${hour}`} className="flex flex-col gap-2.5">
                                        {/* Hour Marker */}
                                        <div className="flex items-center gap-3 px-1">
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground/40 w-14 shrink-0">
                                                <Clock className="h-3 w-3" />
                                                {timeStr}
                                            </div>
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-border/60 to-transparent" />
                                        </div>

                                        {/* Scheduled Posts */}
                                        {postsInSlot.length > 0 ? (
                                            <div className="flex flex-col gap-2.5 pl-2">
                                                {postsInSlot.map((post) => (
                                                    <div
                                                        key={post.id}
                                                        className="transform active:scale-[0.98] transition-all duration-200"
                                                    >
                                                        <TweetCard post={post} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            /* Empty Slot / "Add" Action */
                                            <div className="pl-2">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => handleAddClick(dayIdx, hour, date)}
                                                    className={cn(
                                                        "w-full justify-start h-14 border border-dashed rounded-2xl transition-all duration-300 group",
                                                        isTargeted
                                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                            : "border-border/60 bg-muted/20 hover:bg-primary/5 hover:border-primary/40"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "p-2 rounded-xl border border-dashed transition-colors",
                                                        isTargeted ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border group-hover:border-primary/50 group-hover:text-primary"
                                                    )}>
                                                        <Plus className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex flex-col items-start ml-3">
                                                        <span className={cn(
                                                            "text-xs font-semibold",
                                                            isTargeted ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                                                        )}>
                                                            {isTargeted ? "Pick a tweet from the queue..." : `Schedule for ${timeStr}`}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground/50">
                                                            {isTargeted ? "Checking your drafts" : "Tap to pick a draft"}
                                                        </span>
                                                    </div>
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* End of Feed Overlay */}
            <div className="py-12 flex flex-col items-center justify-center opacity-40">
                <div className="w-1 h-8 bg-gradient-to-b from-primary to-transparent rounded-full mb-4" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">End of your week</p>
            </div>
        </div>
    );
}
