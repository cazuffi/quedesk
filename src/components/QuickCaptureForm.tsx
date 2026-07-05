import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useTasks } from "../contexts/TasksContext";
import { hideCurrentWindow, listenForWindowBlur } from "../lib/tasksEvents";
import { dismissCaptureWindow, isCapturePopout } from "../lib/captureWindow";
import { isDesktop } from "../lib/platform";

export type QuickCaptureVariant = "embedded" | "modal" | "standalone";

interface QuickCaptureFormProps {
  variant?: QuickCaptureVariant;
  onSuccess?: () => void;
  onDismiss?: () => void;
}

function looksLikeUrl(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return (
    /^https?:\/\//i.test(t) ||
    /^[\w.-]+\.[a-z]{2,}/i.test(t) ||
    t.includes("teams.microsoft.com") ||
    t.includes("outlook.")
  );
}

export function QuickCaptureForm({
  variant = "embedded",
  onSuccess,
  onDismiss,
}: QuickCaptureFormProps) {
  const { addTask } = useTasks();
  const [title, setTitle] = useState("");
  const [sourceLink, setSourceLink] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  const standalone = variant === "standalone";
  const desktopWidget = variant === "embedded" && isDesktop();

  const handleDismiss = useCallback(() => {
    if (onDismiss) {
      onDismiss();
      return;
    }
    if (standalone || isCapturePopout()) {
      dismissCaptureWindow();
      return;
    }
    if (desktopWidget) {
      void hideCurrentWindow();
    }
  }, [onDismiss, standalone, desktopWidget]);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleDismiss();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleDismiss]);

  useEffect(() => {
    if (!desktopWidget) return;
    let dispose: (() => void) | undefined;
    listenForWindowBlur(() => {
      void hideCurrentWindow();
    }).then((unlisten) => {
      dispose = unlisten;
    });
    return () => dispose?.();
  }, [desktopWidget]);

  async function handlePasteLink() {
    setPasteHint(null);
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (!text) {
        setPasteHint("Clipboard is empty");
        return;
      }
      if (!looksLikeUrl(text)) {
        setPasteHint("Clipboard doesn't look like a link");
        return;
      }
      setSourceLink(text);
      setShowLink(true);
      requestAnimationFrame(() => linkRef.current?.focus());
    } catch {
      setPasteHint("Could not read clipboard");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle || busy) return;

    setBusy(true);
    try {
      await addTask({
        title: trimmedTitle,
        queue: "inbox",
        sourceLink: sourceLink.trim() || null,
      });
      setTitle("");
      setSourceLink("");
      setShowLink(false);
      onSuccess?.();
      if (desktopWidget) {
        await hideCurrentWindow();
      } else if (standalone || isCapturePopout()) {
        dismissCaptureWindow();
      } else {
        titleRef.current?.focus();
      }
    } finally {
      setBusy(false);
    }
  }

  const pad = standalone ? "p-3" : variant === "modal" ? "" : "px-3 py-2";

  return (
    <form
      onSubmit={handleSubmit}
      className={[
        "flex flex-col gap-2 bg-[var(--color-surface)]",
        standalone ? "h-full min-h-0 justify-center" : "",
        pad,
      ].join(" ")}
    >
      {standalone ? (
        <div className="mb-1 flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
            Capture to Inbox
          </p>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]"
          >
            Esc
          </button>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Quick capture to Inbox…"
          disabled={busy}
          className="min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="shrink-0 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-hover)] disabled:opacity-40"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            setShowLink((open) => {
              const next = !open;
              if (next) requestAnimationFrame(() => linkRef.current?.focus());
              return next;
            });
          }}
          className={[
            "rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-all",
            showLink || sourceLink.trim()
              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
          ].join(" ")}
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => void handlePasteLink()}
          className="rounded-lg border border-[var(--color-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--color-text-muted)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          title="Paste a Teams or Outlook link from clipboard"
        >
          Paste link
        </button>
        {!standalone && variant === "modal" ? (
          <span className="ml-auto text-[10px] text-[var(--color-text-muted)]">
            {typeof navigator !== "undefined" &&
            /Mac|iPhone|iPad/.test(navigator.platform)
              ? "⌘"
              : "Ctrl"}
            +Shift+N
          </span>
        ) : null}
      </div>

      {pasteHint ? (
        <p className="text-[10px] text-[var(--color-danger)]">{pasteHint}</p>
      ) : null}

      {(showLink || sourceLink.trim()) && (
        <input
          ref={linkRef}
          type="text"
          value={sourceLink}
          onChange={(e) => setSourceLink(e.target.value)}
          placeholder="Source link — Teams meeting, Outlook, etc."
          disabled={busy}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] disabled:opacity-60"
        />
      )}
    </form>
  );
}
