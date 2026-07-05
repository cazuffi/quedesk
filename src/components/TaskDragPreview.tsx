import type { Task } from "../types";

interface TaskDragPreviewProps {
  task: Task;
}

export function TaskDragPreview({ task }: TaskDragPreviewProps) {
  return (
    <div className="pointer-events-none w-max max-w-[min(16rem,70vw)] truncate rounded-xl border border-[var(--color-accent)] bg-[var(--color-surface-raised)] px-3.5 py-2 text-sm font-medium text-[var(--color-text)] shadow-xl">
      {task.title}
    </div>
  );
}
