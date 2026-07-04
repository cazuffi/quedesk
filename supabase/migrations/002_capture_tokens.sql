-- Personal capture tokens for headless quick-add (e.g. iPhone Action Button → Shortcuts)

create extension if not exists pgcrypto;

create table if not exists capture_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  token_prefix text not null,
  label text not null default 'Default',
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create index idx_capture_tokens_user on capture_tokens(user_id);
create index idx_capture_tokens_active_hash on capture_tokens(token_hash)
  where revoked_at is null;

alter table capture_tokens enable row level security;

create policy "Users read own capture tokens"
  on capture_tokens for select
  using (auth.uid() = user_id);

create policy "Users update own capture tokens"
  on capture_tokens for update
  using (auth.uid() = user_id);

-- Mint a token (plaintext returned once; only hash is stored)
create or replace function create_capture_token(p_label text default 'Action Button')
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_token text;
  v_hash text;
  v_prefix text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_token := 'qd_' || translate(encode(gen_random_bytes(24), 'base64'), '+/=', '-_');
  v_hash := encode(digest(v_token, 'sha256'), 'hex');
  v_prefix := right(v_token, 8);

  insert into capture_tokens (user_id, token_hash, token_prefix, label)
  values (v_user_id, v_hash, v_prefix, coalesce(nullif(trim(p_label), ''), 'Action Button'));

  return v_token;
end;
$$;

revoke all on function create_capture_token(text) from public;
grant execute on function create_capture_token(text) to authenticated;
