import type { OverflowMenuItem } from "./OverflowMenu";

function shortLabel(label: string): string {
  if (label.startsWith("Move to ")) return label.replace("Move to ", "");
  if (label.startsWith("Pin to ")) return label.replace("Pin to ", "Pin ");
  return label;
}

interface MobileActionBarProps {
  items: OverflowMenuItem[];
}

export function MobileActionBar({ items }: MobileActionBarProps) {
  const active = items.filter((item) => !item.disabled);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 lg:hidden">
      {active.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={item.onClick}
          className={[
            "rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors active:scale-[0.98]",
            item.danger
              ? "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] active:bg-[var(--color-accent-soft)] active:text-[var(--color-accent)]",
          ].join(" ")}
        >
          {shortLabel(item.label)}
        </button>
      ))}
    </div>
  );
}
