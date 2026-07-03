import { useMemo, useState } from "react";
import { TasksProvider, useTasks } from "./contexts/TasksContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { formatDueDate, isOverdue } from "./lib/tasks";
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
    <li className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2">
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(task)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
      />
      <div className="min-w-0 flex-1">
        <p
          className={[
            "text-sm leading-snug",
            completed
              ? "text-[var(--color-text-muted)] line-through"
              : "text-[var(--color-text)]",
          ].join(" ")}
        >
          {task.title}
        </p>
        {task.dueDate && (
          <p
            className={[
              "mt-0.5 text-xs",
              overdue && !completed
                ? "text-red-500"
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
          <h1 className="text-sm font-semibold">Today</h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {loading
              ? "Loading…"
              : `${activeCount} active · ${todayTasks.length} total`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setHideCompleted((v) => !v)}
            className="rounded px-2 py-1 text-[10px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]"
            title={hideCompleted ? "Show completed" : "Hide completed"}
          >
            {hideCompleted ? "Show done" : "Hide done"}
          </button>
          <button
            type="button"
            onClick={() => showMainWindow()}
            className="rounded bg-[var(--color-accent)] px-2 py-1 text-[10px] font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            Open app
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {todayTasks.length === 0 ? (
          <p className="py-6 text-center text-xs text-[var(--color-text-muted)]">
            Nothing for today.
          </p>
        ) : (
          <ul className="space-y-1.5">
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
