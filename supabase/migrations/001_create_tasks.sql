-- QueDesk tasks table for Supabase (Postgres)
-- Mirrors the SQLite schema from the desktop app

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text not null default '',
  queue text not null default 'inbox',
  parent_id uuid references tasks(id) on delete cascade,
  surface_of_id uuid references tasks(id) on delete set null,
  sort_order integer not null default 0,
  due_date date,
  tags jsonb not null default '[]',
  source_link text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  cleared_at timestamptz
);

create index idx_tasks_user on tasks(user_id);
create index idx_tasks_queue on tasks(user_id, queue);
create index idx_tasks_parent on tasks(parent_id);
create index idx_tasks_status on tasks(user_id, status);
create index idx_tasks_surface on tasks(surface_of_id);

-- Row Level Security: users can only access their own tasks
alter table tasks enable row level security;

create policy "Users can read own tasks"
  on tasks for select using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on tasks for insert with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on tasks for update using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on tasks for delete using (auth.uid() = user_id);
