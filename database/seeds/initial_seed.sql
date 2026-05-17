-- Donnée OS — Initial Seed Data

insert into users (id, name, email, role, status)
values
  ('00000000-0000-0000-0000-000000000001', 'Admin Donnée', 'admin@donnee.com', 'ADMIN', 'ACTIVE')
on conflict (email) do nothing;

insert into clients (id, name, segment, status, owner_id, created_by)
values
  (
    '00000000-0000-0000-0000-000000000101',
    'Cliente Exemplo',
    'Consultoria / Dados',
    'ACTIVE',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
  )
on conflict do nothing;

insert into projects (id, client_id, name, description, status, owner_id, start_date, due_date, priority, health_score, created_by)
values
  (
    '00000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000101',
    'Projeto Piloto Donnée OS',
    'Projeto de exemplo para validação inicial do sistema.',
    'IN_PROGRESS',
    '00000000-0000-0000-0000-000000000001',
    current_date,
    current_date + interval '30 days',
    'HIGH',
    85,
    '00000000-0000-0000-0000-000000000001'
  )
on conflict do nothing;

insert into tasks (id, project_id, title, description, status, priority, assignee_id, due_date, created_by)
values
  (
    '00000000-0000-0000-0000-000000000301',
    '00000000-0000-0000-0000-000000000201',
    'Criar schema inicial do banco',
    'Definir tabelas centrais do MVP.',
    'DONE',
    'HIGH',
    '00000000-0000-0000-0000-000000000001',
    current_date,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000302',
    '00000000-0000-0000-0000-000000000201',
    'Criar API FastAPI inicial',
    'Configurar backend e endpoints base.',
    'BACKLOG',
    'HIGH',
    '00000000-0000-0000-0000-000000000001',
    current_date + interval '7 days',
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    '00000000-0000-0000-0000-000000000303',
    '00000000-0000-0000-0000-000000000201',
    'Criar tela de Kanban',
    'Implementar visualização inicial das tarefas por status.',
    'BACKLOG',
    'MEDIUM',
    '00000000-0000-0000-0000-000000000001',
    current_date + interval '14 days',
    '00000000-0000-0000-0000-000000000001'
  )
on conflict do nothing;