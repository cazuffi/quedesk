import type { JournalSearchResult } from "../types/journal";
import { formatJournalHeading } from "../lib/journalLink";
import { splitSnippetHighlight } from "../lib/journalSearch";

interface JournalSearchResultsProps {
  query: string;
  results: JournalSearchResult[];
  loading: boolean;
  onSelectDate: (date: string) => void;
}

export function JournalSearchResults({
  query,
  results,
  loading,
  onSelectDate,
}: JournalSearchResultsProps) {
  if (loading) {
    return (
      <p className="text-sm text-[var(--color-text-muted)]">Searching notes…</p>
    );
  }

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-8 text-center">
        <p className="text-sm font-medium text-[var(--color-text)]">
          No notes match &ldquo;{query}&rdquo;
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Try different keywords or check another spelling.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {results.map((result) => (
        <li key={result.date}>
          <button
            type="button"
            onClick={() => onSelectDate(result.date)}
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-3 text-left transition-colors hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-surface)] active:bg-[var(--color-accent-soft)]"
          >
            <p className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
              {formatJournalHeading(result.date)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
              {splitSnippetHighlight(result.snippet, query).map((part, index) =>
                part.match ? (
                  <mark
                    key={index}
                    className="rounded bg-[var(--color-accent-soft)] px-0.5 text-[var(--color-text)]"
                  >
                    {part.text}
                  </mark>
                ) : (
                  <span key={index}>{part.text}</span>
                ),
              )}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}
