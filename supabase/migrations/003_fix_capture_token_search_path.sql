/* Fix create_capture_token: pgcrypto lives in the extensions schema on Supabase */

create or replace function create_capture_token(p_label text default 'Action Button')
returns text
language plpgsql
security definer
set search_path = public, extensions
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
