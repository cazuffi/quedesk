import { useEffect, useRef, useState } from "react";

export interface OverflowMenuItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  label?: string;
}

export function OverflowMenu({
  items,
  label = "More actions",
}: OverflowMenuProps) {
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

  if (items.length === 0) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-xs font-semibold tracking-wider text-[var(--color-text)] shadow-sm transition-colors active:bg-[var(--color-accent-soft)] active:text-[var(--color-accent)]"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        ···
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1.5 min-w-[12rem] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] py-1 shadow-xl"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
                className={[
                  "flex w-full px-4 py-3 text-left text-sm transition-colors active:bg-[var(--color-surface)] disabled:opacity-40",
                  item.danger
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--color-text)]",
                ].join(" ")}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
