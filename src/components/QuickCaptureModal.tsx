import { QuickCaptureForm } from "./QuickCaptureForm";

interface QuickCaptureModalProps {
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function QuickCaptureModal({
  onClose,
  onOpenSettings,
}: QuickCaptureModalProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl shadow-black/20"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-capture-title"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p
              id="quick-capture-title"
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]"
            >
              Capture to Inbox
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              Type and press Enter — saved instantly
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xs text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]"
          >
            Esc
          </button>
        </div>
        <QuickCaptureForm variant="modal" onSuccess={onClose} onDismiss={onClose} />
        {onOpenSettings ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="mt-3 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            Action Button setup (iPhone)
          </button>
        ) : null}
      </div>
    </>
  );
}
