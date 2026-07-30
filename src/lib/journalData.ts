import { isDesktop } from "./platform";
import type { DailyNote } from "../types/journal";

type JournalModule = typeof import("./journal") | typeof import("./journal-supabase");

let mod: JournalModule | null = null;

async function getModule(): Promise<JournalModule> {
  if (mod) return mod;
  mod = isDesktop()
    ? await import("./journal")
    : await import("./journal-supabase");
  return mod;
}

export async function fetchJournalNote(date: string): Promise<DailyNote | null> {
  return (await getModule()).fetchJournalNote(date);
}

export async function upsertJournalNote(
  date: string,
  content: string,
): Promise<DailyNote> {
  return (await getModule()).upsertJournalNote(date, content);
}

export async function checkJournalHealth(): Promise<boolean> {
  return (await getModule()).checkJournalHealth();
}
