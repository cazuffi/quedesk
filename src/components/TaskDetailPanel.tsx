import { useEffect, useState, type FormEvent } from "react";
import { useConfirm } from "../contexts/ConfirmContext";
import { resolveParentTitle } from "../lib/taskTree";
import { formatDueDate, isOverdue } from "../lib/data";
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
      : "hidden sm:flex h-full w-full max-w-md shrink-0 flex-col border-l border-[var(--color-border)] bg-[var(--color-surface-raised)]";

  return (
    <aside className={shellClass} aria-label="Task details">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-3">
        <div className="min-w-0">
          {layout === "full" && (
            <button
              type="button"
              onClick={onCollapse}
              className="mb-1 flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] transition-colors active:opacity-70 sm:hidden"
            >
              ‹ Back
            </button>
          )}
          <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
            Task details
          </p>
          <p className="truncate text-xs text-[var(--color-text-muted)]">
            {queueTabLabel(task.queue)}
            {parentTitle ? ` · ↗ ${parentTitle}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {layout === "side" && (
            <button
              type="button"
              onClick={onExpand}
              className="hidden rounded-md px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] sm:block"
              title="Expand to full view"
            >
              Expand
            </button>
          )}
          {layout === "full" && (
            <button
              type="button"
              onClick={onCollapse}
              className="hidden rounded-md px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] sm:block"
              title="Back to side panel"
            >
              Side panel
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="hidden rounded-md px-2.5 py-1 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] sm:block"
          >
            Close
          </button>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            {task.status !== "cleared" && (
              <input
                type="checkbox"
                checked={completed}
                onChange={() => onToggle(task)}
                className="mt-2.5 h-4 w-4 cursor-pointer accent-[var(--color-accent)]"
              />
            )}
            <label className="min-w-0 flex-1 text-sm">
              <span className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
                Title
              </span>
              <input
                value={title}
                onChange={(e) => markDirty(setTitle, e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-base font-medium outline-none transition-colors focus:border-[var(--color-accent)]"
              />
            </label>
          </div>

          <div className="grid gap-3">
            <div className="block text-sm">
              <span className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
                Due date
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => markDirty(setDueDate, e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 outline-none transition-colors focus:border-[var(--color-accent)]"
                />
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => markDirty(setDueDate, "")}
                    className="shrink-0 rounded-lg px-2.5 py-2 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)]"
                    title="Clear due date"
                  >
                    Clear
                  </button>
                )}
              </div>
              {task.dueDate && (
                <span
                  className={[
                    "mt-1 block text-[11px]",
                    overdue
                      ? "text-[var(--color-danger)]"
                      : "text-[var(--color-text-muted)]",
                  ].join(" ")}
                >
                  {formatDueDate(task.dueDate)}
                </span>
              )}
            </div>

            {!isSurface && task.status !== "cleared" && (
              <div className="block text-sm">
                <span className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
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
            <span className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
              Tags (comma-separated)
            </span>
            <input
              value={tags}
              onChange={(e) => markDirty(setTags, e.target.value)}
              placeholder="work, urgent"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
              Source link
            </span>
            <input
              value={sourceLink}
              onChange={(e) => markDirty(setSourceLink, e.target.value)}
              placeholder="Link or path — with or without https://"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
            />
          </label>

          <div className="text-sm">
            <span className="mb-1 block text-[11px] font-medium text-[var(--color-text-muted)]">
              Notes (Markdown)
            </span>
            <MarkdownNotes
              value={notes}
              onChange={(value) => markDirty(setNotes, value)}
              compact={layout === "side"}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-3">
          <button
            type="button"
            onClick={async () => {
              const ok = await confirm("Delete this task?", {
                confirmLabel: "Delete",
                danger: true,
              });
              if (ok) onDelete(task.id);
            }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)]"
          >
            Delete
          </button>
          <div className="flex items-center gap-2">
            {dirty && (
              <span className="text-[11px] text-[var(--color-text-muted)]">
                Unsaved
              </span>
            )}
            <button
              type="submit"
              disabled={busy || !title.trim()}
              className="rounded-xl bg-[var(--color-accent)] px-5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-hover)] hover:shadow-md disabled:opacity-40 disabled:shadow-none"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </aside>
  );
}
