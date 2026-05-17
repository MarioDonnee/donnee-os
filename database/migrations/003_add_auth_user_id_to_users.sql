alter table users
add column if not exists auth_user_id uuid unique;

create index if not exists idx_users_auth_user_id
on users(auth_user_id);
