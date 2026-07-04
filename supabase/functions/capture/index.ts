import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-quedesk-capture-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOKEN_PREFIX = "qd_";
const MAX_TITLE_LENGTH = 500;
const MAX_SOURCE_LINK_LENGTH = 2048;
const MAX_CAPTURES_PER_MINUTE = 30;

interface CaptureBody {
  title?: string;
  sourceLink?: string | null;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractToken(req: Request): string | null {
  const headerToken = req.headers.get("x-quedesk-capture-token")?.trim();
  if (headerToken) return headerToken;

  const auth = req.headers.get("authorization")?.trim();
  if (!auth) return null;

  const [scheme, value] = auth.split(/\s+/, 2);
  if (!value) return auth.startsWith(TOKEN_PREFIX) ? auth : null;
  if (scheme.toLowerCase() === "bearer") return value;
  return null;
}

async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isRateLimited(iso: string | null): boolean {
  if (!iso) return false;
  const last = Date.parse(iso);
  if (Number.isNaN(last)) return false;
  return Date.now() - last < 60_000 / MAX_CAPTURES_PER_MINUTE;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const rawToken = extractToken(req);
  if (!rawToken?.startsWith(TOKEN_PREFIX) || rawToken.length < 16) {
    return jsonResponse({ error: "Invalid capture token" }, 401);
  }

  let body: CaptureBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const title = body.title?.trim() ?? "";
  if (!title) {
    return jsonResponse({ error: "title is required" }, 400);
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return jsonResponse({ error: "title is too long" }, 400);
  }

  const sourceLink = body.sourceLink?.trim() || null;
  if (sourceLink && sourceLink.length > MAX_SOURCE_LINK_LENGTH) {
    return jsonResponse({ error: "sourceLink is too long" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const tokenHash = await hashToken(rawToken);

  const { data: tokenRow, error: tokenError } = await admin
    .from("capture_tokens")
    .select("id, user_id, last_used_at")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (tokenError) {
    console.error("token lookup failed", tokenError);
    return jsonResponse({ error: "Lookup failed" }, 500);
  }

  if (!tokenRow) {
    return jsonResponse({ error: "Invalid capture token" }, 401);
  }

  if (isRateLimited(tokenRow.last_used_at as string | null)) {
    return jsonResponse({ error: "Rate limit exceeded" }, 429);
  }

  const userId = tokenRow.user_id as string;

  const { data: sortRows, error: sortError } = await admin
    .from("tasks")
    .select("sort_order")
    .eq("user_id", userId)
    .eq("queue", "inbox")
    .is("parent_id", null)
    .neq("status", "cleared")
    .order("sort_order", { ascending: false })
    .limit(1);

  if (sortError) {
    console.error("sort lookup failed", sortError);
    return jsonResponse({ error: "Could not create task" }, 500);
  }

  const nextSort =
    ((sortRows?.[0]?.sort_order as number | undefined) ?? -1) + 1;
  const now = new Date().toISOString();

  const { data: task, error: insertError } = await admin
    .from("tasks")
    .insert({
      user_id: userId,
      title,
      notes: "",
      queue: "inbox",
      parent_id: null,
      surface_of_id: null,
      sort_order: nextSort,
      due_date: null,
      tags: [],
      source_link: sourceLink,
      status: "active",
      created_at: now,
    })
    .select("id, title, queue, created_at")
    .single();

  if (insertError) {
    console.error("insert failed", insertError);
    return jsonResponse({ error: "Could not create task" }, 500);
  }

  await admin
    .from("capture_tokens")
    .update({ last_used_at: now })
    .eq("id", tokenRow.id);

  return jsonResponse({
    ok: true,
    task: {
      id: task.id,
      title: task.title,
      queue: task.queue,
      createdAt: task.created_at,
    },
  });
});
