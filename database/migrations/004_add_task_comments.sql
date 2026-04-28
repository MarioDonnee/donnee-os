create table if not exists task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id),
  body text not null,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_task_comments_task_id
on task_comments(task_id);

create index if not exists idx_task_comments_created_by
on task_comments(created_by);

create index if not exists idx_task_comments_created_at
on task_comments(created_at);

drop trigger if exists trg_task_comments_updated_at on task_comments;

create trigger trg_task_comments_updated_at
before update on task_comments
for each row
execute function set_updated_at();
