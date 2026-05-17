create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  type text not null,
  title text not null,
  body text not null,
  entity_type text,
  entity_id uuid,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_notifications_user_id
on notifications(user_id);

create index if not exists idx_notifications_user_unread
on notifications(user_id, is_read)
where is_read = false;
