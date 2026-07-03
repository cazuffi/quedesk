import { useMemo } from "react";
import { useConfirm } from "../contexts/ConfirmContext";
import { useTasks } from "../contexts/TasksContext";
import { useUi } from "../contexts/UiContext";
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
    promoteSubtaskToQueue,
    unpromoteSurface,
  } = useTasks();
  const { hideCompleted, toggleHideCompleted, toggleFocusMode, selectTask } =
    useUi();
  const { confirm } = useConfirm();

  const todayTasks = useMemo(() => {
    const items = tasksForTab("today");
    if (!hideCompleted) return items;
    return items.filter((t) => t.status !== "completed");
  }, [tasksForTab, hideCompleted]);

  async function handleDelete(id: string) {
    const ok = await confirm("Delete this task?", {
      confirmLabel: "Delete",
      danger: true,
    });
    if (ok) await removeTask(id);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold">Focus — Today</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {todayTasks.length} task{todayTasks.length === 1 ? "" : "s"} in view
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleHideCompleted}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:border-[var(--color-accent)]"
          >
            {hideCompleted ? "Show completed" : "Hide completed"}
          </button>
          <button
            type="button"
            onClick={toggleFocusMode}
            className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            Exit focus
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
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
          onPromote={promoteSubtaskToQueue}
          onUnpromote={unpromoteSurface}
          subtasksFor={subtasksFor}
        />
      </div>
    </div>
  );
}
