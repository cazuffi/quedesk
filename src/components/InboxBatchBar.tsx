import { MOVE_QUEUES } from "./MoveToMenu";
import type { TaskQueue } from "../types";

const TRIAGE_QUEUES = MOVE_QUEUES.filter((queue) => queue.id !== "inbox");

interface InboxBatchBarProps {
  selectedCount: number;
  totalCount: number;
  onCancel: () => void;
  onSelectAll: () => void;
  onMove: (queue: TaskQueue) => void;
}

export function InboxBatchBar({
  selectedCount,
  totalCount,
  onCancel,
  onSelectAll,
  onMove,
}: InboxBatchBarProps) {
  return (
    <div className="sticky bottom-0 z-20 -mx-4 border-t border-[var(--color-accent)]/20 bg-[var(--color-surface-raised)]/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur-sm sm:-mx-5 sm:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)]"
        >
          Cancel
        </button>

        <span className="text-xs font-medium text-[var(--color-text)]">
          {selectedCount} selected
        </span>

        {selectedCount < totalCount ? (
          <button
            type="button"
            onClick={onSelectAll}
            className="rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-soft)]"
          >
            Select all
          </button>
        ) : null}

        <div className="ml-auto flex flex-wrap gap-1.5">
          {TRIAGE_QUEUES.map((queue) => (
            <button
              key={queue.id}
              type="button"
              disabled={selectedCount === 0}
              onClick={() => onMove(queue.id)}
              className="rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
            >
              {queue.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface InboxTriageHintProps {
  newCount: number;
  onStartSelect: () => void;
}

export function InboxTriageHint({ newCount, onStartSelect }: InboxTriageHintProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2.5">
      <p className="text-xs text-[var(--color-text-muted)]">
        {newCount > 0
          ? `${newCount} new in the last 24h — triage when ready.`
          : "Move items to Today, Week, or Backlog when ready."}
      </p>
      <button
        type="button"
        onClick={onStartSelect}
        className="shrink-0 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)] hover:text-white"
      >
        Select tasks
      </button>
    </div>
  );
}
