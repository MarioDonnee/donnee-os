create table if not exists project_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  service_type text not null unique,
  estimated_days integer not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_project_templates_active
on project_templates(is_active)
where deleted_at is null;

drop trigger if exists trg_project_templates_updated_at on project_templates;

create trigger trg_project_templates_updated_at
before update on project_templates
for each row
execute function set_updated_at();

create table if not exists project_template_tasks (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references project_templates(id),
  title text not null,
  description text,
  status text not null default 'BACKLOG',
  priority text not null default 'MEDIUM',
  position integer not null default 0,
  due_offset_days integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_template_tasks_template_position
on project_template_tasks(template_id, position);

with upserted_templates as (
  insert into project_templates (service_type, name, description, estimated_days, is_active)
  values
    ('DATA_DIAGNOSIS', 'Diagnóstico Estratégico de Dados', 'Mapeamento de maturidade, indicadores, fontes e oportunidades de inteligência.', 21, true),
    ('EXECUTIVE_DASHBOARD', 'Dashboard Executivo', 'Entrega de painel executivo com indicadores, validação e documentação operacional.', 30, true),
    ('PROCESS_AUTOMATION', 'Automação de Processo', 'Automação de rotina operacional com mapeamento, implementação, testes e handoff.', 28, true),
    ('APPLIED_AI', 'IA Aplicada', 'Aplicação prática de IA em fluxo interno, com caso de uso, protótipo e validação.', 35, true),
    ('LANDING_PAGE', 'Landing Page', 'Página de conversão com briefing, copy, design, implementação e publicação.', 18, true),
    ('INSTITUTIONAL_SITE', 'Site Institucional', 'Site institucional com arquitetura, conteúdo, implementação e publicação.', 35, true)
  on conflict (service_type) do update
    set name = excluded.name,
        description = excluded.description,
        estimated_days = excluded.estimated_days,
        is_active = excluded.is_active
  returning id, service_type
)
delete from project_template_tasks
where template_id in (select id from upserted_templates);

insert into project_template_tasks (template_id, title, description, status, priority, position, due_offset_days)
select t.id, x.title, x.description, x.status, x.priority, x.position, x.due_offset_days
from project_templates t
join (
  values
    ('DATA_DIAGNOSIS', 'Kickoff e objetivos do diagnóstico', 'Alinhar contexto, decisores, objetivos e restrições do projeto.', 'BACKLOG', 'HIGH', 0, 1),
    ('DATA_DIAGNOSIS', 'Mapear fontes de dados e indicadores atuais', 'Levantar sistemas, planilhas, dashboards e métricas usadas hoje.', 'BACKLOG', 'HIGH', 1, 5),
    ('DATA_DIAGNOSIS', 'Avaliar maturidade e lacunas operacionais', 'Consolidar riscos, gargalos e oportunidades de inteligência.', 'BACKLOG', 'MEDIUM', 2, 10),
    ('DATA_DIAGNOSIS', 'Consolidar recomendações priorizadas', 'Transformar achados em roadmap objetivo de próximos passos.', 'BACKLOG', 'HIGH', 3, 16),
    ('DATA_DIAGNOSIS', 'Apresentar diagnóstico final', 'Validar conclusões e próximos movimentos com stakeholders.', 'BACKLOG', 'HIGH', 4, 21),

    ('EXECUTIVE_DASHBOARD', 'Definir KPIs executivos', 'Selecionar indicadores, granularidade e regras de leitura.', 'BACKLOG', 'HIGH', 0, 3),
    ('EXECUTIVE_DASHBOARD', 'Conectar e preparar bases', 'Organizar fontes, limpeza inicial e modelo de dados.', 'BACKLOG', 'HIGH', 1, 9),
    ('EXECUTIVE_DASHBOARD', 'Construir primeira versão do dashboard', 'Entregar visual inicial com principais seções e métricas.', 'BACKLOG', 'HIGH', 2, 17),
    ('EXECUTIVE_DASHBOARD', 'Validar números com o cliente', 'Revisar consistência dos dados e ajustar regras.', 'BACKLOG', 'MEDIUM', 3, 24),
    ('EXECUTIVE_DASHBOARD', 'Publicar e documentar painel', 'Entregar link, documentação e orientações de uso.', 'BACKLOG', 'HIGH', 4, 30),

    ('PROCESS_AUTOMATION', 'Mapear processo atual', 'Descrever entradas, saídas, responsáveis e exceções.', 'BACKLOG', 'HIGH', 0, 3),
    ('PROCESS_AUTOMATION', 'Definir fluxo automatizado', 'Desenhar solução, integrações e critérios de sucesso.', 'BACKLOG', 'HIGH', 1, 7),
    ('PROCESS_AUTOMATION', 'Implementar automação inicial', 'Construir primeira versão funcional do fluxo.', 'BACKLOG', 'HIGH', 2, 16),
    ('PROCESS_AUTOMATION', 'Testar exceções e falhas', 'Validar casos reais, erros e fallback operacional.', 'BACKLOG', 'MEDIUM', 3, 23),
    ('PROCESS_AUTOMATION', 'Entregar handoff operacional', 'Documentar uso, manutenção e próximos ajustes.', 'BACKLOG', 'HIGH', 4, 28),

    ('APPLIED_AI', 'Definir caso de uso de IA', 'Escolher problema, usuários, dados e limites do protótipo.', 'BACKLOG', 'HIGH', 0, 4),
    ('APPLIED_AI', 'Preparar dados e critérios de avaliação', 'Organizar amostras, prompts, métricas e riscos.', 'BACKLOG', 'HIGH', 1, 10),
    ('APPLIED_AI', 'Construir protótipo funcional', 'Implementar fluxo inicial para validação interna.', 'BACKLOG', 'HIGH', 2, 20),
    ('APPLIED_AI', 'Validar qualidade e segurança', 'Testar respostas, limites, privacidade e comportamento esperado.', 'BACKLOG', 'HIGH', 3, 29),
    ('APPLIED_AI', 'Planejar evolução para produção', 'Documentar arquitetura, riscos e próximos incrementos.', 'BACKLOG', 'MEDIUM', 4, 35),

    ('LANDING_PAGE', 'Briefing e oferta principal', 'Definir público, promessa, CTA e estrutura de conversão.', 'BACKLOG', 'HIGH', 0, 2),
    ('LANDING_PAGE', 'Copy e arquitetura da página', 'Criar narrativa, seções e mensagens principais.', 'BACKLOG', 'HIGH', 1, 5),
    ('LANDING_PAGE', 'Design e implementação', 'Construir a página responsiva com identidade aprovada.', 'BACKLOG', 'HIGH', 2, 12),
    ('LANDING_PAGE', 'Revisão final e publicação', 'Ajustar detalhes, testar responsividade e publicar.', 'BACKLOG', 'MEDIUM', 3, 18),

    ('INSTITUTIONAL_SITE', 'Arquitetura do site', 'Definir páginas, navegação e prioridades de conteúdo.', 'BACKLOG', 'HIGH', 0, 4),
    ('INSTITUTIONAL_SITE', 'Conteúdo e direção visual', 'Consolidar copy, referências e hierarquia visual.', 'BACKLOG', 'HIGH', 1, 10),
    ('INSTITUTIONAL_SITE', 'Implementar páginas principais', 'Construir home, serviços, sobre e contato.', 'BACKLOG', 'HIGH', 2, 22),
    ('INSTITUTIONAL_SITE', 'Revisar SEO, performance e responsividade', 'Ajustar metadados, velocidade e comportamento mobile.', 'BACKLOG', 'MEDIUM', 3, 30),
    ('INSTITUTIONAL_SITE', 'Publicar site institucional', 'Deploy final, testes e documentação de manutenção.', 'BACKLOG', 'HIGH', 4, 35)
) as x(service_type, title, description, status, priority, position, due_offset_days)
on t.service_type = x.service_type;
