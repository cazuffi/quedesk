import type { CSSProperties } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoveToMenu } from "./MoveToMenu";
import { OverflowMenu } from "./OverflowMenu";
import { formatDueDate, isOverdue } from "../lib/data";
import { buildTaskOverflowItems } from "../lib/taskOverflowItems";
import { openSourceLink } from "../lib/sourceLink";
import { taskDragId, type Task, type TaskQueue } from "../types";

interface DragHandleProps {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  setNodeRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
  isDragging: boolean;
}

interface TaskItemProps {
  task: Task;
  embedded?: boolean;
  isSurface?: boolean;
  isSelected?: boolean;
  parentTitle?: string | null;
  parentTask?: Task | null;
  siblingProgress?: { done: number; total: number } | null;
  progressLabel?: string;
  showQueueBadge?: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onClear: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, queue: TaskQueue) => void;
  onUnpin?: (surfaceId: string) => void;
  onClearDueDate?: (id: string) => void;
  dragHandleProps?: DragHandleProps;
  hideOverflowMenu?: boolean;
  hideTouchActions?: boolean;
}

export function TaskItem({
  task,
  embedded = false,
  isSurface = false,
  isSelected = false,
  parentTitle,
  parentTask,
  siblingProgress,
  progressLabel,
  showQueueBadge = false,
  onToggle,
  onEdit,
  onClear,
  onDelete,
  onMove,
  onUnpin,
  onClearDueDate,
  dragHandleProps,
  hideOverflowMenu = false,
  hideTouchActions = false,
}: TaskItemProps) {
  const isCleared = task.status === "cleared";

  const sortable = useSortable({
    id: taskDragId(task.id),
    disabled: isCleared || embedded || Boolean(dragHandleProps),
  });

  const drag = dragHandleProps ?? {
    attributes: sortable.attributes,
    listeners: sortable.listeners,
    setNodeRef: sortable.setNodeRef,
    style: {
      transform: CSS.Transform.toString(sortable.transform),
      transition: sortable.transition,
      opacity: sortable.isDragging ? 0 : 1,
    },
    isDragging: sortable.isDragging,
  };

  const completed = task.status === "completed";
  const overdue = isOverdue(task);

  const mobileMenuItems = buildTaskOverflowItems(
    task,
    { onMove, onClear, onDelete, onUnpin },
    { isSurface },
  );

  const content = (
    <>
      {!isCleared && !embedded && !dragHandleProps && (
        <button
          type="button"
          className="mt-0.5 hidden cursor-grab touch-none text-[var(--color-text-muted)]/50 transition-colors hover:text-[var(--color-text-muted)] active:cursor-grabbing sm:block"
          aria-label="Drag to reorder or drop on a tab"
          {...drag.attributes}
          {...drag.listeners}
        >
          ⠿
        </button>
      )}

      {!isCleared ? (
        <input
          type="checkbox"
          checked={completed}
          onChange={() => onToggle(task)}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded accent-[var(--color-accent)] sm:mt-1 sm:h-3.5 sm:w-3.5"
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
        />
      ) : null}

      <div className="min-w-0 flex-1">
        {isSurface && parentTitle && (
          <div className="mb-0.5 flex items-center gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => parentTask && onEdit(parentTask)}
              className="truncate text-[var(--color-accent)] transition-colors hover:underline"
            >
              {parentTitle}
            </button>
            <span className="text-[var(--color-text-muted)]">›</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className={[
              "text-left text-base leading-snug transition-colors active:text-[var(--color-accent)] sm:text-sm sm:hover:text-[var(--color-accent)]",
              completed
                ? "line-through text-[var(--color-text-muted)]"
                : "font-medium",
            ].join(" ")}
          >
            {task.title}
          </button>

          {progressLabel && (
            <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-accent)]">
              {progressLabel}
            </span>
          )}

          {showQueueBadge && (
            <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              {task.queue}
            </span>
          )}
        </div>

        {(task.dueDate || task.tags.length > 0 || task.sourceLink) && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--color-text-muted)]">
            {task.dueDate && (
              <span
                className={[
                  "inline-flex items-center gap-0.5",
                  overdue && !completed
                    ? "font-medium text-[var(--color-danger)]"
                    : "",
                ].join(" ")}
              >
                {formatDueDate(task.dueDate)}
                {onClearDueDate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearDueDate(task.id);
                    }}
                    className="ml-0.5 rounded-full p-0.5 text-[9px] opacity-60 transition-opacity active:opacity-100 sm:opacity-0 sm:group-hover:opacity-60 sm:group-hover:hover:opacity-100"
                    title="Clear due date"
                  >
                    ✕
                  </button>
                )}
              </span>
            )}
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--color-surface)] px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
            {task.sourceLink && (
              <button
                type="button"
                className="text-[var(--color-accent)] transition-colors hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  openSourceLink(task.sourceLink!);
                }}
              >
                Source ↗
              </button>
            )}
          </div>
        )}

        {isSurface && siblingProgress && siblingProgress.total > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-border)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all"
                style={{
                  width: `${(siblingProgress.done / siblingProgress.total) * 100}%`,
                }}
              />
            </div>
            <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">
              {siblingProgress.done}/{siblingProgress.total}
            </span>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!hideOverflowMenu && (
          <div className="pointer-fine:hidden">
            <OverflowMenu items={mobileMenuItems} />
          </div>
        )}

        {!hideTouchActions && (
          <div className="pointer-fine:hidden">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs font-medium text-[var(--color-accent)] shadow-sm transition-colors active:bg-[var(--color-accent-soft)]"
            >
              Edit
            </button>
          </div>
        )}

        <div className="hidden items-center gap-0.5 opacity-0 transition-opacity pointer-fine:flex pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100">
        {!isCleared && completed && !isSurface && (
          <button
            type="button"
            onClick={() => onClear(task.id)}
            className="rounded-md px-2 py-1 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          >
            Clear
          </button>
        )}

        {isSurface && onUnpin && (
          <button
            type="button"
            onClick={() => onUnpin(task.id)}
            className="rounded-md px-2 py-1 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          >
            Unpin
          </button>
        )}

        {!isCleared && (
          <MoveToMenu
            currentQueue={task.queue}
            onMove={(queue) => onMove(task.id, queue)}
          />
        )}

        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded-md px-2 py-1 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded-md px-2 py-1 text-[11px] text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)]"
        >
          Delete
        </button>
        </div>
      </div>
    </>
  );

  if (embedded) {
    return <div className="group flex items-start gap-2">{content}</div>;
  }

  return (
    <div
      ref={drag.setNodeRef}
      style={drag.style}
      className={[
        "group flex items-start gap-2 rounded-xl border bg-[var(--color-surface-raised)] px-3.5 py-2.5 transition-shadow hover:shadow-sm",
        isSurface ? "border-l-2 border-l-[var(--color-accent)]" : "",
        isSelected
          ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20"
          : isSurface
            ? "border-[var(--color-border)] border-l-[var(--color-accent)]"
            : "border-[var(--color-border)]",
      ].join(" ")}
    >
      {content}
    </div>
  );
}
