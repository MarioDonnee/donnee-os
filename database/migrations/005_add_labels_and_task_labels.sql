create table if not exists labels (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_labels_name
on labels(name);

create index if not exists idx_labels_created_by
on labels(created_by);

drop trigger if exists trg_labels_updated_at on labels;

create trigger trg_labels_updated_at
before update on labels
for each row
execute function set_updated_at();

create table if not exists task_labels (
  task_id uuid not null references tasks(id),
  label_id uuid not null references labels(id),
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  primary key (task_id, label_id)
);

create index if not exists idx_task_labels_label_id
on task_labels(label_id);

create index if not exists idx_task_labels_created_by
on task_labels(created_by);
