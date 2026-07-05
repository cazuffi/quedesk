import { useState } from "react";
import { CaptureSettingsPanel } from "./CaptureSettingsPanel";
import { useTheme } from "../contexts/ThemeContext";
import { useTasks } from "../contexts/TasksContext";
import { useUi } from "../contexts/UiContext";
import { isWeb } from "../lib/platform";
import { focusAppUrl, openFocusPopout } from "../lib/focusWindow";
import { WEB_APP_VERSION } from "../lib/appVersion";
import { SearchBar } from "./SearchBar";

export function Header() {
  const { resolved, toggle } = useTheme();
  const { searchQuery, setSearchQuery } = useTasks();
  const { focusMode, toggleFocusMode } = useUi();
  const [menuOpen, setMenuOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const web = isWeb();

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] text-sm font-bold tracking-tight text-white shadow-sm"
            aria-hidden
          >
            Q
          </div>
          <div className="sm:hidden">
            <h1 className="text-sm font-semibold leading-tight tracking-tight">
              QueDesk
            </h1>
            <p className="text-[10px] font-medium text-[var(--color-accent)]">
              {WEB_APP_VERSION}
            </p>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold leading-tight tracking-tight">
              QueDesk
            </h1>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              {focusMode ? "Focus mode" : "Personal productivity"}
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {!focusMode && (
            <div className="min-w-0 flex-1 sm:flex-initial">
              <SearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>
          )}

          {/* Desktop buttons */}
          <div className="hidden gap-1.5 sm:flex">
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
            {web && !focusMode ? (
              <>
                <button
                  type="button"
                  onClick={() => openFocusPopout()}
                  className="rounded-lg bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
                  title="Open focus in a side window"
                >
                  Pop out
                </button>
                <a
                  href={focusAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
                  title="Bookmark /focus for a sidecar window"
                >
                  /focus
                </a>
              </>
            ) : null}
            <button
              type="button"
              onClick={toggle}
              className="rounded-lg bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
              aria-label={`Switch to ${resolved === "dark" ? "light" : "dark"} mode`}
            >
              {resolved === "dark" ? "☀ Light" : "☾ Dark"}
            </button>
            {web && (
              <button
                type="button"
                onClick={() => setCaptureOpen(true)}
                className="rounded-lg bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-accent)]"
              >
                Quick capture
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface)] text-sm text-[var(--color-text-muted)] transition-colors active:bg-[var(--color-accent-soft)]"
              aria-label="Menu"
            >
              ⋯
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full z-40 mt-1 w-40 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1 shadow-xl">
            <button
              type="button"
              onClick={() => {
                toggleFocusMode();
                setMenuOpen(false);
              }}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-[var(--color-text)] transition-colors active:bg-[var(--color-surface)]"
            >
              {focusMode ? "Exit focus" : "Focus mode"}
            </button>
            {isWeb() && !focusMode ? (
              <button
                type="button"
                onClick={() => {
                  openFocusPopout();
                  setMenuOpen(false);
                }}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-[var(--color-text)] transition-colors active:bg-[var(--color-surface)]"
              >
                Pop out focus
              </button>
            ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      toggle();
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-[var(--color-text)] transition-colors active:bg-[var(--color-surface)]"
                  >
                    {resolved === "dark" ? "☀ Light mode" : "☾ Dark mode"}
                  </button>
                  {web && (
                    <button
                      type="button"
                      onClick={() => {
                        setCaptureOpen(true);
                        setMenuOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-[var(--color-text)] transition-colors active:bg-[var(--color-surface)]"
                    >
                      Quick capture
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {captureOpen && web && (
        <CaptureSettingsPanel onClose={() => setCaptureOpen(false)} />
      )}
    </header>
  );
}
