import { parseJournalSourceLink } from "./journalLink";

type JournalNavigationHandler = (date: string) => void;

let journalNavigationHandler: JournalNavigationHandler | null = null;

export function setJournalNavigationHandler(
  handler: JournalNavigationHandler | null,
): void {
  journalNavigationHandler = handler;
}

/** Normalize a stored source link into a valid URL. */
export function sourceLinkHref(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return trimmed;
  if (parseJournalSourceLink(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Open a source link — journal links navigate in-app; others open externally. */
export async function openSourceLink(link: string): Promise<void> {
  const journalDate = parseJournalSourceLink(link);
  if (journalDate && journalNavigationHandler) {
    journalNavigationHandler(journalDate);
    return;
  }

  const href = sourceLinkHref(link);
  if (!href) return;

  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(href);
  } catch {
    window.open(href, "_blank", "noopener,noreferrer");
  }
}
