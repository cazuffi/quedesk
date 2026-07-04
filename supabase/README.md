# QueDesk Supabase backend

## One-time setup

### 1. Run migrations

In the [Supabase SQL Editor](https://supabase.com/dashboard), run each file in order:

1. `migrations/001_create_tasks.sql` (if not already applied)
2. `migrations/002_capture_tokens.sql`

Or with the CLI linked to your project:

```bash
supabase db push
```

### 2. Deploy the capture Edge Function

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), log in, and link your project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy capture
```

`supabase/config.toml` sets `verify_jwt = false` for this function because iPhone Shortcuts sends your personal capture token instead of a Supabase session JWT.

### 3. Configure the web app

GitHub Actions already uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. No new frontend env vars are required — the capture endpoint is derived from the Supabase URL.

## Quick capture API

**POST** `{SUPABASE_URL}/functions/v1/capture`

Headers:

- `Authorization: Bearer qd_…` (your personal token), or
- `X-QueDesk-Capture-Token: qd_…`

Body (JSON):

```json
{
  "title": "Buy milk",
  "sourceLink": "https://optional-link.example"
}
```

Response `200`:

```json
{
  "ok": true,
  "task": {
    "id": "…",
    "title": "Buy milk",
    "queue": "inbox",
    "createdAt": "…"
  }
}
```

Tasks are always created in **Inbox** for the token owner.

## Generate tokens in the app

Web QueDesk → header menu → **Quick capture** → **Generate new token**.

Copy the token once, paste it into your Shortcut, and revoke old tokens if needed.

## iPhone Action Button

See in-app instructions under **Quick capture**, or:

1. Shortcuts → new shortcut
2. Ask for Input (text)
3. Get Contents of URL — POST to capture endpoint with `Authorization: Bearer YOUR_TOKEN` and JSON body `{"title": "Shortcut Input"}`
4. Show Notification — “Added to Inbox ✓”
5. Settings → Action Button → run that shortcut
