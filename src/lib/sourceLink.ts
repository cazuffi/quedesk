import { parseJournalSourceLink } from "./journalLink";
import { parseTaskLink } from "./taskLink";

type JournalNavigationHandler = (date: string) => void;
type TaskNavigationHandler = (taskId: string) => void;

let journalNavigationHandler: JournalNavigationHandler | null = null;
let taskNavigationHandler: TaskNavigationHandler | null = null;

export function setJournalNavigationHandler(
  handler: JournalNavigationHandler | null,
): void {
  journalNavigationHandler = handler;
}

export function setTaskNavigationHandler(
  handler: TaskNavigationHandler | null,
): void {
  taskNavigationHandler = handler;
}

/** Normalize a stored source link into a valid URL. */
export function sourceLinkHref(link: string): string {
  const trimmed = link.trim();
  if (!trimmed) return trimmed;
  if (parseJournalSourceLink(trimmed) || parseTaskLink(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/** Open a link — in-app journal/task links navigate internally; others externally. */
export async function openSourceLink(link: string): Promise<void> {
  const journalDate = parseJournalSourceLink(link);
  if (journalDate && journalNavigationHandler) {
    journalNavigationHandler(journalDate);
    return;
  }

  const taskId = parseTaskLink(link);
  if (taskId && taskNavigationHandler) {
    taskNavigationHandler(taskId);
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

/** Used by markdown preview for any href (journal, task, or external). */
export async function openMarkdownHref(href: string): Promise<void> {
  const journalDate = parseJournalSourceLink(href);
  if (journalDate && journalNavigationHandler) {
    journalNavigationHandler(journalDate);
    return;
  }

  const taskId = parseTaskLink(href);
  if (taskId && taskNavigationHandler) {
    taskNavigationHandler(taskId);
    return;
  }

  try {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(href);
  } catch {
    window.open(href, "_blank", "noopener,noreferrer");
  }
}
