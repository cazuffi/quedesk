import { WEB_APP_VERSION } from "../lib/appVersion";

interface StatusBarProps {
  dbReady: boolean;
  dbError: string | null;
}

export function StatusBar({ dbReady, dbError }: StatusBarProps) {
  const statusLabel = dbError ? "Error" : dbReady ? "Ready" : "Connecting…";

  return (
    <footer className="flex shrink-0 items-center justify-between border-t-2 border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-xs text-[var(--color-text-muted)] sm:px-5 sm:py-1.5 sm:text-[10px] sm:pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <span className="font-medium text-[var(--color-text)]">
        QueDesk {WEB_APP_VERSION}
      </span>
      <span className="flex items-center gap-1.5">
        <span
          className={[
            "inline-block h-2 w-2 rounded-full sm:h-1.5 sm:w-1.5",
            dbError
              ? "bg-[var(--color-danger)]"
              : dbReady
                ? "bg-[var(--color-success)]"
                : "bg-amber-400",
          ].join(" ")}
          aria-hidden
        />
        {statusLabel}
      </span>
    </footer>
  );
}
