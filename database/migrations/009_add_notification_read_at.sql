alter table notifications
add column if not exists read_at timestamptz;

create index if not exists idx_notifications_read_at
on notifications(read_at);
