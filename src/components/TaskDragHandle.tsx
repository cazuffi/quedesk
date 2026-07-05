import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { useTouchLayout } from "../hooks/useTouchLayout";

interface TaskDragHandleProps {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
}

export function TaskDragHandle({ attributes, listeners }: TaskDragHandleProps) {
  const touchLayout = useTouchLayout();

  return (
    <button
      type="button"
      className={[
        "drag-handle shrink-0 cursor-grab touch-none select-none text-[var(--color-text-muted)] transition-colors",
        "rounded-lg active:scale-95 active:cursor-grabbing active:bg-[var(--color-accent-soft)] active:text-[var(--color-accent)]",
        touchLayout
          ? "flex h-11 w-10 items-center justify-center text-base"
          : "mt-0.5 px-0.5 text-sm opacity-50 hover:opacity-100 hover:text-[var(--color-text-muted)]",
      ].join(" ")}
      aria-label="Drag to reorder or drop on a tab"
      {...attributes}
      {...listeners}
    >
      ⠿
    </button>
  );
}
