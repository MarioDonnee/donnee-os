create table if not exists task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id),
  title text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  assignee_id uuid references users(id),
  due_date date,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  deleted_at timestamptz
);

create index if not exists idx_task_checklist_items_task_id
on task_checklist_items(task_id);

create index if not exists idx_task_checklist_items_task_position
on task_checklist_items(task_id, position);

create index if not exists idx_task_checklist_items_assignee_id
on task_checklist_items(assignee_id);

create index if not exists idx_task_checklist_items_due_date
on task_checklist_items(due_date);

drop trigger if exists trg_task_checklist_items_updated_at on task_checklist_items;

create trigger trg_task_checklist_items_updated_at
before update on task_checklist_items
for each row
execute function set_updated_at();
