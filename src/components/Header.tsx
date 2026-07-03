import { useTheme } from "../contexts/ThemeContext";
import { useTasks } from "../contexts/TasksContext";
import { useUi } from "../contexts/UiContext";
import { SearchBar } from "./SearchBar";

export function Header() {
  const { resolved, toggle } = useTheme();
  const { searchQuery, setSearchQuery } = useTasks();
  const { focusMode, toggleFocusMode } = useUi();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3">
      <div className="flex items-center gap-3">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)] text-sm font-bold text-white"
          aria-hidden
        >
          Q
        </div>
        <div>
          <h1 className="text-base font-semibold leading-tight">QueDesk</h1>
          <p className="text-xs text-[var(--color-text-muted)]">
            {focusMode ? "Focus mode" : "Personal productivity"}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
        {!focusMode && (
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        )}
        <button
          type="button"
          onClick={toggleFocusMode}
          className={[
            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
            focusMode
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-accent)]",
          ].join(" ")}
        >
          {focusMode ? "Focus on" : "Focus"}
        </button>
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-accent)]"
          aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
        >
          {resolved === "dark" ? "Light" : "Dark"}
        </button>
      </div>
    </header>
  );
}
