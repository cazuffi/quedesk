import { useMemo, useState } from "react";
import { TasksProvider, useTasks } from "./contexts/TasksContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { formatDueDate, isOverdue } from "./lib/data";
import { showMainWindow } from "./lib/tasksEvents";
import type { Task } from "./types";

function WidgetTaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (task: Task) => void;
}) {
  const completed = task.status === "completed";
  const overdue = isOverdue(task);

  return (
    <li className="flex items-start gap-2 rounded-xl bg-[var(--color-surface-raised)] px-3 py-2 transition-colors hover:shadow-sm">
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(task)}
        className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded accent-[var(--color-accent)]"
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
      />
      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-xs leading-snug",
            completed
              ? "text-[var(--color-text-muted)] line-through"
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
                ? "text-[var(--color-danger)]"
                : "text-[var(--color-text-muted)]",
            ].join(" ")}
          >
            {formatDueDate(task.dueDate)}
          </p>
        )}
      </div>
    </li>
  );
}

function TodayWidgetContent() {
  const { tasksForTab, toggleComplete, loading } = useTasks();
  const [hideCompleted, setHideCompleted] = useState(false);

  const todayTasks = useMemo(() => {
    const items = tasksForTab("today");
    if (!hideCompleted) return items;
    return items.filter((t) => t.status !== "completed");
  }, [tasksForTab, hideCompleted]);

  const activeCount = todayTasks.filter((t) => t.status === "active").length;

  return (
    <div className="flex h-full flex-col bg-[var(--color-surface)]">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-3 py-2.5">
        <div className="min-w-0">
          <h1 className="text-xs font-semibold tracking-tight">Today</h1>
          <p className="text-[10px] text-[var(--color-text-muted)]">
            {loading
              ? "Loading…"
              : `${activeCount} active · ${todayTasks.length} total`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setHideCompleted((v) => !v)}
            className="rounded-md px-2 py-1 text-[10px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]"
            title={hideCompleted ? "Show completed" : "Hide completed"}
          >
            {hideCompleted ? "Show done" : "Hide done"}
          </button>
          <button
            type="button"
            onClick={() => showMainWindow()}
            className="rounded-lg bg-[var(--color-accent)] px-2.5 py-1 text-[10px] font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-hover)] hover:shadow-md"
          >
            Open app
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
        {todayTasks.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-[var(--color-text-muted)]">
            Nothing for today.
          </p>
        ) : (
          <ul className="space-y-1">
            {todayTasks.map((task) => (
              <WidgetTaskRow
                key={task.id}
                task={task}
                onToggle={toggleComplete}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function TodayWidgetApp() {
  return (
    <ThemeProvider>
      <TasksProvider>
        <TodayWidgetContent />
      </TasksProvider>
    </ThemeProvider>
  );
}
