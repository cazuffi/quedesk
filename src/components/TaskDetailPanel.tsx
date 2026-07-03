import { useEffect, useState, type FormEvent } from "react";
import { useConfirm } from "../contexts/ConfirmContext";
import { resolveParentTitle } from "../lib/taskTree";
import { formatDueDate, isOverdue } from "../lib/tasks";
import type { PanelLayout } from "../contexts/UiContext";
import type { Task, TaskQueue } from "../types";
import { queueTabLabel } from "../types";
import { MarkdownNotes } from "./MarkdownNotes";
import { MoveToMenu } from "./MoveToMenu";

interface TaskDetailPanelProps {
  task: Task;
  allTasks: Task[];
  layout: PanelLayout;
  onClose: () => void;
  onExpand: () => void;
  onCollapse: () => void;
  onSave: (
    id: string,
    data: {
      title: string;
      notes: string;
      dueDate: string | null;
      tags: string[];
      sourceLink: string | null;
    },
  ) => Promise<void>;
  onToggle: (task: Task) => void;
  onMove: (id: string, queue: TaskQueue) => void;
  onDelete: (id: string) => void;
}

export function TaskDetailPanel({
  task,
  allTasks,
  layout,
  onClose,
  onExpand,
  onCollapse,
  onSave,
  onToggle,
  onMove,
  onDelete,
}: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [tags, setTags] = useState(task.tags.join(", "));
  const [sourceLink, setSourceLink] = useState(task.sourceLink ?? "");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const { confirm } = useConfirm();

  const parentTitle = resolveParentTitle(allTasks, task);
  const isSurface = task.surfaceOfId !== null;
  const completed = task.status === "completed";
  const overdue = isOverdue(task);

  useEffect(() => {
    setTitle(task.title);
    setNotes(task.notes);
    setDueDate(task.dueDate ?? "");
    setTags(task.tags.join(", "));
    setSourceLink(task.sourceLink ?? "");
    setDirty(false);
  }, [task]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (layout === "full") onCollapse();
        else onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layout, onClose, onCollapse]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await onSave(task.id, {
        title: title.trim(),
        notes,
        dueDate: dueDate || null,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        sourceLink: sourceLink.trim() || null,
      });
      setDirty(false);
    } finally {
      setBusy(false);
    }
  }

  function markDirty<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setDirty(true);
  }

  const shellClass =
    layout === "full"
      ? "fixed inset-0 z-40 flex flex-col bg-[var(--color-surface)]"
      : "flex h-full w-full max-w-md shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-raised)]";

  return (
    <aside className={shellClass} aria-label="Task details">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            Task details
          </p>
          <p className="truncate text-sm text-[var(--color-text-muted)]">
            {queueTabLabel(task.queue)}
            {parentTitle ? ` · ↗ ${parentTitle}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {layout === "side" ? (
            <button
              type="button"
              onClick={onExpand}
              className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Expand to full view"
            >
              Expand
            </button>
          ) : (
            <button
              type="button"
              onClick={onCollapse}
              className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
              title="Back to side panel"
            >
              Side panel
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          >
            Close
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-start gap-3">
            {task.status !== "cleared" && (
              <input
                type="checkbox"
                checked={completed}
                onChange={() => onToggle(task)}
                className="mt-2 h-4 w-4 accent-[var(--color-accent)]"
              />
            )}
            <label className="min-w-0 flex-1 text-sm">
              <span className="mb-1 block text-[var(--color-text-muted)]">
                Title
              </span>
              <input
                value={title}
                onChange={(e) => markDirty(setTitle, e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base font-medium outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          </div>

          <div className="grid gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-[var(--color-text-muted)]">
                Due date
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => markDirty(setDueDate, e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
              />
              {task.dueDate && (
                <span
                  className={[
                    "mt-1 block text-xs",
                    overdue ? "text-red-500" : "text-[var(--color-text-muted)]",
                  ].join(" ")}
                >
                  {formatDueDate(task.dueDate)}
                </span>
              )}
            </label>

            {!isSurface && task.status !== "cleared" && (
              <div className="block text-sm">
                <span className="mb-1 block text-[var(--color-text-muted)]">
                  Queue
                </span>
                <MoveToMenu
                  currentQueue={task.queue}
                  onMove={(queue) => onMove(task.id, queue)}
                />
              </div>
            )}
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-text-muted)]">
              Tags (comma-separated)
            </span>
            <input
              value={tags}
              onChange={(e) => markDirty(setTags, e.target.value)}
              placeholder="work, urgent"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-[var(--color-text-muted)]">
              Source link
            </span>
            <input
              value={sourceLink}
              onChange={(e) => markDirty(setSourceLink, e.target.value)}
              placeholder="Link or path — with or without https://"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <div className="text-sm">
            <span className="mb-1 block text-[var(--color-text-muted)]">
              Notes (Markdown)
            </span>
            <MarkdownNotes
              value={notes}
              onChange={(value) => markDirty(setNotes, value)}
              compact={layout === "side"}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
          <button
            type="button"
            onClick={async () => {
              const ok = await confirm("Delete this task?", {
                confirmLabel: "Delete",
                danger: true,
              });
              if (ok) onDelete(task.id);
            }}
            className="text-sm text-red-500 hover:underline"
          >
            Delete
          </button>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="text-xs text-[var(--color-text-muted)]">
                Unsaved changes
              </span>
            )}
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}
