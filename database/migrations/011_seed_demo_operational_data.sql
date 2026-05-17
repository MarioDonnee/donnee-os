-- Seed demo operational data for local/product review.
-- Idempotent by fixed UUIDs so the same seed can be reapplied safely.

with seed_user as (
  select id
  from users
  where deleted_at is null
  order by created_at
  limit 1
),
upsert_clients as (
  insert into clients (
    id,
    name,
    segment,
    status,
    main_contact_name,
    main_contact_email,
    main_contact_phone,
    notes,
    owner_id,
    created_by
  )
  select
    client_id::uuid,
    name,
    segment,
    status::client_status,
    contact_name,
    contact_email,
    contact_phone,
    notes,
    (select id from seed_user),
    (select id from seed_user)
  from (
    values
      ('8e9b3a40-4f70-4c29-b30a-b6b55fa80f01', 'Helios Energia', 'Energia e infraestrutura', 'ACTIVE', 'Marina Costa', 'marina.costa@helios.demo', '+55 11 4000-1101', 'Cliente com múltiplas frentes de dashboard e automação.'),
      ('8e9b3a40-4f70-4c29-b30a-b6b55fa80f02', 'Nexa Saúde', 'Healthtech', 'PROSPECTING', 'Renato Lima', 'renato.lima@nexa.demo', '+55 11 4000-1102', 'Prospecção consultiva para diagnóstico de dados e rotinas de BI.'),
      ('8e9b3a40-4f70-4c29-b30a-b6b55fa80f03', 'Aurora Retail', 'Varejo omnichannel', 'ACTIVE', 'Bianca Duarte', 'bianca.duarte@aurora.demo', '+55 11 4000-1103', 'Operação com backlog de integração comercial e relatórios executivos.'),
      ('8e9b3a40-4f70-4c29-b30a-b6b55fa80f04', 'Cobalto Jurídico', 'Serviços jurídicos', 'LEAD', 'Caio Martins', 'caio.martins@cobalto.demo', '+55 11 4000-1104', 'Lead para landing page e automação de qualificação.'),
      ('8e9b3a40-4f70-4c29-b30a-b6b55fa80f05', 'Atlas Capital', 'Gestão de investimentos', 'PAUSED', 'Laura Nogueira', 'laura.nogueira@atlas.demo', '+55 11 4000-1105', 'Projeto em pausa aguardando validação de dados internos.')
  ) as data(client_id, name, segment, status, contact_name, contact_email, contact_phone, notes)
  on conflict (id) do update set
    name = excluded.name,
    segment = excluded.segment,
    status = excluded.status,
    main_contact_name = excluded.main_contact_name,
    main_contact_email = excluded.main_contact_email,
    main_contact_phone = excluded.main_contact_phone,
    notes = excluded.notes,
    updated_at = now()
  returning id
),
upsert_projects as (
  insert into projects (
    id,
    client_id,
    name,
    description,
    status,
    start_date,
    due_date,
    priority,
    health_score,
    owner_id,
    created_by
  )
  select
    project_id::uuid,
    client_id::uuid,
    name,
    description,
    status::project_status,
    start_offset,
    due_offset,
    priority::task_priority,
    health_score,
    (select id from seed_user),
    (select id from seed_user)
  from (
    values
      ('9a0c5400-f6b7-4fd5-b2f1-1d2a4910c101', '8e9b3a40-4f70-4c29-b30a-b6b55fa80f01', 'Dashboard Executivo de Operações', 'Painel para leitura semanal de performance operacional.', 'IN_PROGRESS', current_date - 18, current_date + 16, 'HIGH', 82),
      ('9a0c5400-f6b7-4fd5-b2f1-1d2a4910c102', '8e9b3a40-4f70-4c29-b30a-b6b55fa80f01', 'Automação de Fechamento Mensal', 'Redução de esforço manual no fechamento de dados.', 'PLANNING', current_date + 2, current_date + 38, 'MEDIUM', 76),
      ('9a0c5400-f6b7-4fd5-b2f1-1d2a4910c103', '8e9b3a40-4f70-4c29-b30a-b6b55fa80f02', 'Diagnóstico Estratégico de Dados', 'Mapeamento de maturidade, riscos e oportunidades de dados.', 'DISCOVERY', current_date - 4, current_date + 21, 'HIGH', 68),
      ('9a0c5400-f6b7-4fd5-b2f1-1d2a4910c104', '8e9b3a40-4f70-4c29-b30a-b6b55fa80f03', 'Unificação Comercial Omnichannel', 'Rotina de consolidação para pedidos, canais e receita.', 'VALIDATION', current_date - 32, current_date + 5, 'URGENT', 59),
      ('9a0c5400-f6b7-4fd5-b2f1-1d2a4910c105', '8e9b3a40-4f70-4c29-b30a-b6b55fa80f04', 'Landing Page de Captação', 'Página de conversão para campanha consultiva.', 'PLANNING', current_date + 1, current_date + 18, 'MEDIUM', 72),
      ('9a0c5400-f6b7-4fd5-b2f1-1d2a4910c106', '8e9b3a40-4f70-4c29-b30a-b6b55fa80f05', 'Modelo de Risco de Carteira', 'Prova de conceito para classificação de risco operacional.', 'MONITORING', current_date - 55, current_date - 4, 'LOW', 64),
      ('9a0c5400-f6b7-4fd5-b2f1-1d2a4910c107', '8e9b3a40-4f70-4c29-b30a-b6b55fa80f03', 'Site Institucional Aurora', 'Reposicionamento institucional com arquitetura de serviços.', 'DELIVERED', current_date - 70, current_date - 12, 'LOW', 91)
  ) as data(project_id, client_id, name, description, status, start_offset, due_offset, priority, health_score)
  on conflict (id) do update set
    client_id = excluded.client_id,
    name = excluded.name,
    description = excluded.description,
    status = excluded.status,
    start_date = excluded.start_date,
    due_date = excluded.due_date,
    priority = excluded.priority,
    health_score = excluded.health_score,
    updated_at = now()
  returning id
)
insert into tasks (
  id,
  project_id,
  title,
  description,
  status,
  priority,
  position,
  start_date,
  due_date,
  completed_at,
  assignee_id,
  created_by
)
select
  task_id::uuid,
  project_id::uuid,
  title,
  description,
  status::task_status,
  priority::task_priority,
  position,
  start_date,
  due_date,
  case when status = 'DONE' then now() - interval '2 days' else null end,
  (select id from seed_user),
  (select id from seed_user)
from (
  values
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0101', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c101', 'Consolidar métricas executivas', 'Definir KPIs e granularidade por unidade de negócio.', 'IN_PROGRESS', 'HIGH', 0, current_date - 12, current_date + 2),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0102', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c101', 'Validar camada de dados', 'Conferir origem, frequência e regras de transformação.', 'REVIEW', 'HIGH', 0, current_date - 8, current_date + 1),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0103', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c101', 'Publicar primeira visão do dashboard', 'Entregar visão executiva inicial para leitura semanal.', 'BACKLOG', 'MEDIUM', 0, current_date + 1, current_date + 8),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0104', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c101', 'Ajustar regra de margem por contrato', 'Regra depende de retorno do financeiro da Helios.', 'BLOCKED', 'URGENT', 0, current_date - 5, current_date - 1),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0105', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c101', 'Documentar critérios de aceite', 'Registrar leitura de métricas e responsabilidades.', 'DONE', 'LOW', 0, current_date - 15, current_date - 3),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0106', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c102', 'Mapear rotina atual de fechamento', 'Inventariar planilhas, donos e dependências.', 'BACKLOG', 'MEDIUM', 1, current_date + 2, current_date + 6),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0107', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c102', 'Desenhar fluxo alvo', 'Definir gatilhos, validações e pontos de revisão humana.', 'BACKLOG', 'HIGH', 2, current_date + 5, current_date + 12),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0108', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c103', 'Entrevistar stakeholders da Nexa', 'Coletar dores por área e expectativa de decisão.', 'IN_PROGRESS', 'MEDIUM', 1, current_date - 3, current_date + 4),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0109', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c103', 'Inventariar fontes de dados', 'Criar mapa de sistemas, tabelas e donos.', 'BACKLOG', 'HIGH', 3, current_date, current_date + 9),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0110', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c103', 'Preparar matriz de maturidade', 'Classificar governança, qualidade, stack e rotinas.', 'REVIEW', 'MEDIUM', 1, current_date - 4, current_date + 3),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0111', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c104', 'Reconciliar pedidos por canal', 'Comparar ecommerce, loja física e marketplaces.', 'IN_PROGRESS', 'URGENT', 2, current_date - 10, current_date + 1),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0112', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c104', 'Fechar regra de devoluções', 'Aguardar definição de contabilização com operação.', 'BLOCKED', 'HIGH', 1, current_date - 9, current_date - 2),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0113', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c104', 'Validar relatório de receita líquida', 'Rodada final com diretoria comercial.', 'REVIEW', 'URGENT', 2, current_date - 2, current_date + 2),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0114', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c104', 'Entregar pacote de validação', 'Enviar evidências e resumo das divergências corrigidas.', 'DONE', 'MEDIUM', 1, current_date - 20, current_date - 5),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0115', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c105', 'Definir proposta de valor', 'Sintetizar promessa, objeções e oferta principal.', 'BACKLOG', 'HIGH', 4, current_date + 1, current_date + 4),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0116', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c105', 'Arquitetar formulário de captação', 'Campos mínimos, consentimento e roteamento comercial.', 'BACKLOG', 'MEDIUM', 5, current_date + 3, current_date + 7),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0117', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c106', 'Monitorar drift de variáveis', 'Acompanhar estabilidade das features principais.', 'IN_PROGRESS', 'LOW', 3, current_date - 12, current_date + 7),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0118', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c106', 'Revisar amostra de falsos positivos', 'Validar casos críticos com time de risco.', 'REVIEW', 'MEDIUM', 3, current_date - 6, current_date + 4),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0119', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c107', 'Publicar versão institucional', 'Deploy concluído e validado com marketing.', 'DONE', 'LOW', 2, current_date - 30, current_date - 12),
    ('7d2d7e50-2d45-4a4b-a4d8-3ac6f55f0120', '9a0c5400-f6b7-4fd5-b2f1-1d2a4910c107', 'Encerrar pendências de SEO técnico', 'Checklist final de indexação e redirects.', 'DONE', 'MEDIUM', 3, current_date - 25, current_date - 10)
) as data(task_id, project_id, title, description, status, priority, position, start_date, due_date)
on conflict (id) do update set
  project_id = excluded.project_id,
  title = excluded.title,
  description = excluded.description,
  status = excluded.status,
  priority = excluded.priority,
  position = excluded.position,
  start_date = excluded.start_date,
  due_date = excluded.due_date,
  completed_at = excluded.completed_at,
  updated_at = now();
