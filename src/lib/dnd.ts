import type {
  CollisionDetection,
  DragOverEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  closestCenter,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import { parseQueueDropId } from "../types";

function isQueueDrop(id: UniqueIdentifier): boolean {
  return parseQueueDropId(id) !== null;
}

/** Prefer tab drop targets when the pointer is over them. */
export const queueAwareCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args).filter((collision) =>
    isQueueDrop(collision.id),
  );
  if (pointerHits.length > 0) return pointerHits;

  const rectHits = rectIntersection(args).filter((collision) =>
    isQueueDrop(collision.id),
  );
  if (rectHits.length > 0) return rectHits;

  return closestCenter(args);
};

export function queueFromDragEvent(event: {
  over: { id: UniqueIdentifier } | null;
  collisions: { id: UniqueIdentifier }[] | null;
}) {
  if (event.over) {
    const direct = parseQueueDropId(event.over.id);
    if (direct) return direct;
  }

  for (const collision of event.collisions ?? []) {
    const queue = parseQueueDropId(collision.id);
    if (queue) return queue;
  }

  return null;
}

export function handleDragOverQueueHighlight(
  event: DragOverEvent,
  onTab: (tab: ReturnType<typeof parseQueueDropId>) => void,
) {
  onTab(queueFromDragEvent(event));
}
