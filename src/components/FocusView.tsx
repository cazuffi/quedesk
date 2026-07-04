import { useMemo } from "react";
import { useConfirm } from "../contexts/ConfirmContext";
import { useTasks } from "../contexts/TasksContext";
import { useUi } from "../contexts/UiContext";
import { NextSubtaskPrompt } from "./NextSubtaskPrompt";
import { TaskList } from "./TaskList";

export function FocusView() {
  const {
    tasks,
    tasksForTab,
    subtasksFor,
    toggleComplete,
    clearOne,
    removeTask,
    moveTaskToQueue,
    addSubtask,
    addSubtasksBatch,
    editTask,
    pinSubtaskToQueue,
    unpinFromQueue,
  } = useTasks();
  const { hideCompleted, toggleHideCompleted, toggleFocusMode, selectTask } =
    useUi();
  const { confirm } = useConfirm();

  const todayTasks = useMemo(() => {
    const items = tasksForTab("today");
    if (!hideCompleted) return items;
    return items.filter((t) => t.status !== "completed");
  }, [tasksForTab, hideCompleted]);

  async function handleClearDueDate(id: string) {
    await editTask(id, { dueDate: null });
  }

  async function handleDelete(id: string) {
    const ok = await confirm("Delete this task?", {
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) await removeTask(id);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Focus — Today
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {todayTasks.length} task{todayTasks.length === 1 ? "" : "s"} in view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleHideCompleted}
            className="rounded-lg bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
          >
            {hideCompleted ? "Show completed" : "Hide completed"}
          </button>
          <button
            type="button"
            onClick={toggleFocusMode}
            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-hover)] hover:shadow-md"
          >
            Exit focus
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
        <div className="mb-3">
          <NextSubtaskPrompt />
        </div>

        <TaskList
          tasks={todayTasks}
          allTasks={tasks}
          allowSubtasks
          emptyMessage="Nothing for today — exit focus to plan your day."
          onToggle={toggleComplete}
          onEdit={selectTask}
          onClear={clearOne}
          onDelete={handleDelete}
          onMove={moveTaskToQueue}
          onAddSubtask={addSubtask}
          onAddSubtasksBatch={addSubtasksBatch}
          onPin={pinSubtaskToQueue}
          onUnpin={unpinFromQueue}
          onClearDueDate={handleClearDueDate}
          subtasksFor={subtasksFor}
        />
      </div>
    </div>
  );
}
