import { PointerSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";

/**
 * Drag sensors tuned for handle-only activation.
 * Distance (not long-press delay) — handles use touch-none so scroll won't fight drag.
 */
export function useTaskDragSensors() {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 4 },
    }),
  );
}
