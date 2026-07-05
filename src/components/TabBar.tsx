import { useDroppable } from "@dnd-kit/core";
import { QUEUE_TABS, queueDropId, type QueueTab } from "../types";

interface TabBarProps {
  activeTab: QueueTab;
  onTabChange: (tab: QueueTab) => void;
  dropTargetTab: QueueTab | null;
}

function TabButton({
  tab,
  isActive,
  isDropTarget,
  onSelect,
}: {
  tab: (typeof QUEUE_TABS)[number];
  isActive: boolean;
  isDropTarget: boolean;
  onSelect: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: queueDropId(tab.id),
    disabled: tab.id === "archive",
  });

  const highlight = isOver || isDropTarget;

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      className={[
        "relative shrink-0 px-3.5 py-3 text-sm font-medium tracking-wide transition-all sm:py-2.5 sm:text-xs",
        isActive
          ? "text-[var(--color-accent)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
        highlight
          ? "rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
          : "",
        tab.id !== "archive" ? "cursor-copy" : "",
      ].join(" ")}
      aria-current={isActive ? "page" : undefined}
      title={
        tab.id !== "archive"
          ? `Drop tasks here to move to ${tab.label}`
          : undefined
      }
    >
      {tab.label}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-[var(--color-accent)]" />
      )}
    </button>
  );
}

export function TabBar({
  activeTab,
  onTabChange,
  dropTargetTab,
}: TabBarProps) {
  return (
    <nav
      className="app-scroll-x flex shrink-0 gap-0.5 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 sm:px-5"
      aria-label="Queues"
    >
      {QUEUE_TABS.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTab}
          isDropTarget={dropTargetTab === tab.id}
          onSelect={() => onTabChange(tab.id)}
        />
      ))}
    </nav>
  );
}
