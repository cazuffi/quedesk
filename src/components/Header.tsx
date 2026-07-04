import { useTheme } from "../contexts/ThemeContext";
import { useTasks } from "../contexts/TasksContext";
import { useUi } from "../contexts/UiContext";
import { SearchBar } from "./SearchBar";

export function Header() {
  const { resolved, toggle } = useTheme();
  const { searchQuery, setSearchQuery } = useTasks();
  const { focusMode, toggleFocusMode } = useUi();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] text-sm font-bold tracking-tight text-white shadow-sm"
          aria-hidden
        >
          Q
        </div>
        <div>
          <h1 className="text-sm font-semibold leading-tight tracking-tight">
            QueDesk
          </h1>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            {focusMode ? "Focus mode" : "Personal productivity"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
        {!focusMode && (
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        )}
        <button
          type="button"
          onClick={toggleFocusMode}
          className={[
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            focusMode
              ? "bg-[var(--color-accent)] text-white shadow-sm hover:bg-[var(--color-accent-hover)]"
              : "bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]",
          ].join(" ")}
        >
          {focusMode ? "Exit focus" : "Focus"}
        </button>
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
          aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
        >
          {resolved === "dark" ? "☀ Light" : "☾ Dark"}
        </button>
      </div>
    </header>
  );
}
