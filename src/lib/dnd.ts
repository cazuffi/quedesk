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

function withoutQueueDrops(
  args: Parameters<CollisionDetection>[0],
): Parameters<CollisionDetection>[0] {
  return {
    ...args,
    droppableContainers: args.droppableContainers.filter(
      (container) => !isQueueDrop(container.id),
    ),
  };
}

/**
 * Tab drops only when the pointer is over a tab. List reordering ignores tabs
 * entirely so dragging near the top-left still targets tasks, not Today/Inbox.
 */
export const queueAwareCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args).filter((collision) =>
    isQueueDrop(collision.id),
  );
  if (pointerHits.length > 0) return pointerHits;

  return closestCenter(withoutQueueDrops(args));
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
