import { useState, type FormEvent } from "react";
import { parentProgress } from "../lib/taskTree";
import { formatDueDate, isOverdue } from "../lib/tasks";
import type { Task, TaskQueue } from "../types";
import { PromoteMenu } from "./PromoteMenu";

interface SubtaskRowProps {
  subtask: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPromote: (subtaskId: string, queue: TaskQueue) => void;
}

export function SubtaskRow({
  subtask,
  onToggle,
  onEdit,
  onDelete,
  onPromote,
}: SubtaskRowProps) {
  const completed = subtask.status === "completed";
  const overdue = isOverdue(subtask);

  return (
    <div className="flex items-start gap-2 rounded-md border border-[var(--color-border)]/70 bg-[var(--color-surface)] px-2 py-2">
      <input
        type="checkbox"
        checked={completed}
        onChange={() => onToggle(subtask)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]"
        aria-label={completed ? "Mark subtask incomplete" : "Mark subtask complete"}
      />

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => onEdit(subtask)}
          className={[
            "text-left text-xs font-medium hover:text-[var(--color-accent)]",
            completed ? "line-through text-[var(--color-text-muted)]" : "",
          ].join(" ")}
        >
          {subtask.title}
        </button>
        {subtask.dueDate && (
          <p
            className={[
              "mt-0.5 text-[10px] text-[var(--color-text-muted)]",
              overdue ? "font-medium text-red-500" : "",
            ].join(" ")}
          >
            {formatDueDate(subtask.dueDate)}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        <PromoteMenu compact onPromote={(queue) => onPromote(subtask.id, queue)} />
        <button
          type="button"
          onClick={() => onDelete(subtask.id)}
          className="text-[10px] text-red-500 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

interface SubtaskSectionProps {
  parentId: string;
  subtasks: Task[];
  onAddSubtask: (parentId: string, title: string) => Promise<void>;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPromote: (subtaskId: string, queue: TaskQueue) => void;
}

export function SubtaskSection({
  parentId,
  subtasks,
  onAddSubtask,
  onToggle,
  onEdit,
  onDelete,
  onPromote,
}: SubtaskSectionProps) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const progress = parentProgress(subtasks);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onAddSubtask(parentId, trimmed);
      setTitle("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 space-y-2 border-t border-[var(--color-border)]/70 pt-2">
      {subtasks.length > 0 ? (
        <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
          Subtasks {progress.done}/{progress.total}
        </p>
      ) : (
        <p className="text-[10px] text-[var(--color-text-muted)]">
          Break this task into smaller steps.
        </p>
      )}

      <ul className="space-y-1.5">
        {subtasks.map((subtask) => (
          <li key={subtask.id}>
            <SubtaskRow
              subtask={subtask}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onPromote={onPromote}
            />
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add subtask…"
          disabled={busy}
          className="min-w-0 flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2 py-1 text-xs outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="rounded bg-[var(--color-accent)] px-2 py-1 text-xs text-white disabled:opacity-50"
        >
          Add
        </button>
      </form>
    </div>
  );
}
