export interface DailyNote {
  id: string;
  date: string;
  content: string;
  updatedAt: string;
}

export interface DailyNoteRow {
  id: string;
  note_date: string;
  content: string;
  updated_at: string;
}

export function rowToDailyNote(row: DailyNoteRow): DailyNote {
  return {
    id: row.id,
    date: row.note_date,
    content: row.content,
    updatedAt: row.updated_at,
  };
}
