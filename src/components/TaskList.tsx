import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { resolveParentTitle } from "../lib/taskTree";
import { TaskCard } from "./TaskCard";
import { taskDragId, type ListEmphasis, type Task, type TaskQueue } from "../types";

interface TaskListProps {
  tasks: Task[];
  allTasks: Task[];
  selectedTaskId?: string | null;
  emphasis?: ListEmphasis;
  showQueueBadge?: boolean;
  allowSubtasks?: boolean;
  highlightNew?: boolean;
  batchSelectionMode?: boolean;
  selectedBatchIds?: Set<string>;
  onBatchSelectToggle?: (id: string) => void;
  emptyMessage?: string;
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
  subtasksFor: (parentId: string) => Task[];
}

export function TaskList({
  tasks,
  allTasks,
  selectedTaskId = null,
  emphasis = "default",
  showQueueBadge = false,
  allowSubtasks = true,
  highlightNew = false,
  batchSelectionMode = false,
  selectedBatchIds,
  onBatchSelectToggle,
  emptyMessage = "No tasks yet — add one above.",
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
  subtasksFor,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-[var(--color-text-muted)]">
        {emptyMessage}
      </p>
    );
  }

  const ids = tasks
    .filter((t) => t.status !== "cleared")
    .map((t) => taskDragId(t.id));

  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <ul className="space-y-1.5">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskCard
              task={task}
              allTasks={allTasks}
              subtasks={subtasksFor(task.id)}
              parentTitle={resolveParentTitle(allTasks, task)}
              isSelected={task.id === selectedTaskId}
              emphasis={emphasis}
              showQueueBadge={showQueueBadge}
              allowSubtasks={allowSubtasks}
              highlightNew={highlightNew}
              batchSelectionMode={batchSelectionMode}
              batchSelected={selectedBatchIds?.has(task.id) ?? false}
              onBatchSelectToggle={onBatchSelectToggle}
              onToggle={onToggle}
              onEdit={onEdit}
              onClear={onClear}
              onDelete={onDelete}
              onMove={onMove}
              onAddSubtask={onAddSubtask}
              onAddSubtasksBatch={onAddSubtasksBatch}
              onPin={onPin}
              onUnpin={onUnpin}
              onClearDueDate={onClearDueDate}
            />
          </li>
        ))}
      </ul>
    </SortableContext>
  );
}
