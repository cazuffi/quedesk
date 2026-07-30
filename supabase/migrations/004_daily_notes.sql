-- Daily journal notes (one markdown note per calendar day per user)

create table if not exists daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (user_id, note_date)
);

create index idx_daily_notes_user_date on daily_notes(user_id, note_date desc);

alter table daily_notes enable row level security;

create policy "Users can read own daily notes"
  on daily_notes for select using (auth.uid() = user_id);

create policy "Users can insert own daily notes"
  on daily_notes for insert with check (auth.uid() = user_id);

create policy "Users can update own daily notes"
  on daily_notes for update using (auth.uid() = user_id);

create policy "Users can delete own daily notes"
  on daily_notes for delete using (auth.uid() = user_id);
