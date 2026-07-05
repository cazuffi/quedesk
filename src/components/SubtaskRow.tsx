import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { parentProgress } from "../lib/taskTree";
import { formatDueDate, isOverdue } from "../lib/data";
import { buildSubtaskOverflowItems } from "../lib/taskOverflowItems";
import type { Task, TaskQueue } from "../types";
import { PinToMenu } from "./PinToMenu";
import { OverflowMenu } from "./OverflowMenu";
import { useTouchLayout } from "../hooks/useTouchLayout";

interface SubtaskRowProps {
  subtask: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPin: (subtaskId: string, queue: TaskQueue) => void;
}

export function SubtaskRow({
  subtask,
  onToggle,
  onEdit,
  onDelete,
  onPin,
}: SubtaskRowProps) {
  const touchLayout = useTouchLayout();
  const completed = subtask.status === "completed";
  const overdue = isOverdue(subtask);

  return (
    <div className="group/sub rounded-lg bg-[var(--color-surface)] px-2.5 py-2 transition-colors">
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={completed}
          onChange={() => onToggle(subtask)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-[var(--color-accent)]"
          aria-label={
            completed ? "Mark subtask incomplete" : "Mark subtask complete"
          }
        />

        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onEdit(subtask)}
            className={[
              "text-left text-sm leading-snug transition-colors active:text-[var(--color-accent)]",
              completed
                ? "line-through text-[var(--color-text-muted)]"
                : "font-medium",
            ].join(" ")}
          >
            {subtask.title}
          </button>
          {subtask.dueDate && (
            <p
              className={[
                "mt-0.5 text-[10px] text-[var(--color-text-muted)]",
                overdue ? "font-medium text-[var(--color-danger)]" : "",
              ].join(" ")}
            >
              {formatDueDate(subtask.dueDate)}
            </p>
          )}
        </div>

        {touchLayout ? (
          <OverflowMenu
            label="Subtask actions"
            items={buildSubtaskOverflowItems(subtask.id, { onPin, onDelete })}
          />
        ) : (
          <div className="pointer-events-none hidden shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover/sub:pointer-events-auto group-hover/sub:opacity-100 xl:flex">
            <PinToMenu compact onPin={(queue) => onPin(subtask.id, queue)} />
            <button
              type="button"
              onClick={() => onDelete(subtask.id)}
              className="rounded-md px-1.5 py-0.5 text-[10px] text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)]"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface SubtaskSectionProps {
  parentId: string;
  subtasks: Task[];
  onAddSubtask: (parentId: string, title: string) => Promise<void>;
  onAddSubtasksBatch?: (parentId: string, titles: string[]) => Promise<Task[]>;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onPin: (subtaskId: string, queue: TaskQueue) => void;
}

export function SubtaskSection({
  parentId,
  subtasks,
  onAddSubtask,
  onAddSubtasksBatch,
  onToggle,
  onEdit,
  onDelete,
  onPin,
}: SubtaskSectionProps) {
  const [input, setInput] = useState("");
  const [multiLine, setMultiLine] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const inFlightRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const progress = parentProgress(subtasks);
  const hasMultipleLines = input.includes("\n");

  async function submitLines(lines: string[]) {
    if (lines.length > 1 && onAddSubtasksBatch) {
      await onAddSubtasksBatch(parentId, lines);
      return;
    }

    await Promise.all(
      lines.map((line) => onAddSubtask(parentId, line.trim())),
    );
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const lines = trimmed.split("\n").filter((l) => l.trim());
    setInput("");
    setMultiLine(false);
    inFlightRef.current += lines.length;
    setPendingCount(inFlightRef.current);

    try {
      await submitLines(lines);
      inputRef.current?.focus();
    } catch (error) {
      console.error("Add subtask failed:", error);
      setInput(trimmed);
    } finally {
      inFlightRef.current = Math.max(0, inFlightRef.current - lines.length);
      setPendingCount(inFlightRef.current);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !multiLine && !hasMultipleLines) {
      e.preventDefault();
      void handleAdd(e as unknown as FormEvent);
    }
  }

  const addButtonLabel =
    hasMultipleLines
      ? `Add ${input.split("\n").filter((l) => l.trim()).length}`
      : pendingCount > 0
        ? "…"
        : "Add";

  return (
    <div className="mt-2 space-y-1.5 border-t border-[var(--color-border)]/50 pt-2">
      {subtasks.length > 0 ? (
        <p className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
          Subtasks {progress.done}/{progress.total}
        </p>
      ) : (
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Break this into smaller steps — one per line
        </p>
      )}

      <ul className="space-y-1">
        {subtasks.map((subtask) => (
          <li key={subtask.id}>
            <SubtaskRow
              subtask={subtask}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onPin={onPin}
            />
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="space-y-1.5 touch-manipulation">
        {multiLine || hasMultipleLines ? (
          <>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={"One subtask per line…\nShift+Enter for new line\nEnter to add"}
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white transition-all active:scale-95 disabled:opacity-40"
            >
              {addButtonLabel}
            </button>
          </>
        ) : (
          <>
            <div className="flex items-stretch gap-1.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add subtask…"
                enterKeyHint="done"
                className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-2.5 py-2 text-[16px] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] sm:py-1.5 sm:text-xs"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="shrink-0 rounded-lg bg-[var(--color-accent)] px-3.5 py-2 text-[16px] font-medium text-white transition-all active:scale-95 disabled:opacity-40 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                {addButtonLabel}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMultiLine(true)}
              className="rounded-lg px-1 py-0.5 text-[10px] text-[var(--color-text-muted)] transition-colors active:text-[var(--color-text)]"
            >
              Add multiple at once
            </button>
          </>
        )}
      </form>
    </div>
  );
}
