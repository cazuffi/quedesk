import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState } from "react";
import { parentProgress, siblingProgressFor, resolveParentTask } from "../lib/taskTree";
import { buildTaskOverflowItems } from "../lib/taskOverflowItems";
import { SubtaskSection } from "./SubtaskRow";
import { TaskItem } from "./TaskItem";
import { OverflowMenu } from "./OverflowMenu";
import { TaskDragHandle } from "./TaskDragHandle";
import { useTouchLayout } from "../hooks/useTouchLayout";
import { taskDragId, type ListEmphasis, type Task, type TaskQueue } from "../types";
import { isRecentlyCaptured } from "../lib/recentCapture";

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  subtasks: Task[];
  parentTitle?: string | null;
  isSelected?: boolean;
  emphasis?: ListEmphasis;
  showQueueBadge?: boolean;
  allowSubtasks?: boolean;
  allowReorder?: boolean;
  highlightNew?: boolean;
  batchSelectionMode?: boolean;
  batchSelected?: boolean;
  onBatchSelectToggle?: (id: string) => void;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onClear: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, queue: TaskQueue) => void;
  onAddSubtask: (parentId: string, title: string) => Promise<void>;
  onAddSubtasksBatch?: (parentId: string, titles: string[]) => Promise<Task[]>;
  onPin: (subtaskId: string, queue: TaskQueue) => void;
  onUnpin?: (surfaceId: string) => void;
  onClearDueDate?: (id: string) => void;
}

export function TaskCard({
  task,
  allTasks,
  subtasks,
  parentTitle,
  isSelected = false,
  emphasis = "default",
  showQueueBadge = false,
  allowSubtasks = true,
  allowReorder = true,
  highlightNew = false,
  batchSelectionMode = false,
  batchSelected = false,
  onBatchSelectToggle,
  onToggle,
  onEdit,
  onClear,
  onDelete,
  onMove,
  onAddSubtask,
  onAddSubtasksBatch,
  onPin,
  onUnpin,
  onClearDueDate,
}: TaskCardProps) {
  const touchLayout = useTouchLayout();
  const isToday = emphasis === "today";
  const isSurface = task.surfaceOfId !== null;
  const progress = parentProgress(subtasks);
  const hasSubtasks = subtasks.length > 0;
  const [expanded, setExpanded] = useState(hasSubtasks);
  const hadSubtasksRef = useRef(hasSubtasks);

  useEffect(() => {
    const hasSubtasksNow = subtasks.length > 0;
    if (!hadSubtasksRef.current && hasSubtasksNow) {
      setExpanded(true);
    }
    hadSubtasksRef.current = hasSubtasksNow;
  }, [subtasks.length]);

  const isNewCapture = highlightNew && isRecentlyCaptured(task);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskDragId(task.id),
    disabled: task.status === "cleared" || batchSelectionMode || !allowReorder,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  if (isSurface || !allowSubtasks) {
    const sibProgress = isSurface ? siblingProgressFor(allTasks, task) : null;
    const parentTask = isSurface ? resolveParentTask(allTasks, task) : null;

    return (
      <TaskItem
        task={task}
        emphasis={emphasis}
        parentTitle={parentTitle}
        parentTask={parentTask}
        siblingProgress={sibProgress}
        showQueueBadge={showQueueBadge}
        isSurface={isSurface}
        isSelected={isSelected}
        isNewCapture={isNewCapture}
        batchSelectionMode={batchSelectionMode}
        batchSelected={batchSelected}
        onBatchSelectToggle={onBatchSelectToggle}
        onToggle={onToggle}
        onEdit={onEdit}
        onClear={onClear}
        onDelete={onDelete}
        onMove={onMove}
        onUnpin={onUnpin}
        onClearDueDate={onClearDueDate}
        dragHandleProps={{ attributes, listeners, setNodeRef, style, isDragging }}
      />
    );
  }

  const cardOverflowItems = buildTaskOverflowItems(
    task,
    { onMove, onClear, onDelete, onUnpin },
    { isSurface: false },
  );

  const subtaskExpandButton = (mobile: boolean) => (
    <button
      type="button"
      onClick={() => setExpanded((value) => !value)}
      className={[
        "shrink-0 rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] active:bg-[var(--color-accent-soft)] active:text-[var(--color-accent)]",
        mobile
          ? "flex h-9 w-9 items-center justify-center text-sm"
          : "mt-0.5 flex items-center gap-1 px-1.5 py-0.5 text-[11px]",
      ].join(" ")}
      aria-expanded={expanded}
      aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
    >
      <span
        className="inline-block transition-transform"
        style={{ transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}
        aria-hidden
      >
        ▸
      </span>
      {!mobile ? (
        <>
          <span className="hidden sm:inline">
            Subtasks
            {hasSubtasks ? ` ${progress.done}/${progress.total}` : ""}
          </span>
          <span className="sm:hidden">
            {hasSubtasks ? `${progress.done}/${progress.total}` : ""}
          </span>
        </>
      ) : hasSubtasks ? (
        <span className="sr-only">
          {progress.done}/{progress.total} subtasks
        </span>
      ) : null}
    </button>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "group rounded-xl border bg-[var(--color-surface-raised)] px-3 py-3 transition-shadow sm:px-3.5 sm:py-2.5 sm:hover:shadow-sm",
        isToday && task.status === "completed"
          ? "border-[var(--color-border)]/80 bg-[var(--color-surface)]/80 opacity-80"
          : "",
        isToday && task.status === "active"
          ? "border-[var(--color-accent)]/20 shadow-sm"
          : "",
        isSelected
          ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20"
          : batchSelected
            ? "border-[var(--color-accent)]/50 ring-2 ring-[var(--color-accent)]/25"
            : isNewCapture && task.status === "active"
              ? "border-[var(--color-accent)]/25"
              : !isToday || task.status !== "active"
                ? "border-[var(--color-border)]"
                : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        {!batchSelectionMode && allowReorder ? (
          <TaskDragHandle attributes={attributes} listeners={listeners} />
        ) : null}

        {!batchSelectionMode && !touchLayout ? subtaskExpandButton(false) : null}

        <TaskItem
          embedded
          emphasis={emphasis}
          hideOverflowMenu
          task={task}
          isSelected={isSelected}
          isNewCapture={isNewCapture}
          batchSelectionMode={batchSelectionMode}
          batchSelected={batchSelected}
          onBatchSelectToggle={onBatchSelectToggle}
          showQueueBadge={showQueueBadge}
          progressLabel={
            hasSubtasks ? `${progress.done}/${progress.total}` : undefined
          }
          onToggle={onToggle}
          onEdit={onEdit}
          onClear={onClear}
          onDelete={onDelete}
          onMove={onMove}
          onClearDueDate={onClearDueDate}
        />

        {touchLayout && !batchSelectionMode ? (
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            <OverflowMenu items={cardOverflowItems} />
            {subtaskExpandButton(true)}
          </div>
        ) : null}
      </div>

      {expanded && (
        <div className="ml-6">
          <SubtaskSection
            parentId={task.id}
            subtasks={subtasks}
            onAddSubtask={onAddSubtask}
            onAddSubtasksBatch={onAddSubtasksBatch}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onPin={onPin}
          />
        </div>
      )}
    </div>
  );
}
