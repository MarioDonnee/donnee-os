# Donnée OS — Agent Instructions

## Product context

Donnée OS is an internal operating system for Donnée, focused on managing clients, projects, tasks, workflows, dashboards and operational intelligence.

The current MVP scope is:

- Clients
- Projects
- Tasks
- Dashboard
- Activity logs
- Metadata endpoints
- React frontend consuming FastAPI backend

Do not expand scope into advanced AI, automation, billing, finance, ERP or complex workflow engines unless explicitly requested.

## Stack

Backend:
- Python
- FastAPI
- SQLAlchemy
- Supabase/PostgreSQL
- Pydantic

Frontend:
- React
- Vite
- TypeScript
- Axios
- React Router
- CSS custom styling

Database:
- Supabase/PostgreSQL
- UUID primary keys
- soft delete with deleted_at
- timestamps with created_at and updated_at
- activity_logs for auditability

## Architecture rules

Backend must follow this structure:

- routes: HTTP layer only
- schemas: Pydantic request/response models
- services: business logic
- models: SQLAlchemy models
- db: database session/config

Do not put business logic directly inside routes when it belongs in services.

Frontend must follow this structure:

- pages for route-level screens
- services/api.ts for API client
- shared styling in styles.css until componentization becomes necessary

## Current backend routes

- GET /health
- GET /db-test
- GET /dashboard/summary
- GET/POST/PATCH /clients
- GET/POST/PATCH /projects
- GET/POST/PATCH /tasks
- GET /metadata/task-statuses
- GET /metadata/task-priorities
- GET /metadata/project-statuses
- GET /metadata/client-statuses
- GET /metadata/user-roles

## Visual direction

The UI must follow Donnée's visual identity:

- dark premium interface
- deep purple/black gradients
- glassmorphism panels
- subtle glow
- rounded cards
- minimal but distinctive layout
- avoid generic SaaS templates
- avoid default Bootstrap-like visuals

Preferred visual feeling:
premium, intelligent, experimental, anti-pattern, elegant, data-driven.

Use the user's provided Donnée background/logo as the stylistic reference.

Font direction:
Use `"Slop", Inter, system-ui, sans-serif` as the intended font stack. Do not bundle paid/licensed fonts unless the user provides the file or confirms the license.

## Engineering standards

Before changing code:
1. Inspect the current files.
2. Understand existing structure.
3. Make the smallest coherent change.
4. Do not rewrite unrelated files.
5. Preserve working behavior.
6. Prefer incremental commits.

After changing code:
1. Run backend or frontend locally when relevant.
2. Check for TypeScript/Python errors.
3. Suggest a clear git commit message.

## Git rules

Current working branch is usually:

feature/initial-database-schema

Never commit secrets.

Never commit:
- .env
- database passwords
- Supabase keys
- API keys
- service account files

Commit messages should follow:

- feat:
- fix:
- chore:
- refactor:
- docs:

## Backend rules

Use `data.model_dump()` for Pydantic v2.

Validate related entities before creating records:
- project must have an existing client
- task must have an existing project

Use HTTPException with friendly errors instead of raw 500s.

Do not use SQLAlchemy ForeignKey in ORM models unless all related models are properly mapped. Database constraints already exist in Supabase.

## Frontend rules

The frontend should consume the backend API via:

src/services/api.ts

Base URL for development:
http://localhost:8000

Do not hardcode statuses in components if metadata endpoints exist.

Prefer API-driven selects.

Keep layout consistent:
- sidebar
- content section
- page-header
- panel
- row
- form-row
- glass-card

## MVP next priorities

Current next likely tasks:

1. Projects page integration
2. Tasks page integration
3. Kanban view
4. Better loading/error states
5. Backend logs for clients/projects
6. Auth later

Do not jump to auth before the core product flow works.
