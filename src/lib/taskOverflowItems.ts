import { MOVE_QUEUES } from "../components/MoveToMenu";
import type { OverflowMenuItem } from "../components/OverflowMenu";
import type { Task, TaskQueue } from "../types";

export function buildTaskOverflowItems(
  task: Task,
  handlers: {
    onMove: (id: string, queue: TaskQueue) => void;
    onClear: (id: string) => void;
    onDelete: (id: string) => void;
    onUnpin?: (id: string) => void;
  },
  options?: { isSurface?: boolean },
): OverflowMenuItem[] {
  const isSurface = options?.isSurface ?? false;
  const isCleared = task.status === "cleared";
  const completed = task.status === "completed";
  const items: OverflowMenuItem[] = [];

  if (!isCleared) {
    for (const queue of MOVE_QUEUES) {
      items.push({
        label: `Move to ${queue.label}`,
        disabled: queue.id === task.queue,
        onClick: () => handlers.onMove(task.id, queue.id),
      });
    }
  }

  if (!isCleared && completed && !isSurface) {
    items.push({
      label: "Clear to archive",
      onClick: () => handlers.onClear(task.id),
    });
  }

  if (isSurface && handlers.onUnpin) {
    items.push({
      label: "Unpin",
      onClick: () => handlers.onUnpin!(task.id),
    });
  }

  items.push({
    label: "Delete",
    danger: true,
    onClick: () => handlers.onDelete(task.id),
  });

  return items;
}

export function buildSubtaskOverflowItems(
  subtaskId: string,
  handlers: {
    onPin: (subtaskId: string, queue: TaskQueue) => void;
    onDelete: (id: string) => void;
  },
): OverflowMenuItem[] {
  return [
    {
      label: "Pin to Today",
      onClick: () => handlers.onPin(subtaskId, "today"),
    },
    {
      label: "Pin to This Week",
      onClick: () => handlers.onPin(subtaskId, "week"),
    },
    {
      label: "Delete",
      danger: true,
      onClick: () => handlers.onDelete(subtaskId),
    },
  ];
}
