interface StatusBarProps {
  dbReady: boolean;
  dbError: string | null;
}

export function StatusBar({ dbReady, dbError }: StatusBarProps) {
  return (
    <footer className="hidden items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 pb-[max(0.375rem,env(safe-area-inset-bottom))] pt-1.5 text-[10px] tracking-wide text-[var(--color-text-muted)] sm:flex">
      <span>QueDesk v0.1.0</span>
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
        {dbError ? "Database error" : dbReady ? "Ready" : "Connecting…"}
      </span>
    </footer>
  );
}
