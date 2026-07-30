import type { Components } from "react-markdown";
import { parseJournalSourceLink } from "../lib/journalLink";
import { openMarkdownHref } from "../lib/sourceLink";
import { parseTaskLink } from "../lib/taskLink";

export function markdownPreviewComponents(): Components {
  return {
    a: ({ href, children }) => {
      if (!href) {
        return <span>{children}</span>;
      }

      const taskId = parseTaskLink(href);
      if (taskId) {
        return (
          <button
            type="button"
            onClick={() => void openMarkdownHref(href)}
            className="task-md-link inline items-baseline font-medium text-[var(--color-accent)] underline decoration-[var(--color-accent)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent)]"
            title="Open linked task"
          >
            {children}
          </button>
        );
      }

      const journalDate = parseJournalSourceLink(href);
      if (journalDate) {
        return (
          <button
            type="button"
            onClick={() => void openMarkdownHref(href)}
            className="inline font-medium text-[var(--color-accent)] underline decoration-[var(--color-accent)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent)]"
            title="Open journal entry"
          >
            {children}
          </button>
        );
      }

      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  };
}
