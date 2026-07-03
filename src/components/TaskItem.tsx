import type { CSSProperties } from "react";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoveToMenu } from "./MoveToMenu";
import { formatDueDate, isOverdue } from "../lib/tasks";
import { sourceLinkHref } from "../lib/sourceLink";
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
  progressLabel?: string;
  showQueueBadge?: boolean;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onClear: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, queue: TaskQueue) => void;
  onUnpromote?: (surfaceId: string) => void;
  dragHandleProps?: DragHandleProps;
}

export function TaskItem({
  task,
  embedded = false,
  isSurface = false,
  isSelected = false,
  parentTitle,
  progressLabel,
  showQueueBadge = false,
  onToggle,
  onEdit,
  onClear,
  onDelete,
  onMove,
  onUnpromote,
  dragHandleProps,
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
      opacity: sortable.isDragging ? 0.45 : 1,
    },
    isDragging: sortable.isDragging,
  };

  const completed = task.status === "completed";
  const overdue = isOverdue(task);

  const content = (
    <>
      {!isCleared && !embedded && !dragHandleProps && (
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:cursor-grabbing"
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
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className={[
              "text-left text-sm font-medium hover:text-[var(--color-accent)]",
              completed ? "line-through text-[var(--color-text-muted)]" : "",
            ].join(" ")}
          >
            {task.title}
          </button>

          {progressLabel && (
            <span className="rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
              {progressLabel}
            </span>
          )}

          {isSurface && parentTitle && (
            <span className="rounded bg-[var(--color-accent)]/10 px-1.5 py-0.5 text-[10px] text-[var(--color-accent)]">
              ↗ {parentTitle}
            </span>
          )}

          {showQueueBadge && (
            <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
              {task.queue}
            </span>
          )}
        </div>

        {(task.dueDate || task.tags.length > 0 || task.sourceLink) && (
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
            {task.dueDate && (
              <span className={overdue ? "font-medium text-red-500" : ""}>
                {formatDueDate(task.dueDate)}
              </span>
            )}
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--color-border)] px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
            {task.sourceLink && (
              <a
                href={sourceLinkHref(task.sourceLink)}
                target="_blank"
                rel="noreferrer"
                className="text-[var(--color-accent)] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Source
              </a>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!isCleared && completed && !isSurface && (
          <button
            type="button"
            onClick={() => onClear(task.id)}
            className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            title="Clear to archive"
          >
            Clear
          </button>
        )}

        {isSurface && onUnpromote && (
          <button
            type="button"
            onClick={() => onUnpromote(task.id)}
            className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            title="Remove from this queue"
          >
            Unpromote
          </button>
        )}

        {!isCleared && !isSurface && (
          <MoveToMenu
            currentQueue={task.queue}
            onMove={(queue) => onMove(task.id, queue)}
          />
        )}

        {!isCleared && isSurface && (
          <MoveToMenu
            currentQueue={task.queue}
            onMove={(queue) => onMove(task.id, queue)}
          />
        )}

        <button
          type="button"
          onClick={() => onEdit(task)}
          className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-500/10"
        >
          Delete
        </button>
      </div>
    </>
  );

  if (embedded) {
    return <div className="flex items-start gap-2">{content}</div>;
  }

  return (
    <div
      ref={drag.setNodeRef}
      style={drag.style}
      className={[
        "group flex items-start gap-2 rounded-lg border bg-[var(--color-surface-raised)] p-3",
        isSelected
          ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/25"
          : "border-[var(--color-border)]",
        drag.isDragging ? "shadow-md" : "",
      ].join(" ")}
    >
      {content}
    </div>
  );
}
