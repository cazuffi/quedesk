import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { parentProgress } from "../lib/taskTree";
import { SubtaskSection } from "./SubtaskRow";
import { TaskItem } from "./TaskItem";
import { taskDragId, type Task, type TaskQueue } from "../types";

interface TaskCardProps {
  task: Task;
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
  onPromote: (subtaskId: string, queue: TaskQueue) => void;
  onUnpromote?: (surfaceId: string) => void;
}

export function TaskCard({
  task,
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
  onPromote,
  onUnpromote,
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
    opacity: isDragging ? 0.45 : 1,
  };

  if (isSurface || !allowSubtasks) {
    return (
      <TaskItem
        task={task}
        parentTitle={parentTitle}
        showQueueBadge={showQueueBadge}
        isSurface={isSurface}
        isSelected={isSelected}
        onToggle={onToggle}
        onEdit={onEdit}
        onClear={onClear}
        onDelete={onDelete}
        onMove={onMove}
        onUnpromote={onUnpromote}
        dragHandleProps={{ attributes, listeners, setNodeRef, style, isDragging }}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "rounded-lg border bg-[var(--color-surface-raised)] p-3",
        isSelected
          ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/25"
          : "border-[var(--color-border)]",
        isDragging ? "shadow-md" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none text-[var(--color-text-muted)] hover:text-[var(--color-text)] active:cursor-grabbing"
          aria-label="Drag to reorder or drop on a tab"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-0.5 flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
        >
          <span aria-hidden>{expanded ? "▾" : "▸"}</span>
          <span>
            Subtasks
            {hasSubtasks ? ` ${progress.done}/${progress.total}` : ""}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <TaskItem
            embedded
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
          />
        </div>
      </div>

      {expanded && (
        <div className="ml-6">
          <SubtaskSection
            parentId={task.id}
            subtasks={subtasks}
            onAddSubtask={onAddSubtask}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onPromote={onPromote}
          />
        </div>
      )}
    </div>
  );
}
