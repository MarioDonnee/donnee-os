-- Donnée OS — Initial Database Schema
-- MVP P0: users, clients, projects, tasks, activity_logs

create extension if not exists "pgcrypto";

-- =========================
-- ENUMS
-- =========================

create type user_role as enum (
  'ADMIN',
  'MANAGER',
  'ANALYST',
  'CLIENT',
  'VIEWER'
);

create type user_status as enum (
  'ACTIVE',
  'INACTIVE',
  'PENDING'
);

create type client_status as enum (
  'LEAD',
  'PROSPECTING',
  'ACTIVE',
  'PAUSED',
  'CLOSED'
);

create type project_status as enum (
  'DISCOVERY',
  'PLANNING',
  'IN_PROGRESS',
  'VALIDATION',
  'DELIVERED',
  'MONITORING',
  'CANCELLED'
);

create type task_status as enum (
  'BACKLOG',
  'IN_PROGRESS',
  'REVIEW',
  'BLOCKED',
  'DONE',
  'CANCELLED'
);

create type task_priority as enum (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

-- =========================
-- UPDATED_AT TRIGGER
-- =========================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- =========================
-- USERS
-- =========================

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role user_role not null default 'ANALYST',
  status user_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger trg_users_updated_at
before update on users
for each row
execute function set_updated_at();

-- =========================
-- CLIENTS
-- =========================

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  segment text,
  status client_status not null default 'LEAD',
  main_contact_name text,
  main_contact_email text,
  main_contact_phone text,
  notes text,
  owner_id uuid references users(id),
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_clients_status on clients(status);
create index if not exists idx_clients_owner_id on clients(owner_id);

create trigger trg_clients_updated_at
before update on clients
for each row
execute function set_updated_at();

-- =========================
-- PROJECTS
-- =========================

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id),
  name text not null,
  description text,
  status project_status not null default 'DISCOVERY',
  owner_id uuid references users(id),
  start_date date,
  due_date date,
  priority task_priority not null default 'MEDIUM',
  health_score integer check (health_score between 0 and 100),
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_projects_client_id on projects(client_id);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_projects_owner_id on projects(owner_id);
create index if not exists idx_projects_due_date on projects(due_date);

create trigger trg_projects_updated_at
before update on projects
for each row
execute function set_updated_at();

-- =========================
-- TASKS
-- =========================

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id),
  title text not null,
  description text,
  status task_status not null default 'BACKLOG',
  priority task_priority not null default 'MEDIUM',
  position integer not null default 0,
  assignee_id uuid references users(id),
  due_date date,
  completed_at timestamptz,
  created_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_status_position on tasks(status, position);
create index if not exists idx_tasks_priority on tasks(priority);
create index if not exists idx_tasks_assignee_id on tasks(assignee_id);
create index if not exists idx_tasks_due_date on tasks(due_date);

create trigger trg_tasks_updated_at
before update on tasks
for each row
execute function set_updated_at();

-- =========================
-- ACTIVITY LOGS
-- =========================

create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  performed_by uuid references users(id),
  performed_at timestamptz not null default now(),
  ip_address text
);

create index if not exists idx_activity_logs_entity on activity_logs(entity_type, entity_id);
create index if not exists idx_activity_logs_performed_by on activity_logs(performed_by);
create index if not exists idx_activity_logs_performed_at on activity_logs(performed_at);
