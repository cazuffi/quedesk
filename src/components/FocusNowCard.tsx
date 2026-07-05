import { formatDueDate, isOverdue } from "../lib/data";
import type { Task } from "../types";

interface FocusNowCardProps {
  task: Task;
  compact?: boolean;
  ultra?: boolean;
  onToggle: (task: Task) => void;
}

export function FocusNowCard({
  task,
  compact = false,
  ultra = false,
  onToggle,
}: FocusNowCardProps) {
  const completed = task.status === "completed";
  const overdue = isOverdue(task);

  return (
    <div
      className={[
        "rounded-2xl border border-[var(--color-accent)]/25 bg-gradient-to-br from-[var(--color-accent-soft)]/80 to-[var(--color-surface-raised)] shadow-sm",
        ultra ? "p-2.5" : compact ? "p-3" : "p-3.5",
      ].join(" ")}
    >
      {!ultra ? (
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
          Now
        </p>
      ) : null}
      <div className={ultra ? "flex items-start gap-2" : "mt-2 flex items-start gap-3"}>
        <input
          type="checkbox"
          checked={completed}
          onChange={() => onToggle(task)}
          className={[
            "shrink-0 cursor-pointer rounded accent-[var(--color-accent)]",
            ultra ? "mt-0.5 h-4 w-4" : "mt-1 h-5 w-5",
          ].join(" ")}
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
        />
        <div className="min-w-0 flex-1">
          <p
            className={[
              "font-semibold leading-snug",
              ultra ? "text-sm" : compact ? "text-[15px]" : "text-base",
              completed
                ? "line-through text-[var(--color-text-muted)]"
                : "text-[var(--color-text)]",
            ].join(" ")}
          >
            {task.title}
          </p>
          {task.dueDate && !ultra ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
