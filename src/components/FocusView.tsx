import { useMemo } from "react";
import { useConfirm } from "../contexts/ConfirmContext";
import { useTasks } from "../contexts/TasksContext";
import { useUi } from "../contexts/UiContext";
import { NextSubtaskPrompt } from "./NextSubtaskPrompt";
import { TaskList } from "./TaskList";
import { TodayQueueHeader } from "./TodayQueueHeader";

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
    <div className="flex h-full flex-col bg-gradient-to-b from-[var(--color-accent-soft)]/40 to-[var(--color-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--color-accent)]/15 px-4 py-3 sm:px-5 sm:py-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
            Focus
          </p>
          <h2 className="mt-0.5 text-lg font-semibold tracking-tight">Today only</h2>
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

      <div className="min-h-0 flex-1 overflow-auto px-4 py-3 sm:px-5 sm:py-4">
        <TodayQueueHeader tasks={todayTasks} compact />

        <div className="mb-3">
          <NextSubtaskPrompt />
        </div>

        <TaskList
          tasks={todayTasks}
          allTasks={tasks}
          emphasis="today"
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
