import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownPreviewComponents } from "./markdownPreviewComponents";
import { useTouchLayout } from "../hooks/useTouchLayout";
import { MARKDOWN_TIPS, markdownHelpShortcutLabel } from "../lib/markdownTips";

type MarkdownView = "write" | "split" | "preview";

interface MarkdownNotesProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
  fill?: boolean;
  placeholder?: string;
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  onSelectionChange?: (
    selectedText: string,
    range: { start: number; end: number } | null,
  ) => void;
}

function MarkdownTipsPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3 shadow-lg"
      role="dialog"
      aria-label="Markdown tips"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-tight text-[var(--color-text)]">
          Markdown tips
        </p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-0.5 text-[11px] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
        >
          Close
        </button>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {MARKDOWN_TIPS.map((tip) => (
          <li
            key={tip.label}
            className="flex items-baseline justify-between gap-2 rounded-lg bg-[var(--color-surface)] px-2.5 py-1.5 text-[11px]"
          >
            <span className="shrink-0 text-[var(--color-text-muted)]">
              {tip.label}
            </span>
            <code className="truncate font-mono text-[var(--color-accent)]">
              {tip.syntax}
            </code>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-[var(--color-text-muted)]">
        Press {markdownHelpShortcutLabel()} or Esc to close
      </p>
    </div>
  );
}

function viewButtonClass(active: boolean): string {
  return [
    "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
    active
      ? "bg-[var(--color-accent)] text-white"
      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
  ].join(" ");
}

export function MarkdownNotes({
  value,
  onChange,
  compact,
  fill = false,
  placeholder,
  textareaRef,
  onSelectionChange,
}: MarkdownNotesProps) {
  const touchLayout = useTouchLayout();
  const [view, setView] = useState<MarkdownView>(
    fill && !touchLayout ? "split" : "write",
  );
  const [showTips, setShowTips] = useState(false);
  const helpShortcut = markdownHelpShortcutLabel();

  const showWrite = view === "write" || view === "split";

  const editorClass = fill
    ? "min-h-0 w-full flex-1 resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm leading-relaxed outline-none transition-colors focus:border-[var(--color-accent)]"
    : compact
      ? "min-h-[8rem] w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm leading-relaxed outline-none transition-colors focus:border-[var(--color-accent)]"
      : "min-h-[12rem] flex-1 resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm leading-relaxed outline-none transition-colors focus:border-[var(--color-accent)]";

  const previewClass = fill
    ? "markdown-body min-h-0 flex-1 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
    : compact
      ? "markdown-body min-h-[8rem] overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
      : "markdown-body min-h-[12rem] flex-1 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm";

  function toggleTips() {
    setShowTips((open) => !open);
  }

  function handleEditorKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "/") {
      e.preventDefault();
      toggleTips();
    }
  }

  function reportSelection(target: HTMLTextAreaElement) {
    if (!onSelectionChange) return;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (start !== end) {
      onSelectionChange(target.value.slice(start, end).trim(), { start, end });
    } else {
      onSelectionChange("", null);
    }
  }

  const containerClass = fill
    ? "relative flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden"
    : compact
      ? "relative flex flex-col"
      : "relative flex min-h-0 flex-1 flex-col";

  const previewContent = value.trim() ? (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={markdownPreviewComponents()}
    >
      {value}
    </ReactMarkdown>
  ) : (
    <p className="text-[var(--color-text-muted)]">Nothing to preview yet.</p>
  );

  const editorField = (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleEditorKeyDown}
      onSelect={(e) => reportSelection(e.currentTarget)}
      onMouseUp={(e) => reportSelection(e.currentTarget)}
      onKeyUp={(e) => reportSelection(e.currentTarget)}
      placeholder={placeholder ?? `Markdown notes — ${helpShortcut} for tips`}
      className={editorClass}
    />
  );

  const previewPane = (
    <div className={previewClass}>{previewContent}</div>
  );

  return (
    <div className={containerClass}>
      <div className="relative mb-2 flex shrink-0 flex-wrap items-center gap-0.5">
        {fill ? (
          <>
            <button
              type="button"
              onClick={() => setView("write")}
              className={viewButtonClass(view === "write")}
            >
              Write
            </button>
            {!touchLayout ? (
              <button
                type="button"
                onClick={() => setView("split")}
                className={viewButtonClass(view === "split")}
              >
                Split
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setView("preview")}
              className={viewButtonClass(view === "preview")}
            >
              Preview
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setView("write")}
              className={viewButtonClass(view === "write")}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={viewButtonClass(view === "preview")}
            >
              Preview
            </button>
          </>
        )}
        {(view === "write" || view === "split") && (
          <button
            type="button"
            onClick={toggleTips}
            className={[
              "ml-auto rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
              showTips
                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
            ].join(" ")}
            title={`Markdown tips (${helpShortcut})`}
          >
            Tips {helpShortcut}
          </button>
        )}
      </div>

      {showTips && (view === "write" || view === "split") && (
        <MarkdownTipsPanel onClose={() => setShowTips(false)} />
      )}

      {fill && view === "split" ? (
        <div className="grid min-h-0 w-full min-w-0 flex-1 grid-cols-2 gap-3 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <p className="mb-1.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Markdown
            </p>
            {editorField}
          </div>
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <p className="mb-1.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Preview
            </p>
            {previewPane}
          </div>
        </div>
      ) : fill ? (
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
          {showWrite ? editorField : previewPane}
        </div>
      ) : view === "preview" ? (
        previewPane
      ) : (
        editorField
      )}
    </div>
  );
}
