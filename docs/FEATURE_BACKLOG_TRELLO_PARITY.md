# Donnee OS - Feature Backlog & Trello-Parity Plan

## Context

We are building Donnee OS, an internal operating system for Donnee.

Current product flow already exists:

- Auth with Google OAuth via Supabase.
- Local `users` table as the operational profile.
- Clients.
- Projects.
- Tasks.
- Kanban with drag-and-drop.
- Dashboard.
- Activity logs.
- Metadata endpoints.
- Role-based access.

The goal is not to clone Trello.

The goal is to use Trello-like product patterns where they improve Donnee OS, while preserving Donnee's own positioning:

- premium internal command surface;
- operational intelligence first;
- clients/projects/tasks hierarchy;
- auditability;
- consulting/project delivery context;
- dark intelligence / data luxury visual identity.

Do not expand into billing, finance, ERP, complex AI agents, or customer portal unless explicitly requested.

---

## 1. Current Product Model

Current hierarchy:

```txt
Client
  -> Project
      -> Task
```

Current core screens:

- Dashboard
- Clients
- Projects
- Tasks / Kanban

Current backend entities likely include:

- `users`
- `clients`
- `projects`
- `tasks`
- `activity_logs`

Current task capabilities:

- title
- description
- status
- priority
- due_date
- position
- project_id
- assignee_id or owner-like fields
- drag-and-drop status movement

## 2. Product Principle

Before adding features, preserve this product rule:

> Donnee OS is not a generic task board. It is an execution intelligence system for a consulting company.

Every new feature must answer at least one of these:

- Does it improve execution clarity?
- Does it improve accountability?
- Does it improve project delivery visibility?
- Does it reduce operational fragmentation?
- Does it create useful data for dashboard/analytics?
- Does it preserve auditability?

If no, do not implement it yet.

## 3. Trello-Like Feature Gap Analysis

### 3.1 Boards / Workspaces

Trello has boards and workspace-level views. Donnee OS currently has projects and tasks.

#### Donnee OS interpretation

Do not create generic "boards" yet.

Use:

- Project = Board-like execution space
- Client = Workspace/Account context

Future optional abstraction:

```txt
Workspace
  -> Client
      -> Project
          -> Task
```

#### Recommendation

Do not add boards now unless the current projects abstraction becomes insufficient.

The current project-based model is better for Donnee because the consultancy thinks in clients and projects, not boards.

### 3.2 Lists / Columns

Trello lists are flexible columns. Donnee OS currently uses task statuses as Kanban columns.

Current model:

- BACKLOG
- IN_PROGRESS
- REVIEW
- BLOCKED
- DONE
- CANCELLED

#### Gap

We do not yet have configurable columns/workflows per project or task type.

#### Recommended feature

Add workflow configuration later:

- `workflow_templates`
- `workflow_statuses`
- `project_workflows`
- `task_type_workflows`

#### Priority

P2, not now.

Keep fixed statuses for MVP stability.

### 3.3 Cards

Trello cards are rich objects with comments, members, labels, due dates, attachments, checklists and activity.

Donnee OS tasks are currently still relatively thin.

Missing task/card features:

- task detail modal/page;
- comments;
- attachments;
- labels/tags;
- checklist/subtasks;
- watchers/followers;
- assigned members;
- custom fields;
- activity timeline;
- due date completion;
- start date;
- estimate/effort;
- task type;
- dependency/blocking reason.

#### Recommendation

The next serious product step should be:

> Task Detail View

Not more dashboard polish.

## 4. Feature Backlog by Priority

## P0 - Must-have to make Donnee OS operationally complete

These are the next features that make the MVP usable in real work.

### 4.1 Task Detail Modal / Page

#### Why

Kanban cards are not enough. Operators need to open a task and see context.

#### Add

- title
- description
- project
- client
- status
- priority
- assignee
- due_date
- created_by
- created_at
- updated_at
- activity timeline
- comments
- checklists
- attachments later

#### Backend

Add endpoints:

- `GET /tasks/{task_id}`
- `PATCH /tasks/{task_id}`

If not already implemented.

#### Frontend

Clicking a task card opens:

- `TaskDetailModal`

or route:

- `/tasks/:taskId`

#### Acceptance criteria

- User clicks task card.
- Detail opens.
- User can edit title, description, due date, priority and assignee.
- Changes persist.
- Activity log records the update.
- User can close and return to board without losing state.

### 4.2 Comments

#### Why

Without comments, discussion stays in WhatsApp/Slack and the system loses context.

#### Database

Create `task_comments`.

Fields:

- `id uuid`
- `task_id uuid`
- `body text`
- `created_by uuid`
- `created_at timestamptz`
- `updated_at timestamptz`
- `deleted_at timestamptz`

#### Backend

- `GET /tasks/{task_id}/comments`
- `POST /tasks/{task_id}/comments`
- `PATCH /comments/{comment_id}`
- `DELETE /comments/{comment_id}`

#### Frontend

Inside task detail:

- Comments section

#### Acceptance criteria

- Authenticated user comments on a task.
- Comment appears immediately.
- Comment persists after refresh.
- Soft delete works.
- Activity log records comment creation/deletion.

### 4.3 Labels / Tags

#### Why

Trello labels are one of the simplest and highest-value organizational features.

For Donnee OS, labels can mark:

- dados
- automacao
- BI
- IA
- comercial
- urgente
- cliente aguardando
- bloqueio externo
- dependencia tecnica

#### Database

- `labels`
- `task_labels`

Fields:

`labels`:

- `id`
- `name`
- `color`
- `created_by`
- `created_at`
- `deleted_at`

`task_labels`:

- `task_id`
- `label_id`

#### Backend

- `GET /labels`
- `POST /labels`
- `POST /tasks/{task_id}/labels`
- `DELETE /tasks/{task_id}/labels/{label_id}`

#### Frontend

- label chips in task card;
- label picker inside task detail;
- filter by label.

#### Acceptance criteria

- User creates label.
- User attaches label to task.
- Label appears on card and detail.
- Board can filter by label.

### 4.4 Assignees / Members

#### Why

A task needs clear accountability.

#### Current risk

If only one `assignee_id` exists, that may be enough for MVP. But projects often need multiple collaborators.

#### Recommendation

Keep one primary assignee now, add collaborators later.

Optional database:

- `task_members`

Fields:

- `task_id`
- `user_id`
- `role_on_task`: OWNER | CONTRIBUTOR | REVIEWER | WATCHER

Priority:

- Single assignee: P0.
- Multiple members/watchers: P1.

### 4.5 Better Activity Timeline

#### Why

Activity logs already exist, but users need to see them.

#### Backend

- `GET /tasks/{task_id}/activity`
- `GET /projects/{project_id}/activity`
- `GET /activity?entity_type=&entity_id=`

#### Frontend

Inside task/project detail:

- Activity timeline

Examples:

- Mario moved task from BACKLOG to IN_PROGRESS
- Ana changed priority from MEDIUM to HIGH
- Luiza commented
- Task was assigned to Gabriel

#### Acceptance criteria

- Every important action appears in timeline.
- Activity shows user, action, time and diff.
- No tokens or sensitive data are logged.

## P1 - Strong product features after task detail exists

### 5.1 Checklists / Subtasks

#### Why

Trello advanced checklists assign due dates and people to checklist items. For Donnee OS, this becomes delivery decomposition.

#### Database

Either:

- `task_checklists`
- `checklist_items`

or simpler:

- `task_checklist_items`

Fields:

- `id`
- `task_id`
- `title`
- `is_done`
- `position`
- `assignee_id`
- `due_date`
- `created_by`
- `created_at`
- `completed_at`

#### Backend

- `GET /tasks/{task_id}/checklist`
- `POST /tasks/{task_id}/checklist`
- `PATCH /checklist-items/{item_id}`
- `DELETE /checklist-items/{item_id}`

#### Frontend

Inside task detail:

- Checklist with progress

#### Acceptance criteria

- User creates checklist item.
- User checks/unchecks item.
- User assigns checklist item.
- Progress percentage updates.
- If all checklist items are done, optionally suggest moving task to REVIEW/DONE.

### 5.2 Attachments

#### Why

Consulting work needs references: docs, spreadsheets, briefs, prints, PDFs.

#### Recommendation

Use Supabase Storage initially.

Later, Google Drive integration if Donnee standardizes Workspace.

#### Database

`attachments`

Fields:

- `id`
- `entity_type`: task | project | client
- `entity_id`
- `file_name`
- `file_url`
- `mime_type`
- `file_size`
- `uploaded_by`
- `uploaded_at`
- `deleted_at`

#### Backend

- `POST /attachments`
- `GET /attachments?entity_type=&entity_id=`
- `DELETE /attachments/{id}`

#### Frontend

Inside task/project/client detail:

- Attachments panel

#### Acceptance criteria

- User uploads file.
- File is linked to task/project/client.
- User can open/download.
- Deleting is soft or storage-safe.
- Activity log records upload.

### 5.3 Filters and Search

#### Why

After tasks grow, Kanban becomes unusable without filters.

#### Add filters

- project
- client
- assignee
- status
- priority
- label
- due date
- overdue
- created_by

#### Backend

Improve `GET /tasks` with query params:

```txt
?project_id=&client_id=&status=&priority=&assignee_id=&label_id=&due_before=&overdue=true&search=
```

#### Frontend

Kanban toolbar:

- Search input
- Project select
- Assignee select
- Priority select
- Label select
- Only mine toggle
- Overdue toggle

#### Acceptance criteria

- Filters combine correctly.
- URL can store filters if useful.
- Empty state reflects active filters.

### 5.4 Due Date System

#### Why

Trello heavily uses due dates and calendar. Donnee OS needs deadline control.

#### Add

- start_date
- due_date
- completed_at
- due_status computed:
  - NO_DATE
  - UPCOMING
  - DUE_SOON
  - OVERDUE
  - COMPLETED

#### Backend

Could be computed in service or SQL view.

#### Frontend

Show badges:

- Atrasada
- Vence hoje
- Vence em 3 dias
- Sem prazo
- Concluida

#### Acceptance criteria

- Due date appears on card.
- Overdue tasks are visually clear.
- Dashboard counts overdue.
- Completed tasks do not show as overdue.

### 5.5 Project Detail Page

#### Why

Projects need a central page beyond a list.

#### Add

`/projects/:projectId`

Sections:

- project summary
- client
- health score
- deadline
- task counts
- kanban scoped to project
- activity
- files later

#### Acceptance criteria

- User opens project.
- Sees project metadata.
- Sees tasks only from that project.
- Can create task directly inside project.

### 5.6 Client Detail Page

#### Why

Consulting operations require client context.

#### Add

`/clients/:clientId`

Sections:

- client info
- projects
- open tasks
- recent activity
- contacts
- notes

#### Acceptance criteria

- User opens client.
- Sees all linked projects.
- Can create project from client page.
- Can see operational status.

## P2 - Trello Premium-like views adapted for Donnee OS

### 6.1 Table View

#### Trello analogy

Trello Table view gives a spreadsheet-like view of cards with sorting and filtering.

#### Donnee OS version

Add:

- `/tasks/table`

or toggle in Tasks page:

- Kanban | Table

Columns:

- title
- client
- project
- status
- priority
- assignee
- due_date
- labels
- updated_at

Features:

- sort
- filter
- inline status update
- inline priority update

Priority: High P2. Very useful for operators.

### 6.2 Calendar View

#### Trello analogy

Calendar view shows cards and checklist items by dates.

#### Donnee OS version

Add:

- `/calendar`

Show:

- tasks by due_date
- checklist items by due_date later
- project deadlines

Features:

- month/week toggle
- drag task to change due date
- create task from date

Priority: P2 after due date model is strong.

### 6.3 Timeline View

#### Trello analogy

Timeline shows work over time with start/end dates and lanes.

#### Donnee OS version

Add:

- `/timeline`

Group by:

- project
- assignee
- client
- status

Needs:

- start_date
- due_date

Priority: P2/P3. Useful for project management, but not before task detail + filters.

### 6.4 Dashboard Tiles Customization

#### Trello analogy

Dashboard view allows tiles such as cards per list, member, label and due date.

#### Donnee OS version

Add configurable dashboard panels later.

Tiles:

- tasks by status
- tasks by priority
- tasks by assignee
- tasks by client
- overdue tasks
- projects at risk
- tasks due this week
- throughput by week

Priority: P2 after core data gets richer.

### 6.5 Workspace-Level Views

#### Trello analogy

Workspace views aggregate across boards.

#### Donnee OS version

Donnee already needs cross-client/project visibility.

Potential views:

- All Tasks
- All Deadlines
- All Projects
- My Work

Priority: P1/P2.

My Work is especially valuable.

## P3 - Automation / Butler-like capabilities

Do not build this before comments, labels, checklists, filters and reliable auth are working.

### 7.1 Rule Engine

#### Trello analogy

Butler rules use trigger + action.

#### Donnee OS version

Basic automation model:

- `automation_rules`
- `automation_triggers`
- `automation_actions`

Example rules:

- When task priority becomes URGENT -> move to top of column and notify manager.
- When task moves to DONE -> set completed_at.
- When due date passes -> mark risk flag.
- When checklist reaches 100% -> suggest moving to REVIEW.

#### Recommendation

Start with hardcoded automations before user-configurable rule engine.

### 7.2 Card Buttons

#### Trello analogy

Card buttons trigger predefined actions.

#### Donnee OS version

Buttons inside task detail:

- Mark as blocked
- Request review
- Move to next stage
- Duplicate task
- Create follow-up

Priority: P2/P3.

### 7.3 Board Buttons

#### Donnee OS version

Actions on project board:

- Sort by due date
- Archive done tasks
- Create weekly review task
- Generate project summary

Priority: P3.

### 7.4 Scheduled Commands

#### Donnee OS version

Scheduled jobs:

- daily overdue digest
- weekly project health recalculation
- monthly activity summary
- create recurring tasks

Priority: P2/P3.

## P2/P3 - Notifications

### 8.1 In-App Notifications

Events:

- assigned to task
- mentioned in comment
- task overdue
- task moved to review
- project risk changed
- comment on watched task

Database:

- `notifications`

Fields:

- `id`
- `user_id`
- `type`
- `title`
- `body`
- `entity_type`
- `entity_id`
- `is_read`
- `created_at`

Endpoints:

- `GET /notifications`
- `PATCH /notifications/{id}/read`
- `PATCH /notifications/read-all`

### 8.2 Email / Google Chat Later

Do not start with email until in-app notifications exist.

## P2 - Mentions

#### Why

Comments become more useful if users can @mention each other.

Add:

- `@user` mention parsing
- notification creation
- mention highlight in comment

Priority: after comments.

## P2 - Templates

### 9.1 Project Templates

Templates for common Donnee services:

- Diagnostico Estrategico de Dados
- Dashboard Executivo
- Automacao de Processo
- IA Aplicada
- Landing Page
- Site Institucional

Each template creates:

- default tasks
- checklists
- suggested statuses
- suggested deadlines

This is more Donnee-specific than Trello and should become a differentiator.

### 9.2 Task Templates

Common recurring tasks:

- Kickoff meeting
- Data access request
- Data cleaning
- Dashboard validation
- Client review
- Final delivery

Priority: P2.

## P1/P2 - Operational Intelligence Features

These are not Trello clone features. They are Donnee OS differentiators.

### 10.1 Project Health Score

Inputs:

- overdue tasks
- blocked tasks
- tasks without assignee
- deadline proximity
- recent activity
- completion percentage

Output:

- 0-100 health_score

Statuses:

- Healthy
- Attention
- At Risk
- Critical

### 10.2 Execution Risk Flags

Flags:

- No update in 7 days
- Deadline within 3 days
- Blocked task exists
- High number of overdue tasks
- No owner assigned

### 10.3 Weekly Operational Summary

Generate a summary:

- completed this week
- delayed
- blocked
- next priorities
- projects at risk

Initially rule-based. AI later.

Priority: P2.

## 11. Recommended Implementation Order

### Sprint 1 - Task Detail & Comments

Goal:

Make task cards useful beyond drag-and-drop.

Deliver:

- `GET /tasks/{id}`
- `TaskDetailModal`
- comments table
- comments API
- activity timeline in modal

Acceptance:

- open task
- edit metadata
- comment
- see activity
- persist everything

### Sprint 2 - Labels, Filters and Better Kanban

Goal:

Make Kanban scalable.

Deliver:

- labels
- task_labels
- filter toolbar
- semantic chips
- Only mine
- Overdue
- Search

Acceptance:

- user can filter board quickly
- labels appear on cards
- filters combine correctly

### Sprint 3 - Checklists / Subtasks

Goal:

Make tasks decomposable.

Deliver:

- checklist_items
- progress indicator
- assign checklist items
- due dates for checklist items

Acceptance:

- task can contain multiple accountable items
- progress is visible

### Sprint 4 - Detail Pages for Projects and Clients

Goal:

Make clients/projects real operational contexts.

Deliver:

- `/clients/:id`
- `/projects/:id`
- scoped tasks
- activity
- summary cards
- quick creation

Acceptance:

- operators can manage work from client/project context

### Sprint 5 - Table View + My Work

Goal:

Improve operational scanning.

Deliver:

- `/tasks/table`
- `/my-work`
- sorting
- filters
- inline status/priority edits

Acceptance:

- operators can manage many tasks without Kanban overload

### Sprint 6 - Calendar / Timeline

Goal:

Add time-based project visibility.

Deliver:

- calendar view
- timeline view
- start_date
- due_date improvements
- drag date changes

Acceptance:

- deadlines and workloads are visible by time

### Sprint 7 - Notifications

Goal:

Make accountability visible.

Deliver:

- notifications table
- in-app notification bell
- mentions later

Acceptance:

- assigned users know what changed

### Sprint 8 - Templates

Goal:

Make Donnee delivery repeatable.

Deliver:

- project templates
- task templates
- consulting delivery templates

Acceptance:

- new projects can be created from service templates

### Sprint 9 - Automations

Goal:

Start Butler-like capability safely.

Deliver:

- hardcoded automation rules first
- later configurable automation rules

Acceptance:

- system performs repetitive operational actions reliably

## 12. Data Model Roadmap

Next tables to add, recommended order:

1. `task_comments`
2. `labels`
3. `task_labels`
4. `task_checklist_items`
5. `attachments`
6. `notifications`
7. `project_templates`
8. `project_template_tasks`
9. `task_members`

Later:

- `workflow_templates`
- `workflow_statuses`
- `automation_rules`
- `automation_events`
- `automation_actions`

## 13. Routes Roadmap

### Task detail

- `GET /tasks/{task_id}`
- `PATCH /tasks/{task_id}`
- `GET /tasks/{task_id}/activity`

### Comments

- `GET /tasks/{task_id}/comments`
- `POST /tasks/{task_id}/comments`
- `PATCH /comments/{comment_id}`
- `DELETE /comments/{comment_id}`

### Labels

- `GET /labels`
- `POST /labels`
- `POST /tasks/{task_id}/labels`
- `DELETE /tasks/{task_id}/labels/{label_id}`

### Checklist

- `GET /tasks/{task_id}/checklist`
- `POST /tasks/{task_id}/checklist`
- `PATCH /checklist-items/{item_id}`
- `DELETE /checklist-items/{item_id}`

### Attachments

- `POST /attachments`
- `GET /attachments`
- `DELETE /attachments/{attachment_id}`

### Notifications

- `GET /notifications`
- `PATCH /notifications/{notification_id}/read`
- `PATCH /notifications/read-all`

### Views

- `GET /tasks/table`
- `GET /my-work`
- `GET /calendar`
- `GET /timeline`

## 14. Non-Goals for Now

Do not implement yet:

- public client portal
- billing/finance/ERP
- advanced AI agents
- complex workflow designer
- map view
- mobile app
- multi-workspace SaaS
- paid plans
- advanced admin console

## 15. Immediate Next Prompt

Use this if asked to implement the next best step:

```txt
Plan and implement Sprint 1: Task Detail & Comments for Donnee OS.

Context:
- Auth is already implemented with Google OAuth and Supabase.
- Backend is FastAPI.
- Frontend is React + Vite + TypeScript.
- Tasks already exist and Kanban drag-and-drop works.
- Activity logs exist.
- Follow AGENTS.md and Donnee OS design/product guidelines.

Goal:
Add a task detail modal/page and comments, without expanding scope.

Implement:
1. Backend:
   - Add GET /tasks/{task_id} if missing.
   - Add task_comments table migration.
   - Add SQLAlchemy model, Pydantic schemas, service and routes for comments.
   - Routes:
     - GET /tasks/{task_id}/comments
     - POST /tasks/{task_id}/comments
     - PATCH /comments/{comment_id}
     - DELETE /comments/{comment_id}
   - Use current authenticated user for created_by.
   - Use soft delete.
   - Add activity logs for comment creation/update/deletion.
2. Frontend:
   - Clicking a Kanban task opens TaskDetailModal.
   - Modal shows task title, description, status, priority, due date, project, activity and comments.
   - User can add a comment.
   - User can edit basic task fields if role allows.
   - Use existing dark premium design system.
   - Add loading/error/empty states.
3. Acceptance criteria:
   - Task card opens detail.
   - Comments can be created and persist.
   - Activity log records relevant actions.
   - Authenticated user is attached to comments.
   - No unrelated files are rewritten.
   - No backend contract is broken.

Return:
- plan
- files changed
- test steps
- commit message
```

## 16. Suggested Commit Message

```bash
docs: add Trello-parity feature backlog for Donnee OS
```

## Recommendation

The next feature should be **Task Detail + Comments**, not Calendar/Timeline yet.

Without a rich task object, the Kanban is only a visual board. With task detail, comments and timeline, Donnee OS starts capturing operational context, which is exactly what differentiates it from a Trello-like board with a nicer skin.
