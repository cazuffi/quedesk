import { getSupabase } from "./supabase";
import type { DailyNote } from "../types/journal";

function nowIso(): string {
  return new Date().toISOString();
}

function rowToDailyNote(row: Record<string, unknown>): DailyNote {
  return {
    id: row.id as string,
    date: row.note_date as string,
    content: (row.content as string) ?? "",
    updatedAt: row.updated_at as string,
  };
}

async function getUserId(): Promise<string> {
  const sb = getSupabase();
  const { data } = await sb.auth.getUser();
  if (!data.user) throw new Error("Not authenticated");
  return data.user.id;
}

export async function fetchJournalNote(date: string): Promise<DailyNote | null> {
  const userId = await getUserId();
  const sb = getSupabase();
  const { data, error } = await sb
    .from("daily_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("note_date", date)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToDailyNote(data as Record<string, unknown>) : null;
}

export async function upsertJournalNote(
  date: string,
  content: string,
): Promise<DailyNote> {
  const userId = await getUserId();
  const sb = getSupabase();
  const updatedAt = nowIso();
  const { data, error } = await sb
    .from("daily_notes")
    .upsert(
      {
        user_id: userId,
        note_date: date,
        content,
        updated_at: updatedAt,
      },
      { onConflict: "user_id,note_date" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return rowToDailyNote(data as Record<string, unknown>);
}

export async function checkJournalHealth(): Promise<boolean> {
  try {
    const sb = getSupabase();
    const { error } = await sb.from("daily_notes").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}
