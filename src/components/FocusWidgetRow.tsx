import { formatDueDate, isOverdue } from "../lib/data";
import type { Task } from "../types";

interface FocusWidgetRowProps {
  task: Task;
  selected?: boolean;
  isNow?: boolean;
  compact?: boolean;
  ultra?: boolean;
  onToggle: (task: Task) => void;
  onSetNow: (task: Task) => void;
}

export function FocusWidgetRow({
  task,
  selected = false,
  isNow = false,
  compact = false,
  ultra = false,
  onToggle,
  onSetNow,
}: FocusWidgetRowProps) {
  const completed = task.status === "completed";
  const overdue = isOverdue(task);

  return (
    <li
      className={[
        "group flex items-start gap-2 rounded-xl transition-colors",
        ultra ? "px-1.5 py-1.5" : compact ? "px-2 py-1.5" : "px-2.5 py-2",
        selected
          ? "bg-[var(--color-accent-soft)] ring-1 ring-[var(--color-accent)]/25"
          : "bg-[var(--color-surface-raised)]/80 hover:bg-[var(--color-surface-raised)]",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(task)}
        className={[
          "mt-0.5 shrink-0 cursor-pointer rounded accent-[var(--color-accent)]",
          ultra ? "h-3.5 w-3.5" : "h-4 w-4",
        ].join(" ")}
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
      />

      <div className="min-w-0 flex-1">
        <p
          className={[
            "leading-snug",
            ultra ? "text-xs" : compact ? "text-[13px]" : "text-sm",
            completed
              ? "line-through text-[var(--color-text-muted)]"
              : ultra ? "font-medium text-[var(--color-text)]" : "font-medium text-[var(--color-text)]",
          ].join(" ")}
        >
          {task.title}
        </p>
        {task.dueDate && !ultra ? (
          <p
            className={[
              "mt-0.5 text-[10px]",
              overdue && !completed
                ? "font-medium text-[var(--color-danger)]"
                : "text-[var(--color-text-muted)]",
            ].join(" ")}
          >
            {formatDueDate(task.dueDate)}
          </p>
        ) : null}
      </div>

      {!completed && !isNow && !ultra ? (
        <button
          type="button"
          onClick={() => onSetNow(task)}
          className={[
            "mt-0.5 shrink-0 rounded-md font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)]",
            compact
              ? "px-1 py-0.5 text-[9px] opacity-100"
              : "px-1.5 py-0.5 text-[10px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
          ].join(" ")}
          title="Focus on this (F)"
        >
          {compact ? "•" : "Now"}
        </button>
      ) : null}
    </li>
  );
}
