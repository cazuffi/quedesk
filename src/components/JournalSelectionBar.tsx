import { useVisualViewportBottomInset } from "../hooks/useVisualViewportBottomInset";

interface JournalSelectionBarProps {
  selectedText: string;
  creating: boolean;
  created: boolean;
  onAdd: () => void;
  onDismiss: () => void;
}

function previewLabel(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (oneLine.length <= 72) return oneLine;
  return `${oneLine.slice(0, 72)}…`;
}

export function JournalSelectionBar({
  selectedText,
  creating,
  created,
  onAdd,
  onDismiss,
}: JournalSelectionBarProps) {
  const keyboardInset = useVisualViewportBottomInset();

  return (
    <div
      className="fixed inset-x-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface-raised)]/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.12)] backdrop-blur-sm"
      style={{
        bottom: keyboardInset,
        paddingBottom: keyboardInset > 0 ? "0.75rem" : "max(0.75rem, env(safe-area-inset-bottom))",
      }}
      role="region"
      aria-label="Selection actions"
    >
      <p className="mb-2 truncate text-xs text-[var(--color-text-muted)]">
        {created ? (
          <span className="font-medium text-[var(--color-accent)]">Task added</span>
        ) : (
          <>
            Selected:{" "}
            <span className="font-medium text-[var(--color-text)]">
              {previewLabel(selectedText)}
            </span>
          </>
        )}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={onDismiss}
          disabled={creating}
          className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-medium text-[var(--color-text-muted)] transition-colors active:bg-[var(--color-surface-raised)] disabled:opacity-50"
        >
          Clear
        </button>
        <button
          type="button"
          onPointerDown={(event) => event.preventDefault()}
          onClick={onAdd}
          disabled={creating || created}
          className="flex-[2] rounded-xl bg-[var(--color-accent)] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors active:bg-[var(--color-accent-hover)] disabled:opacity-60"
        >
          {creating ? "Adding…" : "Add to Inbox"}
        </button>
      </div>
    </div>
  );
}
