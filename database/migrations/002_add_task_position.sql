alter table tasks
add column if not exists position integer not null default 0;

with ranked_tasks as (
  select
    id,
    row_number() over (
      partition by status
      order by created_at asc, id asc
    ) - 1 as next_position
  from tasks
  where deleted_at is null
)
update tasks
set position = ranked_tasks.next_position
from ranked_tasks
where tasks.id = ranked_tasks.id;

create index if not exists idx_tasks_status_position
on tasks(status, position);
