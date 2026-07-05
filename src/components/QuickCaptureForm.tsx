import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useTasks } from "../contexts/TasksContext";
import { hideCurrentWindow, listenForWindowBlur } from "../lib/tasksEvents";
import {
  dismissCaptureWindow,
  isCapturePopout,
  openCapturePopoutAtWidth,
} from "../lib/captureWindow";
import {
  CAPTURE_DEFAULT_POPOUT_WIDTH,
  CAPTURE_MIN_WIDTH,
} from "../lib/captureStorage";
import { isUltraCompact } from "../lib/focusStorage";
import { useFocusWidthBand } from "../hooks/useFocusWidthBand";
import { isDesktop, isWeb } from "../lib/platform";

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
  const panelRef = useRef<HTMLFormElement>(null);

  const standalone = variant === "standalone";
  const desktopWidget = variant === "embedded" && isDesktop();
  const band = useFocusWidthBand(panelRef);
  const slim = isUltraCompact(band);
  const ultra = band === "ultra";

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
      } else if (standalone) {
        titleRef.current?.focus();
      } else {
        titleRef.current?.focus();
      }
    } finally {
      setBusy(false);
    }
  }

  const pad = standalone
    ? ultra
      ? "p-2"
      : slim
        ? "p-2.5"
        : "p-3"
    : variant === "modal"
      ? ""
      : "px-3 py-2";

  return (
    <form
      ref={panelRef}
      onSubmit={handleSubmit}
      className={[
        "flex w-full min-w-0 flex-col gap-2 bg-[var(--color-surface)]",
        standalone ? "h-full min-h-0 justify-center" : "",
        pad,
      ].join(" ")}
      data-capture-band={band}
    >
      {standalone ? (
        <div className="mb-0.5 flex items-center justify-between gap-2">
          {!ultra ? (
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
              Capture
            </p>
          ) : (
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-accent)]">
              Inbox
            </p>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-md px-2 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text)]"
          >
            Esc
          </button>
        </div>
      ) : null}

      <div className={ultra ? "flex flex-col gap-1.5" : "flex gap-2"}>
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={ultra ? "Capture…" : "Quick capture to Inbox…"}
          disabled={busy}
          className={[
            "min-w-0 flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] disabled:opacity-60",
            ultra ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm",
          ].join(" ")}
        />
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className={[
            "shrink-0 rounded-xl bg-[var(--color-accent)] font-medium text-white shadow-sm transition-all hover:bg-[var(--color-accent-hover)] disabled:opacity-40",
            ultra ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
          ].join(" ")}
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
            "rounded-lg border font-medium transition-all",
            ultra ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
            showLink || sourceLink.trim()
              ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
          ].join(" ")}
        >
          {ultra ? "↗" : "Link"}
        </button>
        <button
          type="button"
          onClick={() => void handlePasteLink()}
          className={[
            "rounded-lg border border-[var(--color-border)] font-medium text-[var(--color-text-muted)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]",
            ultra ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
          ].join(" ")}
          title="Paste a Teams or Outlook link from clipboard"
        >
          {ultra ? "⎘" : "Paste link"}
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
          placeholder={ultra ? "Source URL…" : "Source link — Teams, Outlook…"}
          disabled={busy}
          className={[
            "w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] disabled:opacity-60",
            ultra ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
          ].join(" ")}
        />
      )}

      {standalone && isWeb() ? (
        <>
          <div className="flex flex-wrap gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => openCapturePopoutAtWidth(180)}
              className="rounded-md bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
              title="Open pop-out at 180px width"
            >
              180
            </button>
            <button
              type="button"
              onClick={() => openCapturePopoutAtWidth(220)}
              className="rounded-md bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
              title="Open pop-out at 220px width"
            >
              220
            </button>
            <button
              type="button"
              onClick={() => openCapturePopoutAtWidth(CAPTURE_DEFAULT_POPOUT_WIDTH)}
              className="rounded-md bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
              title="Open pop-out at 240px width"
            >
              240
            </button>
            {!slim ? (
              <button
                type="button"
                onClick={() => openCapturePopoutAtWidth(320)}
                className="rounded-md bg-[var(--color-surface-raised)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
                title="Open pop-out at 320px width"
              >
                320
              </button>
            ) : null}
          </div>
          {!ultra ? (
            <p className="text-[10px] leading-relaxed text-[var(--color-text-muted)]">
              Drag the window edge to resize — layout adapts down to {CAPTURE_MIN_WIDTH}px for
              FancyZones.
            </p>
          ) : null}
        </>
      ) : null}
    </form>
  );
}
