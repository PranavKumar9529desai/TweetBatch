import {
  DndContext as DndContextComponent,
  DndContextProps,
  DragOverlay as DragOverlayComponent,
} from '@dnd-kit/core';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import React, { type ReactNode } from 'react';

/**
 * Create sensors for drag and drop interactions
 * Includes pointer sensor (mouse/touch) and keyboard sensor
 */
export function createDndSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      distance: 8, // Minimum distance before starting drag
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: function (event, { currentCoordinates }) {
        switch (event.code) {
          case 'ArrowRight':
            return {
              x: currentCoordinates.x + 25,
              y: currentCoordinates.y,
            };
          case 'ArrowLeft':
            return {
              x: currentCoordinates.x - 25,
              y: currentCoordinates.y,
            };
          case 'ArrowDown':
            return {
              x: currentCoordinates.x,
              y: currentCoordinates.y + 25,
            };
          case 'ArrowUp':
            return {
              x: currentCoordinates.x,
              y: currentCoordinates.y - 25,
            };
          default:
            return undefined;
        }
      },
    })
  );
}

interface DndContextWrapperProps extends Omit<DndContextProps, 'children'> {
  children: ReactNode;
}

/**
 * DndContext wrapper with pre-configured sensors
 * Usage: Wrap your draggable components with this context
 */
export function DndContextWrapper({
  children,
  ...props
}: DndContextWrapperProps) {
  const sensors = createDndSensors();

  return (
    <DndContextComponent sensors={sensors} {...props}>
      {children}
    </DndContextComponent>
  );
}

/**
 * Re-export DragOverlay for convenience
 * Usage: Use this to render the dragged item preview
 */
export { DragOverlayComponent as DragOverlay };

/**
 * Re-export core dnd-kit utilities for flexibility
 */
export {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
