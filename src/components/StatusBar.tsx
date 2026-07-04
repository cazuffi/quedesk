import { WEB_APP_VERSION } from "../lib/appVersion";

interface StatusBarProps {
  dbReady: boolean;
  dbError: string | null;
}

export function StatusBar({ dbReady, dbError }: StatusBarProps) {
  return (
    <footer className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 text-[10px] tracking-wide text-[var(--color-text-muted)] sm:px-5">
      <span>QueDesk {WEB_APP_VERSION}</span>
      <span className="flex items-center gap-1.5">
        <span
          className={[
            "inline-block h-1.5 w-1.5 rounded-full",
            dbError
              ? "bg-[var(--color-danger)]"
              : dbReady
                ? "bg-[var(--color-success)]"
                : "bg-amber-400",
          ].join(" ")}
          aria-hidden
        />
        {dbError ? "Error" : dbReady ? "Ready" : "Connecting…"}
      </span>
    </footer>
  );
}
