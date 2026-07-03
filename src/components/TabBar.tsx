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

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      className={[
        "shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
        isActive
          ? "border-[var(--color-accent)] text-[var(--color-accent)]"
          : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
        isOver || isDropTarget
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent)] ring-2 ring-inset ring-[var(--color-accent)]/30"
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
      className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] px-4"
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
