import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { parentProgress, siblingProgressFor, resolveParentTask } from "../lib/taskTree";
import { buildTaskOverflowItems } from "../lib/taskOverflowItems";
import { SubtaskSection } from "./SubtaskRow";
import { TaskItem } from "./TaskItem";
import { OverflowMenu } from "./OverflowMenu";
import { taskDragId, type Task, type TaskQueue } from "../types";

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  subtasks: Task[];
  parentTitle?: string | null;
  isSelected?: boolean;
  showQueueBadge?: boolean;
  allowSubtasks?: boolean;
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
  showQueueBadge = false,
  allowSubtasks = true,
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
  const isSurface = task.surfaceOfId !== null;
  const progress = parentProgress(subtasks);
  const hasSubtasks = subtasks.length > 0;
  const [expanded, setExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskDragId(task.id),
    disabled: task.status === "cleared",
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
        parentTitle={parentTitle}
        parentTask={parentTask}
        siblingProgress={sibProgress}
        showQueueBadge={showQueueBadge}
        isSurface={isSurface}
        isSelected={isSelected}
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "group rounded-xl border bg-[var(--color-surface-raised)] px-3 py-3 transition-shadow sm:px-3.5 sm:py-2.5 sm:hover:shadow-sm",
        isSelected
          ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20"
          : "border-[var(--color-border)]",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 hidden cursor-grab touch-none text-[var(--color-text-muted)]/50 transition-colors hover:text-[var(--color-text-muted)] active:cursor-grabbing sm:block"
          aria-label="Drag to reorder or drop on a tab"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-0.5 flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
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
          <span className="hidden sm:inline">
            Subtasks
            {hasSubtasks ? ` ${progress.done}/${progress.total}` : ""}
          </span>
          <span className="sm:hidden">
            {hasSubtasks ? `${progress.done}/${progress.total}` : ""}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <TaskItem
            embedded
            hideOverflowMenu
            hideTouchActions
            task={task}
            isSelected={isSelected}
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
        </div>

        <div className="pointer-fine:hidden flex shrink-0 items-center gap-1">
          <OverflowMenu items={cardOverflowItems} />
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs font-medium text-[var(--color-accent)] shadow-sm transition-colors active:bg-[var(--color-accent-soft)]"
          >
            Edit
          </button>
        </div>
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
