# Donnée OS

Donnée OS é o sistema operacional interno da Donnée para gestão de clientes, projetos, tarefas, prazos, responsáveis, notificações e sinais operacionais.

O produto está em fase de pré-produto interno. O foco atual é estabilidade do fluxo principal, auditabilidade e leitura operacional, não expansão para ERP, billing, automações configuráveis ou IA avançada.

## Stack

- Backend: Python, FastAPI, SQLAlchemy, Pydantic
- Frontend: React, Vite, TypeScript, Axios, React Router
- Banco: Supabase/PostgreSQL
- Auth: Supabase Auth com Google OAuth
- UI: CSS customizado em `frontend/src/styles.css`

## Funcionalidades atuais

- Autenticação Google via Supabase e usuários locais
- Controle de roles: `ADMIN`, `MANAGER`, `ANALYST`, `VIEWER`
- Clientes, projetos e tarefas
- Kanban com drag-and-drop
- Task detail com comentários, labels, checklists e activity
- Client Detail e Project Detail
- Tasks Table e My Work
- Calendar e Timeline
- Notifications com leitura manual
- Project templates seedados para serviços Donnée
- Dashboard com métricas, atividade, risco e health score
- Activity logs para mutações operacionais
- `due_status`, `risk_status` e recalculo de `project.health_score`

## Estrutura

```txt
backend/    API FastAPI
frontend/   Interface React/Vite
database/   Schema, migrations e seeds SQL
docs/       Backlog, checklists e documentação operacional
```

## Configuração

Crie os arquivos de ambiente a partir dos exemplos:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Variáveis do backend:

```txt
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

Variáveis do frontend:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Não commite arquivos `.env` com valores reais.

## Rodar o backend

```bash
cd backend
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Health check:

```txt
http://127.0.0.1:8000/health
```

`/db-test` é um endpoint administrativo de diagnóstico e exige usuário `ADMIN`.

## Rodar o frontend

```bash
cd frontend
npm install
npm run dev
```

URL local:

```txt
http://127.0.0.1:5173
```

## Banco, migrations e seeds

As migrations SQL ficam em `database/migrations`.

Migrations principais já existentes:

- `004_add_task_comments.sql`
- `005_add_labels_and_task_labels.sql`
- `006_add_task_checklist_items.sql`
- `007_add_notifications.sql`
- `008_add_task_start_date.sql`
- `009_add_notification_read_at.sql`
- `010_add_project_templates.sql`
- `011_seed_demo_operational_data.sql`

Os templates de projeto e os dados demo são seedados por SQL idempotente.

## Validação

Backend:

```bash
cd backend
python -m compileall app
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

QA manual:

```txt
docs/SPRINT_10_RELEASE_CANDIDATE_CHECKLIST.md
```

## Limitações conhecidas

- Sem attachments ainda.
- Sem mentions ainda.
- Sem rule engine configurável.
- Sem email ou Google Chat.
- Sem realtime.
- Sem AI summaries.
- Sem workflows configuráveis por projeto.

## Git

Não commitar:

- `.env`
- chaves Supabase
- service role keys
- senhas de banco
- arquivos locais de MCP/skills

Mensagem sugerida para Sprint 10:

```txt
chore: sprint 10 release candidate hardening
```
