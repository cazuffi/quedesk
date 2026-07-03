import type { TaskQueue } from "../types";

const PROMOTE_QUEUES: { id: TaskQueue; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
];

interface PromoteMenuProps {
  onPromote: (queue: TaskQueue) => void;
  compact?: boolean;
}

export function PromoteMenu({ onPromote, compact = false }: PromoteMenuProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {PROMOTE_QUEUES.map((queue) => (
        <button
          key={queue.id}
          type="button"
          onClick={() => onPromote(queue.id)}
          className={[
            "rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
            compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
          ].join(" ")}
          title={`Promote to ${queue.label}`}
        >
          → {queue.label}
        </button>
      ))}
    </div>
  );
}
