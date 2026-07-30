import { isDesktop } from "./platform";

const JOURNAL_DATE_RE = /^(\d{4}-\d{2}-\d{2})$/;

/** Stored on tasks.sourceLink — opens journal for that day in-app. */
export function buildJournalSourceLink(date: string): string {
  if (isDesktop()) {
    return `quedesk:journal/${date}`;
  }
  const path =
    typeof window !== "undefined"
      ? window.location.pathname.replace(/\/?$/, "/")
      : "/quedesk/";
  return `${path}?journal=${date}`;
}

/** Parse a journal deep link from stored source_link or pasted URL. */
export function parseJournalSourceLink(link: string): string | null {
  const trimmed = link.trim();
  if (!trimmed) return null;

  const queryMatch = trimmed.match(/[?&]journal=(\d{4}-\d{2}-\d{2})/);
  if (queryMatch?.[1] && JOURNAL_DATE_RE.test(queryMatch[1])) {
    return queryMatch[1];
  }

  const protoMatch = trimmed.match(/^quedesk:journal\/(\d{4}-\d{2}-\d{2})$/i);
  if (protoMatch?.[1]) return protoMatch[1];

  return null;
}

export function isJournalSourceLink(link: string): boolean {
  return parseJournalSourceLink(link) !== null;
}

/** Human label for task cards, e.g. "Jul 29 journal". */
export function formatJournalSourceLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Journal";
  return `${parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} journal`;
}

export function formatJournalHeading(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function shiftJournalDate(date: string, days: number): string {
  const parsed = new Date(`${date}T12:00:00`);
  parsed.setDate(parsed.getDate() + days);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
