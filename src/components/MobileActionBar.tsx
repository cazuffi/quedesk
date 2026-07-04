import type { OverflowMenuItem } from "./OverflowMenu";

function shortLabel(label: string): string {
  if (label.startsWith("Move to ")) return label.replace("Move to ", "");
  if (label.startsWith("Pin to ")) return label.replace("Pin to ", "Pin ");
  return label;
}

interface MobileActionBarProps {
  items: OverflowMenuItem[];
  label?: string;
}

/** Always-visible touch-friendly action chips (no dropdowns). */
export function MobileActionBar({ items, label = "Actions" }: MobileActionBarProps) {
  const active = items.filter((item) => !item.disabled);
  if (active.length === 0) return null;

  return (
    <div
      className="rounded-lg border border-[var(--color-accent)]/25 bg-[var(--color-accent-soft)] p-2.5"
      role="toolbar"
      aria-label={label}
    >
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)]">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {active.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.onClick}
            className={[
              "min-h-[40px] rounded-lg border-2 px-3 py-2 text-xs font-bold shadow-sm transition-colors active:scale-[0.98]",
              item.danger
                ? "border-[var(--color-danger)] bg-white text-[var(--color-danger)] dark:bg-[var(--color-surface-raised)]"
                : "border-[var(--color-accent)] bg-white text-[var(--color-accent)] dark:bg-[var(--color-surface-raised)]",
            ].join(" ")}
          >
            {shortLabel(item.label)}
          </button>
        ))}
      </div>
    </div>
  );
}
