import type { ReactNode } from 'react';
import { DndContext } from '@dnd-kit/core';
import { CalendarProvider } from './calendar-context';
import { createDndSensors } from './dnd-setup';
import { Toaster } from '@repo/ui/components/ui/sonner';

interface CalendarContextWrapperProps {
    children: ReactNode;
}

/**
 * CalendarContextWrapper
 * 
 * Wraps the calendar and its children with:
 * - CalendarProvider (state management for week, search, drag, etc.)
 * - DndContext (drag-and-drop functionality)
 * - Toast notifications (for user feedback)
 * 
 * This is the main provider that all calendar components must be wrapped with.
 */
export function CalendarContextWrapper({
    children,
}: CalendarContextWrapperProps) {
    const sensors = createDndSensors();

    return (
        <CalendarProvider>
            <DndContext
                sensors={sensors}
            >
                {children}
            </DndContext>
            <Toaster />
        </CalendarProvider>
    );
}

export { CalendarProvider };
