import { useEffect, useRef, useState, type FormEvent } from "react";
import { TasksProvider, useTasks } from "./contexts/TasksContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { hideCurrentWindow, listenForWindowBlur } from "./lib/tasksEvents";

function QuickCaptureContent() {
  const { addTask } = useTasks();
  const [title, setTitle] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        hideCurrentWindow();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    let dispose: (() => void) | undefined;
    listenForWindowBlur(() => {
      hideCurrentWindow();
    }).then((unlisten) => {
      dispose = unlisten;
    });
    return () => dispose?.();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || busy) return;

    const trimmedLink = sourceLink.trim();

    setBusy(true);
    try {
      await addTask({
        title: trimmedTitle,
        queue: "inbox",
        sourceLink: trimmedLink || null,
      });
      await hideCurrentWindow();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col justify-center gap-2 bg-[var(--color-surface)] px-3 py-2"
    >
      <div className="flex gap-2">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick capture to Inbox…"
          disabled={busy}
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => {
            setShowLink((open) => {
              const next = !open;
              if (next) {
                requestAnimationFrame(() => linkRef.current?.focus());
              }
              return next;
            });
          }}
          className={[
            "shrink-0 rounded-lg border px-3 py-2 text-xs font-medium",
            showLink || sourceLink.trim()
              ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-text)]",
          ].join(" ")}
          title="Add source link"
        >
          Link
        </button>
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="shrink-0 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {(showLink || sourceLink.trim()) && (
        <input
          ref={linkRef}
          type="text"
          value={sourceLink}
          onChange={(e) => setSourceLink(e.target.value)}
          placeholder="Source link (optional) — Outlook or Teams URL"
          disabled={busy}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
        />
      )}
    </form>
  );
}

export function QuickCaptureApp() {
  return (
    <ThemeProvider>
      <TasksProvider>
        <QuickCaptureContent />
      </TasksProvider>
    </ThemeProvider>
  );
}
