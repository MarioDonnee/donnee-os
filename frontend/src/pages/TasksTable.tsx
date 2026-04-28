import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { api } from "../services/api";

type Label = { id: string; name: string; color?: string | null };
type Task = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: string;
  assignee_id?: string | null;
  due_date?: string | null;
  updated_at?: string | null;
  labels?: Label[];
  checklist_total?: number;
  checklist_done?: number;
};
type Project = { id: string; name: string; client_id?: string | null };
type Client = { id: string; name: string };

const STATUSES = ["BACKLOG", "IN_PROGRESS", "REVIEW", "BLOCKED", "DONE", "CANCELLED"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];
const PRIORITY_ORDER: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function isOverdue(task: Task) {
  if (!task.due_date) return false;
  if (task.status === "DONE" || task.status === "CANCELLED") return false;
  return new Date(task.due_date) < new Date();
}

function getPriorityClass(p: string) {
  if (p === "URGENT") return "priority-urgent";
  if (p === "HIGH") return "priority-high";
  if (p === "MEDIUM") return "priority-medium";
  return "priority-low";
}

function getStatusClass(s: string) {
  if (s === "DONE") return "status-done";
  if (s === "IN_PROGRESS") return "status-progress";
  if (s === "REVIEW") return "status-review";
  if (s === "BLOCKED") return "status-blocked";
  if (s === "CANCELLED") return "status-cancelled";
  return "status-backlog";
}

type SortKey = "title" | "status" | "priority" | "due_date" | "updated_at" | "project" | "client";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown size={12} className="sort-icon sort-icon-inactive" />;
  return dir === "asc"
    ? <ArrowUp size={12} className="sort-icon" />
    : <ArrowDown size={12} className="sort-icon" />;
}

export function TasksTable() {
  const { currentUser } = useAuth();
  const isViewer = currentUser?.role === "VIEWER";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterOverdue, setFilterOverdue] = useState(false);

  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: "status" | "priority" } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load metadata once
  useEffect(() => {
    Promise.all([api.get("/projects"), api.get("/clients")])
      .then(([pRes, cRes]) => {
        setProjects(pRes.data);
        setClients(cRes.data);
      })
      .catch(() => setError("Não foi possível carregar os dados."))
      .finally(() => setIsLoadingMeta(false));
  }, []);

  // Reload tasks when filters change
  useEffect(() => {
    let isMounted = true;
    setIsLoadingTasks(true);

    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterPriority) params.set("priority", filterPriority);
    if (filterProjectId) params.set("project_id", filterProjectId);
    if (filterOverdue) params.set("overdue", "true");
    if (debouncedSearch) params.set("search", debouncedSearch);

    api.get(`/tasks?${params}`)
      .then((res) => { if (isMounted) setTasks(res.data); })
      .catch(() => { if (isMounted) setError("Não foi possível carregar as tarefas."); })
      .finally(() => { if (isMounted) setIsLoadingTasks(false); });

    return () => { isMounted = false; };
  }, [filterStatus, filterPriority, filterProjectId, filterOverdue, debouncedSearch]);

  const projectMap = useMemo(() => {
    const m: Record<string, Project> = {};
    projects.forEach((p) => { m[p.id] = p; });
    return m;
  }, [projects]);

  const clientMap = useMemo(() => {
    const m: Record<string, Client> = {};
    clients.forEach((c) => { m[c.id] = c; });
    return m;
  }, [clients]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      let va = "";
      let vb = "";

      switch (sortKey) {
        case "title": va = a.title; vb = b.title; break;
        case "status": va = a.status; vb = b.status; break;
        case "priority":
          va = String(PRIORITY_ORDER[a.priority] ?? 9);
          vb = String(PRIORITY_ORDER[b.priority] ?? 9);
          break;
        case "due_date": va = a.due_date ?? ""; vb = b.due_date ?? ""; break;
        case "updated_at": va = a.updated_at ?? ""; vb = b.updated_at ?? ""; break;
        case "project":
          va = projectMap[a.project_id]?.name ?? "";
          vb = projectMap[b.project_id]?.name ?? "";
          break;
        case "client": {
          const ca = projectMap[a.project_id]?.client_id;
          const cb = projectMap[b.project_id]?.client_id;
          va = ca ? clientMap[ca]?.name ?? "" : "";
          vb = cb ? clientMap[cb]?.name ?? "" : "";
          break;
        }
      }

      const cmp = va.localeCompare(vb, "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [tasks, sortKey, sortDir, projectMap, clientMap]);

  async function patchTask(taskId: string, field: "status" | "priority", value: string) {
    if (isViewer) return;
    setEditingCell(null);
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, [field]: value } : t));
    try {
      await api.patch(`/tasks/${taskId}`, { [field]: value });
    } catch {
      const res = await api.get("/tasks");
      setTasks(res.data);
    }
  }

  const activeFilters = [filterStatus, filterPriority, filterProjectId, filterOverdue ? "1" : ""].filter(Boolean).length;
  const isLoading = isLoadingMeta || isLoadingTasks;

  return (
    <section className="content">
      <header className="page-header">
        <p className="eyebrow">Donnée OS</p>
        <h1>Tabela de Tarefas</h1>
        <p>Visão tabular com ordenação e edição inline de status e prioridade.</p>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="table-toolbar">
        <input
          className="table-search"
          placeholder="Buscar tarefas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>

        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
          <option value="">Todas as prioridades</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={filterProjectId} onChange={(e) => setFilterProjectId(e.target.value)}>
          <option value="">Todos os projetos</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <label className="toggle-filter">
          <input type="checkbox" checked={filterOverdue} onChange={(e) => setFilterOverdue(e.target.checked)} />
          Atrasadas
        </label>

        {activeFilters > 0 && (
          <button
            className="ghost-action"
            type="button"
            onClick={() => { setFilterStatus(""); setFilterPriority(""); setFilterProjectId(""); setFilterOverdue(false); setSearch(""); }}
          >
            Limpar ({activeFilters})
          </button>
        )}

        <span className="table-count">{isLoadingTasks ? "..." : `${sortedTasks.length} tarefas`}</span>
      </div>

      {isLoading ? (
        <p className="muted" aria-live="polite">Carregando tarefas...</p>
      ) : sortedTasks.length === 0 ? (
        <p className="empty-state">Nenhuma tarefa encontrada para os filtros aplicados.</p>
      ) : (
        <div className="table-wrapper">
          <table className="tasks-table">
            <thead>
              <tr>
                <th className="th-sortable" onClick={() => toggleSort("title")}>
                  Título <SortIcon active={sortKey === "title"} dir={sortDir} />
                </th>
                <th className="th-sortable" onClick={() => toggleSort("project")}>
                  Projeto <SortIcon active={sortKey === "project"} dir={sortDir} />
                </th>
                <th className="th-sortable" onClick={() => toggleSort("client")}>
                  Cliente <SortIcon active={sortKey === "client"} dir={sortDir} />
                </th>
                <th className="th-sortable" onClick={() => toggleSort("status")}>
                  Status <SortIcon active={sortKey === "status"} dir={sortDir} />
                </th>
                <th className="th-sortable" onClick={() => toggleSort("priority")}>
                  Prioridade <SortIcon active={sortKey === "priority"} dir={sortDir} />
                </th>
                <th className="th-sortable" onClick={() => toggleSort("due_date")}>
                  Prazo <SortIcon active={sortKey === "due_date"} dir={sortDir} />
                </th>
                <th>Labels</th>
                <th>Progresso</th>
                <th className="th-sortable" onClick={() => toggleSort("updated_at")}>
                  Atualizado <SortIcon active={sortKey === "updated_at"} dir={sortDir} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task) => {
                const project = projectMap[task.project_id];
                const client = project?.client_id ? clientMap[project.client_id] : null;
                const overdue = isOverdue(task);
                const isEditingStatus = editingCell?.taskId === task.id && editingCell.field === "status";
                const isEditingPriority = editingCell?.taskId === task.id && editingCell.field === "priority";

                return (
                  <tr key={task.id} className={overdue ? "row-overdue" : ""}>
                    <td className="td-title">
                      <span className="task-title-cell">{task.title}</span>
                      {overdue && <span className="overdue-badge">Atrasada</span>}
                    </td>
                    <td className="td-secondary">{project?.name ?? "—"}</td>
                    <td className="td-secondary">{client?.name ?? "—"}</td>
                    <td className="td-pill">
                      {isEditingStatus && !isViewer ? (
                        <select
                          autoFocus
                          className="inline-select"
                          value={task.status}
                          onChange={(e) => patchTask(task.id, "status", e.target.value)}
                          onBlur={() => setEditingCell(null)}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                        </select>
                      ) : (
                        <button
                          type="button"
                          className={`status-pill table-pill-btn ${getStatusClass(task.status)}`}
                          title={isViewer ? task.status : "Clique para editar"}
                          onClick={() => !isViewer && setEditingCell({ taskId: task.id, field: "status" })}
                        >
                          {task.status.replace("_", " ")}
                        </button>
                      )}
                    </td>
                    <td className="td-pill">
                      {isEditingPriority && !isViewer ? (
                        <select
                          autoFocus
                          className="inline-select"
                          value={task.priority}
                          onChange={(e) => patchTask(task.id, "priority", e.target.value)}
                          onBlur={() => setEditingCell(null)}
                        >
                          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      ) : (
                        <button
                          type="button"
                          className={`status-pill table-pill-btn ${getPriorityClass(task.priority)}`}
                          title={isViewer ? task.priority : "Clique para editar"}
                          onClick={() => !isViewer && setEditingCell({ taskId: task.id, field: "priority" })}
                        >
                          {task.priority}
                        </button>
                      )}
                    </td>
                    <td className={`td-secondary ${overdue ? "td-overdue" : ""}`}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString("pt-BR") : "—"}
                    </td>
                    <td>
                      <div className="label-chips">
                        {(task.labels ?? []).map((l) => (
                          <span
                            key={l.id}
                            className="label-chip-sm"
                            style={l.color ? { background: l.color + "33", borderColor: l.color + "66" } : {}}
                          >
                            {l.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="td-progress">
                      {(task.checklist_total ?? 0) > 0 ? (
                        <div className="mini-progress">
                          <div
                            className="mini-progress-fill"
                            style={{ width: `${Math.round(((task.checklist_done ?? 0) / task.checklist_total!) * 100)}%` }}
                          />
                          <span>{task.checklist_done}/{task.checklist_total}</span>
                        </div>
                      ) : (
                        <span className="td-secondary">—</span>
                      )}
                    </td>
                    <td className="td-secondary">
                      {task.updated_at ? new Date(task.updated_at).toLocaleDateString("pt-BR") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
