import type {
  CollisionDetection,
  DragOverEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { closestCenter, pointerWithin } from "@dnd-kit/core";
import { parseQueueDropId } from "../types";

function isQueueDrop(id: UniqueIdentifier): boolean {
  return parseQueueDropId(id) !== null;
}

/**
 * Tab drops only when the pointer is over a tab — not when the dragged card's
 * bounding box intersects the tab bar while reordering in the list.
 */
export const queueAwareCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args).filter((collision) =>
    isQueueDrop(collision.id),
  );
  if (pointerHits.length > 0) return pointerHits;

  return closestCenter(args);
};

export function queueFromDragEvent(event: {
  over: { id: UniqueIdentifier } | null;
}) {
  if (!event.over) return null;
  return parseQueueDropId(event.over.id);
}

export function handleDragOverQueueHighlight(
  event: DragOverEvent,
  onTab: (tab: ReturnType<typeof parseQueueDropId>) => void,
) {
  onTab(queueFromDragEvent(event));
}
