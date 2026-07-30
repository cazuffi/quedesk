import type { DailyNote, JournalSearchResult } from "../types/journal";

const SNIPPET_RADIUS = 72;
const MAX_RESULTS = 50;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Context snippet around the first match in note content. */
export function buildJournalSnippet(content: string, query: string): string {
  const trimmedQuery = query.trim();
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (!trimmedQuery) return normalized.slice(0, 160);

  const lowerContent = normalized.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const matchIndex = lowerContent.indexOf(lowerQuery);
  if (matchIndex < 0) {
    return normalized.length > 160 ? `${normalized.slice(0, 160)}…` : normalized;
  }

  const start = Math.max(0, matchIndex - SNIPPET_RADIUS);
  const end = Math.min(
    normalized.length,
    matchIndex + trimmedQuery.length + SNIPPET_RADIUS,
  );
  let snippet = normalized.slice(start, end);
  if (start > 0) snippet = `…${snippet}`;
  if (end < normalized.length) snippet = `${snippet}…`;
  return snippet;
}

export function mapNotesToSearchResults(
  notes: DailyNote[],
  query: string,
): JournalSearchResult[] {
  return notes.slice(0, MAX_RESULTS).map((note) => ({
    date: note.date,
    snippet: buildJournalSnippet(note.content, query),
    updatedAt: note.updatedAt,
  }));
}

export function splitSnippetHighlight(
  snippet: string,
  query: string,
): { text: string; match: boolean }[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [{ text: snippet, match: false }];

  const regex = new RegExp(`(${escapeRegex(trimmedQuery)})`, "gi");
  return snippet
    .split(regex)
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      match: part.toLowerCase() === trimmedQuery.toLowerCase(),
    }));
}

export function escapeLikePattern(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}
