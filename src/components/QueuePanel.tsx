import { useMemo } from "react";
import { useConfirm } from "../contexts/ConfirmContext";
import { useTasks } from "../contexts/TasksContext";
import { useUi } from "../contexts/UiContext";
import type { QueueTabConfig, TaskQueue } from "../types";
import { TaskInput } from "./TaskInput";
import { TaskList } from "./TaskList";

interface QueuePanelProps {
  tab: QueueTabConfig;
  isSearchActive: boolean;
  onTaskMoved?: (queue: TaskQueue) => void;
}

export function QueuePanel({
  tab,
  isSearchActive,
  onTaskMoved,
}: QueuePanelProps) {
  const {
    tasks,
    tasksForTab,
    searchResults,
    subtasksFor,
    addTask,
    addSubtask,
    toggleComplete,
    clearOne,
    clearCompleted,
    removeTask,
    purgeAllArchive,
    moveTaskToQueue,
    promoteSubtaskToQueue,
    unpromoteSurface,
  } = useTasks();

  const { selectedTaskId, selectTask } = useUi();
  const { confirm } = useConfirm();

  const queueTasks = useMemo(() => {
    if (isSearchActive) return searchResults;
    return tasksForTab(tab.id);
  }, [isSearchActive, searchResults, tasksForTab, tab.id]);

  const completedCount = useMemo(() => {
    if (tab.id === "archive" || isSearchActive) return 0;
    return tasksForTab(tab.id).filter((t) => t.status === "completed").length;
  }, [tab.id, isSearchActive, tasksForTab]);

  const defaultQueue: TaskQueue =
    tab.id === "archive" ? "inbox" : (tab.id as TaskQueue);

  async function handleAdd(title: string) {
    await addTask({ title, queue: defaultQueue });
  }

  async function handleMove(id: string, queue: TaskQueue) {
    await moveTaskToQueue(id, queue);
    onTaskMoved?.(queue);
  }

  async function handlePromote(subtaskId: string, queue: TaskQueue) {
    await promoteSubtaskToQueue(subtaskId, queue);
    onTaskMoved?.(queue);
  }

  async function handleDelete(id: string) {
    const message =
      tab.id === "archive"
        ? "Permanently delete this archived task?"
        : "Delete this task?";
    const ok = await confirm(message, {
      confirmLabel: tab.id === "archive" ? "Delete" : "Delete",
      danger: true,
    });
    if (!ok) return;

    try {
      await removeTask(id);
      if (selectedTaskId === id) selectTask(null);
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }

  async function handlePurgeArchive() {
    const ok = await confirm(
      "Permanently delete all archived tasks? This cannot be undone.",
      { confirmLabel: "Purge all", danger: true },
    );
    if (!ok) return;

    try {
      await purgeAllArchive();
      selectTask(null);
    } catch (error) {
      console.error("Purge failed:", error);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-lg font-semibold">
          {isSearchActive ? "Search results" : tab.label}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {isSearchActive
            ? `${queueTasks.length} matching task${queueTasks.length === 1 ? "" : "s"}`
            : tab.description}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
        {!isSearchActive && tab.id !== "archive" && (
          <TaskInput
            placeholder={`Add to ${tab.label}…`}
            onAdd={handleAdd}
          />
        )}

        {!isSearchActive && completedCount > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2 text-sm">
            <span className="text-[var(--color-text-muted)]">
              {completedCount} completed — strikethrough until cleared
            </span>
            <button
              type="button"
              onClick={() => clearCompleted(tab.id as TaskQueue)}
              className="text-[var(--color-accent)] hover:underline"
            >
              Clear all to archive
            </button>
          </div>
        )}

        {!isSearchActive && tab.id === "archive" && queueTasks.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePurgeArchive}
              className="text-sm text-red-500 hover:underline"
            >
              Purge archive
            </button>
          </div>
        )}

        <TaskList
          tasks={queueTasks}
          allTasks={tasks}
          selectedTaskId={selectedTaskId}
          showQueueBadge={isSearchActive}
          allowSubtasks={!isSearchActive && tab.id !== "archive"}
          emptyMessage={
            isSearchActive
              ? "No matching tasks."
              : tab.id === "archive"
                ? "No archived tasks."
                : "No tasks yet — add one above."
          }
          onToggle={toggleComplete}
          onEdit={selectTask}
          onClear={clearOne}
          onDelete={handleDelete}
          onMove={handleMove}
          onAddSubtask={addSubtask}
          onPromote={handlePromote}
          onUnpromote={unpromoteSurface}
          subtasksFor={subtasksFor}
        />
      </div>
    </div>
  );
}
