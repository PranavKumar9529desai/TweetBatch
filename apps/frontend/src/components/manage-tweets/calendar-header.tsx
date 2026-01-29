import { useState, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, ListMusic } from 'lucide-react';
import { useCalendarContext } from './calendar-context';
import { Input } from '@repo/ui/components/ui/input';
import { Button } from '@repo/ui/components/ui/button';

/**
 * CalendarHeader
 * 
 * Layout: [← | Today | →]  Jan 26 – Feb 1, 2026    [Search...]
 * Features:
 * - Date range text display
 * - Navigation buttons (previous week, today, next week)
 * - Search input with debounce (500ms)
 * - Auto-refetch posts on date range change
 */
export function CalendarHeader() {
    const {
        currentWeekStart,
        setCurrentWeekStart,
        searchQuery,
        setSearchQuery,
        setQueueDrawerOpen
    } = useCalendarContext();
    const [searchInput, setSearchInput] = useState(searchQuery);

    // Debounce search input
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            setSearchQuery(value);
        }, 500);
    }, [setSearchQuery]);

    // Calculate week end date
    const weekEnd = useMemo(() => {
        const end = new Date(currentWeekStart);
        end.setDate(end.getDate() + 6);
        return end;
    }, [currentWeekStart]);

    // Format date range
    const dateRangeText = useMemo(() => {
        const formatMonth = (date: Date) => {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
        const formatYear = (date: Date) => {
            return date.getFullYear();
        };

        const startStr = formatMonth(currentWeekStart);
        const endStr = formatMonth(weekEnd);
        const year = formatYear(weekEnd);

        // If same month, show "Jan 26 – 31, 2026"
        if (currentWeekStart.getMonth() === weekEnd.getMonth()) {
            return `${startStr} – ${endStr}, ${year}`;
        }
        // Otherwise "Jan 26 – Feb 1, 2026"
        return `${startStr} – ${endStr}, ${year}`;
    }, [currentWeekStart, weekEnd]);

    const handlePreviousWeek = () => {
        const prev = new Date(currentWeekStart);
        prev.setDate(prev.getDate() - 7);
        setCurrentWeekStart(prev);
    };

    const handleToday = () => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek;
        const weekStart = new Date(today.setDate(diff));
        setCurrentWeekStart(weekStart);
    };

    const handleNextWeek = () => {
        const next = new Date(currentWeekStart);
        next.setDate(next.getDate() + 7);
        setCurrentWeekStart(next);
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center justify-between w-full sm:w-auto gap-2">
                {/* Navigation buttons */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handlePreviousWeek}
                        className="h-8 w-8 hover:bg-muted"
                        title="Previous week"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleToday}
                        className="px-3 h-8 text-xs font-medium"
                    >
                        Today
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleNextWeek}
                        className="h-8 w-8 hover:bg-muted"
                        title="Next week"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                {/* Mobile Queue Toggle */}
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setQueueDrawerOpen(true)}
                    className="md:hidden flex items-center gap-1.5 h-8 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none font-semibold px-3"
                >
                    <ListMusic className="h-3.5 w-3.5" />
                    <span className="text-xs">Queue</span>
                </Button>
            </div>

            {/* Date range display */}
            <div className="text-sm font-bold text-foreground sm:order-none tracking-tight">
                {dateRangeText}
            </div>

            {/* Search input */}
            <div className="w-full sm:w-auto sm:max-w-[200px] lg:max-w-xs">
                <Input
                    type="text"
                    placeholder="Search tweets..."
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="h-8 text-xs bg-muted/40 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
                />
            </div>
        </div>
    );
}
