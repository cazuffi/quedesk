import { getDatabase } from "./db";
import {
  escapeLikePattern,
  mapNotesToSearchResults,
} from "./journalSearch";
import {
  rowToDailyNote,
  type DailyNote,
  type DailyNoteRow,
  type JournalSearchResult,
} from "../types/journal";

function nowIso(): string {
  return new Date().toISOString();
}

export async function fetchJournalNote(date: string): Promise<DailyNote | null> {
  const db = await getDatabase();
  const rows = await db.select<DailyNoteRow[]>(
    "SELECT * FROM daily_notes WHERE note_date = $1",
    [date],
  );
  return rows[0] ? rowToDailyNote(rows[0]) : null;
}

export async function upsertJournalNote(
  date: string,
  content: string,
): Promise<DailyNote> {
  const db = await getDatabase();
  const existing = await fetchJournalNote(date);
  const updatedAt = nowIso();

  if (existing) {
    await db.execute(
      "UPDATE daily_notes SET content = $1, updated_at = $2 WHERE note_date = $3",
      [content, updatedAt, date],
    );
    return { ...existing, content, updatedAt };
  }

  const id = crypto.randomUUID();
  await db.execute(
    `INSERT INTO daily_notes (id, note_date, content, updated_at)
     VALUES ($1, $2, $3, $4)`,
    [id, date, content, updatedAt],
  );
  return { id, date, content, updatedAt };
}

export async function searchJournalNotes(
  query: string,
): Promise<JournalSearchResult[]> {
  const term = query.trim();
  if (!term) return [];

  const db = await getDatabase();
  const rows = await db.select<DailyNoteRow[]>(
    `SELECT * FROM daily_notes
     WHERE content LIKE $1 ESCAPE '\\'
     ORDER BY note_date DESC
     LIMIT 50`,
    [`%${escapeLikePattern(term)}%`],
  );
  return mapNotesToSearchResults(rows.map(rowToDailyNote), term);
}

export async function checkJournalHealth(): Promise<boolean> {
  const db = await getDatabase();
  const rows = await db.select<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'daily_notes'",
  );
  return rows.length > 0;
}
