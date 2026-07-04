import { useEffect, useRef, useState } from "react";
import type { TaskQueue } from "../types";

const MOVE_QUEUES: { id: TaskQueue; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "today", label: "Today" },
  { id: "week", label: "This Week" },
  { id: "backlog", label: "Backlog" },
];

export { MOVE_QUEUES };

interface MoveToMenuProps {
  currentQueue: TaskQueue;
  onMove: (queue: TaskQueue) => void;
}

export function MoveToMenu({ currentQueue, onMove }: MoveToMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-md px-2 py-1 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Move
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1.5 min-w-[9rem] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-1 shadow-lg"
        >
          {MOVE_QUEUES.map((queue) => (
            <button
              key={queue.id}
              type="button"
              role="menuitem"
              disabled={queue.id === currentQueue}
              onClick={() => {
                onMove(queue.id);
                setOpen(false);
              }}
              className={[
                "flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors",
                queue.id === currentQueue
                  ? "font-medium text-[var(--color-accent)]"
                  : "text-[var(--color-text)] hover:bg-[var(--color-surface)]",
              ].join(" ")}
            >
              {queue.label}
              {queue.id === currentQueue && (
                <span className="text-[var(--color-accent)]">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
