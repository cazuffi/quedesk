import type { Task } from "../types";

interface TaskDragPreviewProps {
  task: Task;
}

export function TaskDragPreview({ task }: TaskDragPreviewProps) {
  return (
    <div className="pointer-events-none w-max max-w-[14rem] truncate rounded-xl border border-[var(--color-accent)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-text)] shadow-xl">
      {task.title}
    </div>
  );
}
