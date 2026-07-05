import { formatDueDate, isOverdue } from "../lib/data";
import type { Task } from "../types";

interface FocusNowCardProps {
  task: Task;
  onToggle: (task: Task) => void;
}

export function FocusNowCard({ task, onToggle }: FocusNowCardProps) {
  const completed = task.status === "completed";
  const overdue = isOverdue(task);

  return (
    <div className="rounded-2xl border border-[var(--color-accent)]/25 bg-gradient-to-br from-[var(--color-accent-soft)]/80 to-[var(--color-surface-raised)] p-3.5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
        Now
      </p>
      <div className="mt-2 flex items-start gap-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={() => onToggle(task)}
          className="mt-1 h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--color-accent)]"
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
        />
        <div className="min-w-0 flex-1">
          <p
            className={[
              "text-base font-semibold leading-snug",
              completed
                ? "line-through text-[var(--color-text-muted)]"
                : "text-[var(--color-text)]",
            ].join(" ")}
          >
            {task.title}
          </p>
          {task.dueDate && (
            <p
              className={[
                "mt-1 text-xs",
                overdue && !completed
                  ? "font-medium text-[var(--color-danger)]"
                  : "text-[var(--color-text-muted)]",
              ].join(" ")}
            >
              {formatDueDate(task.dueDate)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
