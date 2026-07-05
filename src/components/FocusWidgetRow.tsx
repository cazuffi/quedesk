import { formatDueDate, isOverdue } from "../lib/data";
import type { Task } from "../types";

interface FocusWidgetRowProps {
  task: Task;
  selected?: boolean;
  isNow?: boolean;
  onToggle: (task: Task) => void;
  onSetNow: (task: Task) => void;
}

export function FocusWidgetRow({
  task,
  selected = false,
  isNow = false,
  onToggle,
  onSetNow,
}: FocusWidgetRowProps) {
  const completed = task.status === "completed";
  const overdue = isOverdue(task);

  return (
    <li
      className={[
        "group flex items-start gap-2 rounded-xl px-2.5 py-2 transition-colors",
        selected
          ? "bg-[var(--color-accent-soft)] ring-1 ring-[var(--color-accent)]/25"
          : "bg-[var(--color-surface-raised)]/80 hover:bg-[var(--color-surface-raised)]",
      ].join(" ")}
    >
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(task)}
        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-[var(--color-accent)]"
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
      />

      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-sm leading-snug",
            completed
              ? "line-through text-[var(--color-text-muted)]"
              : "font-medium text-[var(--color-text)]",
          ].join(" ")}
        >
          {task.title}
        </p>
        {task.dueDate && (
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
        )}
      </div>

      {!completed && !isNow ? (
        <button
          type="button"
          onClick={() => onSetNow(task)}
          className="mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] opacity-100 transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-accent)] sm:opacity-0 sm:group-hover:opacity-100"
          title="Focus on this (F)"
        >
          Now
        </button>
      ) : null}
    </li>
  );
}
