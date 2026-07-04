import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MARKDOWN_TIPS, markdownHelpShortcutLabel } from "../lib/markdownTips";

interface MarkdownNotesProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
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

export function MarkdownNotes({
  value,
  onChange,
  compact,
}: MarkdownNotesProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [showTips, setShowTips] = useState(false);
  const helpShortcut = markdownHelpShortcutLabel();

  const editorClass = compact
    ? "min-h-[8rem] w-full resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm leading-relaxed outline-none transition-colors focus:border-[var(--color-accent)]"
    : "min-h-[12rem] flex-1 resize-y rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-sm leading-relaxed outline-none transition-colors focus:border-[var(--color-accent)]";

  const previewClass = compact
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

  return (
    <div
      className={
        compact
          ? "relative flex flex-col"
          : "relative flex min-h-0 flex-1 flex-col"
      }
    >
      <div className="mb-2 flex flex-wrap items-center gap-0.5">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={[
            "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
            tab === "write"
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
          ].join(" ")}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setTab("preview")}
          className={[
            "rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors",
            tab === "preview"
              ? "bg-[var(--color-accent)] text-white"
              : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]",
          ].join(" ")}
        >
          Preview
        </button>
        {tab === "write" && (
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

      {showTips && tab === "write" && (
        <MarkdownTipsPanel onClose={() => setShowTips(false)} />
      )}

      {tab === "write" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleEditorKeyDown}
          placeholder={`Markdown notes — ${helpShortcut} for tips`}
          className={editorClass}
        />
      ) : (
        <div className={previewClass}>
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-[var(--color-text-muted)]">
              Nothing to preview.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
