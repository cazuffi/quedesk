import { openSourceLink } from "../lib/sourceLink";
import {
  formatJournalSourceLabel,
  parseJournalSourceLink,
} from "../lib/journalLink";

interface SourceLinkButtonProps {
  sourceLink: string;
  /** Icon-only — fits narrow focus widget rows. */
  iconOnly?: boolean;
  className?: string;
}

export function SourceLinkButton({
  sourceLink,
  iconOnly = false,
  className = "",
}: SourceLinkButtonProps) {
  const journalDate = parseJournalSourceLink(sourceLink);
  const label = journalDate
    ? formatJournalSourceLabel(journalDate)
    : "Source";
  const title = journalDate ? `Open ${label}` : "Open source";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        void openSourceLink(sourceLink);
      }}
      className={[
        "inline-flex shrink-0 items-center gap-0.5 rounded-md text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent-soft)] hover:underline",
        iconOnly ? "p-0.5 text-xs" : "px-1.5 py-0.5 text-[11px]",
        className,
      ].join(" ")}
      title={title}
      aria-label={title}
    >
      <span aria-hidden>↗</span>
      {!iconOnly ? <span>{label}</span> : null}
    </button>
  );
}
