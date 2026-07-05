import { getSupabase } from "./supabase";

export function describeError(error: unknown, fallback: string): string {
  if (error && typeof error === "object") {
    const record = error as { message?: string; details?: string; hint?: string };
    const parts = [record.message, record.details, record.hint].filter(Boolean);
    if (parts.length > 0) return parts.join(" — ");
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export interface CaptureTokenRecord {
  id: string;
  label: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

function rowToRecord(row: Record<string, unknown>): CaptureTokenRecord {
  return {
    id: row.id as string,
    label: row.label as string,
    tokenPrefix: row.token_prefix as string,
    createdAt: row.created_at as string,
    lastUsedAt: (row.last_used_at as string) ?? null,
    revokedAt: (row.revoked_at as string) ?? null,
  };
}

export function getCaptureEndpointUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL as string;
  if (!url) throw new Error("Missing VITE_SUPABASE_URL");
  return `${url.replace(/\/$/, "")}/functions/v1/capture`;
}

export async function listCaptureTokens(): Promise<CaptureTokenRecord[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("capture_tokens")
    .select("id, label, token_prefix, created_at, last_used_at, revoked_at")
    .is("revoked_at", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) =>
    rowToRecord(row as Record<string, unknown>),
  );
}

export async function createCaptureToken(
  label = "Action Button",
): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.rpc("create_capture_token", {
    p_label: label,
  });
  if (error) throw new Error(describeError(error, "Could not create capture token"));
  if (typeof data !== "string" || !data) {
    throw new Error("Could not create capture token (empty response)");
  }
  return data;
}

export async function revokeCaptureToken(id: string): Promise<void> {
  const sb = getSupabase();
  const { error } = await sb
    .from("capture_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function testCaptureToken(
  token: string,
  title: string,
): Promise<void> {
  const response = await fetch(getCaptureEndpointUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Capture failed (${response.status})`);
  }
}
