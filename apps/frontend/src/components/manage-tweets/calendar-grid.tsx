import { useMemo } from 'react';
import { useCalendarContext } from './calendar-context';
import { CalendarCell } from './calendar-cell';

/**
 * CalendarGrid
 * 
 * 7x24 grid layout for week view (Monday-Sunday, 6am-12am)
 * Features:
 * - Sticky header with day names and dates
 * - Sticky left time column
 * - Scrollable body with drop zones
 * - Current time indicator (horizontal line)
 * - Dark theme styling
 */
export function CalendarGrid() {
    const { currentWeekStart } = useCalendarContext();

    // Generate days of the week starting from currentWeekStart
    const weekDays = useMemo(() => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(date.getDate() + i);
            days.push(date);
        }
        return days;
    }, [currentWeekStart]);

    // Generate hours (6am to 12am = 6 to 24)
    const hours = useMemo(() => {
        return Array.from({ length: 19 }, (_, i) => i + 6);
    }, []);

    // Get current time indicator position
    const currentHour = useMemo(() => {
        const now = new Date();
        return now.getHours();
    }, []);

    const isCurrentDayInWeek = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return weekDays.some(
            (day) =>
                day.getFullYear() === today.getFullYear() &&
                day.getMonth() === today.getMonth() &&
                day.getDate() === today.getDate()
        );
    }, [weekDays]);

    const currentDayIndex = useMemo(() => {
        if (!isCurrentDayInWeek) return -1;
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return weekDays.findIndex(
            (day) =>
                day.getFullYear() === today.getFullYear() &&
                day.getMonth() === today.getMonth() &&
                day.getDate() === today.getDate()
        );
    }, [weekDays, isCurrentDayInWeek]);

    const formatTime = (hour: number): string => {
        if (hour === 0) return '12am';
        if (hour < 12) return `${hour}am`;
        if (hour === 12) return '12pm';
        return `${hour - 12}pm`;
    };

    const formatDate = (date: Date): string => {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header: Days and dates */}
            <div className="flex border-b border-border sticky top-0 z-40 bg-background overflow-x-auto no-scrollbar">
                {/* Time column header (empty) */}
                <div className="w-14 sm:w-20 flex-shrink-0 border-r border-border p-2 text-xs font-semibold text-muted-foreground bg-background sticky left-0 z-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" />

                {/* Day headers */}
                <div className="flex flex-1 divide-x divide-border min-w-[700px] md:min-w-0">
                    {weekDays.map((date, idx) => {
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                        const dateStr = formatDate(date);
                        const isToday = idx === currentDayIndex;

                        return (
                            <div
                                key={`header-${idx}`}
                                className={`flex-1 p-2 text-center min-w-0 ${isToday
                                    ? 'bg-primary/10 border-b-2 border-primary'
                                    : ''
                                    }`}
                            >
                                <div className="text-xs font-semibold text-foreground">
                                    {dayName}
                                </div>
                                <div className={`text-xs ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                                    {dateStr}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Body: Grid with time slots */}
            <div className="flex flex-1 overflow-hidden bg-background relative">
                {/* Time column (sticky left) */}
                <div className="w-14 sm:w-20 flex-shrink-0 border-r border-border bg-background sticky left-0 z-30 overflow-y-auto">
                    {hours.map((hour) => (
                        <div
                            key={`time-${hour}`}
                            className="h-[60px] flex items-start justify-end pr-1 sm:pr-2 pt-1 text-[10px] sm:text-xs text-muted-foreground font-medium border-b border-border"
                        >
                            {formatTime(hour)}
                        </div>
                    ))}
                </div>

                {/* Grid cells (scrollable) */}
                <div className="flex flex-1 overflow-auto">
                    <div className="flex flex-1 divide-x divide-border relative min-w-[700px] md:min-w-0">
                        {weekDays.map((date, dayIdx) => (
                            <div
                                key={`day-${dayIdx}`}
                                className="flex-1 min-w-0 divide-y divide-border relative"
                            >
                                {hours.map((hour) => (
                                    <CalendarCell
                                        key={`cell-${dayIdx}-${hour}`}
                                        dayIndex={dayIdx}
                                        hour={hour}
                                        date={date}
                                    />
                                ))}

                                {/* Current time indicator */}
                                {dayIdx === currentDayIndex && isCurrentDayInWeek && (
                                    <div
                                        className="absolute left-0 right-0 h-0.5 bg-red-500/80 pointer-events-none z-20"
                                        style={{
                                            top: `${((currentHour - 6) * 60 + new Date().getMinutes()) /
                                                (19 * 60) *
                                                100
                                                }%`,
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
