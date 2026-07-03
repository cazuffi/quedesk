import Database from "@tauri-apps/plugin-sql";

export const DB_URL = "sqlite:quedesk.db";

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    db = await Database.load(DB_URL);
  }
  return db;
}

export async function checkDatabaseHealth(): Promise<boolean> {
  const database = await getDatabase();
  const rows = await database.select<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'tasks'",
  );
  return rows.length > 0;
}
