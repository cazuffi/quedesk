import { useMemo, useState } from "react";
import { useConfirm } from "../contexts/ConfirmContext";
import { useTasks } from "../contexts/TasksContext";
import { useUi } from "../contexts/UiContext";
import { countRecentlyCaptured } from "../lib/recentCapture";
import type { QueueTabConfig, TaskQueue } from "../types";
import { InboxBatchBar, InboxTriageHint } from "./InboxBatchBar";
import { NextSubtaskPrompt } from "./NextSubtaskPrompt";
import { TaskInput } from "./TaskInput";
import { TaskList } from "./TaskList";
import { TodayQueueHeader } from "./TodayQueueHeader";

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
    addSubtasksBatch,
    editTask,
    toggleComplete,
    clearOne,
    clearCompleted,
    removeTask,
    purgeAllArchive,
    moveTaskToQueue,
    pinSubtaskToQueue,
    unpinFromQueue,
  } = useTasks();

  const { selectedTaskId, selectTask } = useUi();
  const { confirm } = useConfirm();
  const [batchMode, setBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const isInboxTab = tab.id === "inbox" && !isSearchActive;

  const queueTasks = useMemo(() => {
    if (isSearchActive) return searchResults;
    return tasksForTab(tab.id);
  }, [isSearchActive, searchResults, tasksForTab, tab.id]);

  const completedCount = useMemo(() => {
    if (tab.id === "archive" || isSearchActive) return 0;
    return tasksForTab(tab.id).filter((t) => t.status === "completed").length;
  }, [tab.id, isSearchActive, tasksForTab]);

  const newCaptureCount = useMemo(
    () => (isInboxTab ? countRecentlyCaptured(queueTasks) : 0),
    [isInboxTab, queueTasks],
  );

  const selectableInboxIds = useMemo(
    () =>
      queueTasks.filter((task) => task.status !== "cleared").map((task) => task.id),
    [queueTasks],
  );

  function toggleBatchSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function startBatchMode() {
    setBatchMode(true);
    setSelectedIds(new Set());
  }

  function exitBatchMode() {
    setBatchMode(false);
    setSelectedIds(new Set());
  }

  function selectAllInbox() {
    setSelectedIds(new Set(selectableInboxIds));
  }

  async function handleBatchMove(queue: TaskQueue) {
    const ids = [...selectedIds];
    for (const id of ids) {
      await moveTaskToQueue(id, queue);
    }
    exitBatchMode();
    onTaskMoved?.(queue);
  }

  const defaultQueue: TaskQueue =
    tab.id === "archive" ? "inbox" : (tab.id as TaskQueue);

  async function handleAdd(title: string) {
    await addTask({ title, queue: defaultQueue });
  }

  async function handleMove(id: string, queue: TaskQueue) {
    await moveTaskToQueue(id, queue);
    onTaskMoved?.(queue);
  }

  async function handlePin(subtaskId: string, queue: TaskQueue) {
    await pinSubtaskToQueue(subtaskId, queue);
    onTaskMoved?.(queue);
  }

  async function handleClearDueDate(id: string) {
    await editTask(id, { dueDate: null });
  }

  async function handleDelete(id: string) {
    const message =
      tab.id === "archive"
        ? "Permanently delete this archived task?"
        : "Delete this task?";
    const ok = await confirm(message, {
      confirmLabel: "Delete",
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

  const isTodayTab = tab.id === "today" && !isSearchActive;
  const listEmphasis = isTodayTab ? "today" : "default";

  return (
    <div className="flex h-full flex-col">
      {isTodayTab ? (
        <TodayQueueHeader tasks={queueTasks} />
      ) : (
        <div className="px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-lg font-semibold tracking-tight sm:text-base">
            {isSearchActive ? "Search results" : tab.label}
          </h2>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {isSearchActive
              ? `${queueTasks.length} matching task${queueTasks.length === 1 ? "" : "s"}`
              : tab.description}
          </p>
        </div>
      )}

      <div
        className={[
          "flex min-h-0 flex-1 flex-col gap-3 overflow-auto px-4 pb-5 sm:px-5",
          isTodayTab ? "pt-3" : "",
        ].join(" ")}
      >
        <NextSubtaskPrompt />

        {!isSearchActive && tab.id !== "archive" && (
          <TaskInput
            placeholder={
              isTodayTab ? "Add something for today…" : `Add to ${tab.label}…`
            }
            variant={isTodayTab ? "secondary" : "primary"}
            onAdd={handleAdd}
          />
        )}

        {!isSearchActive && completedCount > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-[var(--color-border)] px-3.5 py-2 text-xs">
            <span className="text-[var(--color-text-muted)]">
              {completedCount} completed
            </span>
            <button
              type="button"
              onClick={() => clearCompleted(tab.id as TaskQueue)}
              className="font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
            >
              Clear to archive
            </button>
          </div>
        )}

        {!isSearchActive && tab.id === "archive" && queueTasks.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePurgeArchive}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)]"
            >
              Purge archive
            </button>
          </div>
        )}

        {isInboxTab && !batchMode && queueTasks.length > 0 ? (
          <InboxTriageHint
            newCount={newCaptureCount}
            onStartSelect={startBatchMode}
          />
        ) : null}

        <TaskList
          tasks={queueTasks}
          allTasks={tasks}
          selectedTaskId={selectedTaskId}
          emphasis={listEmphasis}
          showQueueBadge={isSearchActive}
          allowSubtasks={!isSearchActive}
          allowReorder={!isSearchActive && tab.id !== "archive"}
          highlightNew={isInboxTab}
          batchSelectionMode={isInboxTab && batchMode}
          selectedBatchIds={selectedIds}
          onBatchSelectToggle={toggleBatchSelect}
          emptyMessage={
            isSearchActive
              ? "No matching tasks."
              : tab.id === "archive"
                ? "No archived tasks."
                : tab.id === "inbox"
                  ? "Nothing in inbox — capture with Action Button or add below."
                  : "No tasks yet — add one above."
          }
          onToggle={toggleComplete}
          onEdit={selectTask}
          onClear={clearOne}
          onDelete={handleDelete}
          onMove={handleMove}
          onAddSubtask={addSubtask}
          onAddSubtasksBatch={addSubtasksBatch}
          onPin={handlePin}
          onUnpin={unpinFromQueue}
          onClearDueDate={handleClearDueDate}
          subtasksFor={subtasksFor}
        />

        {isInboxTab && batchMode ? (
          <InboxBatchBar
            selectedCount={selectedIds.size}
            totalCount={selectableInboxIds.length}
            onCancel={exitBatchMode}
            onSelectAll={selectAllInbox}
            onMove={handleBatchMove}
          />
        ) : null}
      </div>
    </div>
  );
}
