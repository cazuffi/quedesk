import type { TaskQueue } from "../types";

const PIN_QUEUES: { id: TaskQueue; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
];

interface PinToMenuProps {
  onPin: (queue: TaskQueue) => void;
  compact?: boolean;
}

export function PinToMenu({ onPin, compact = false }: PinToMenuProps) {
  return (
    <div className="flex flex-wrap gap-0.5">
      {PIN_QUEUES.map((queue) => (
        <button
          key={queue.id}
          type="button"
          onClick={() => onPin(queue.id)}
          className={[
            "rounded-md border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
            compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
          ].join(" ")}
          title={`Pin to ${queue.label}`}
        >
          Pin → {queue.label}
        </button>
      ))}
    </div>
  );
}
