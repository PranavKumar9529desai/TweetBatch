import {
  DndContext as DndContextComponent,
  DragOverlay as DragOverlayComponent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { type ReactNode, type ComponentProps } from 'react';

interface DndContextWrapperProps
  extends Omit<ComponentProps<typeof DndContextComponent>, 'children'> {
  children: ReactNode;
}

/**
 * DndContext wrapper with pre-configured sensors
 * Usage: Wrap your draggable components with this context
 */
export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum distance before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: (event, { currentCoordinates }) => {
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

/**
 * DndContext wrapper with pre-configured sensors
 * Usage: Wrap your draggable components with this context
 */
export function DndContextWrapper({
  children,
  ...props
}: DndContextWrapperProps) {
  const sensors = useDndSensors();

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
