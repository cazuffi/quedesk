interface StatusBarProps {
  dbReady: boolean;
  dbError: string | null;
}

export function StatusBar({ dbReady, dbError }: StatusBarProps) {
  return (
    <footer className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-2 text-xs text-[var(--color-text-muted)]">
      <span>QueDesk v0.1.0 — Phase 3</span>
      <span className="flex items-center gap-2">
        <span
          className={[
            "inline-block h-2 w-2 rounded-full",
            dbError ? "bg-red-500" : dbReady ? "bg-emerald-500" : "bg-amber-400",
          ].join(" ")}
          aria-hidden
        />
        {dbError
          ? "Database error"
          : dbReady
            ? "SQLite ready"
            : "Connecting…"}
      </span>
    </footer>
  );
}
