alter table tasks
add column if not exists start_date date;

alter table tasks
add column if not exists completed_at timestamptz;

create index if not exists idx_tasks_start_date
on tasks(start_date);
