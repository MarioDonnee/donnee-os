import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckSquare, Clock } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { api } from "../services/api";

type Label = { id: string; name: string; color?: string | null };
type Task = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: string;
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

type GroupIcon = "risk" | "today" | "week" | "later" | "none";
type Group = { label: string; icon: GroupIcon; tasks: Task[] };

function buildGroups(tasks: Task[]): Group[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);
  const weekEnd = new Date(today.getTime() + 7 * 86400000);

  const active = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const done = tasks.filter((t) => t.status === "DONE");

  const overdue = active.filter((t) => t.due_date && new Date(t.due_date) < today);
  const dueToday = active.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d >= today && d < tomorrow;
  });
  const dueWeek = active.filter((t) => {
    if (!t.due_date) return false;
    const d = new Date(t.due_date);
    return d >= tomorrow && d < weekEnd;
  });
  const later = active.filter((t) => t.due_date && new Date(t.due_date) >= weekEnd);
  const noDate = active.filter((t) => !t.due_date);

  const groups: Group[] = [];
  if (overdue.length) groups.push({ label: "Atrasadas", icon: "risk", tasks: overdue });
  if (dueToday.length) groups.push({ label: "Vencem hoje", icon: "today", tasks: dueToday });
  if (dueWeek.length) groups.push({ label: "Esta semana", icon: "week", tasks: dueWeek });
  if (later.length) groups.push({ label: "Mais tarde", icon: "later", tasks: later });
  if (noDate.length) groups.push({ label: "Sem prazo", icon: "none", tasks: noDate });
  if (done.length) groups.push({ label: "Concluídas", icon: "none", tasks: done });

  return groups;
}

export function MyWork() {
  const { currentUser } = useAuth();
  const isViewer = currentUser?.role === "VIEWER";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingCell, setEditingCell] = useState<{ taskId: string; field: "status" | "priority" } | null>(null);

  async function load() {
    const [tasksRes, projectsRes, clientsRes] = await Promise.all([
      api.get("/tasks?only_mine=true"),
      api.get("/projects"),
      api.get("/clients"),
    ]);
    setTasks(tasksRes.data);
    setProjects(projectsRes.data);
    setClients(clientsRes.data);
  }

  useEffect(() => {
    let isMounted = true;
    load()
      .catch(() => { if (isMounted) setError("Não foi possível carregar suas tarefas."); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

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

  async function patchTask(taskId: string, field: "status" | "priority", value: string) {
    if (isViewer) return;
    setEditingCell(null);
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, [field]: value } : t));
    try {
      await api.patch(`/tasks/${taskId}`, { [field]: value });
    } catch {
      await load();
    }
  }

  const groups = useMemo(() => buildGroups(tasks), [tasks]);
  const activeTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const overdueTasks = activeTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date());
  const doneTasks = tasks.filter((t) => t.status === "DONE");

  if (isLoading) {
    return <section className="content"><p className="muted" aria-live="polite">Carregando suas tarefas...</p></section>;
  }

  return (
    <section className="content">
      <header className="page-header">
        <p className="eyebrow">Donnée OS</p>
        <h1>Meu Trabalho</h1>
        <p>Tarefas atribuídas a você, agrupadas por prazo.</p>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="summary-cards">
        <div className="summary-card">
          <CheckSquare size={20} />
          <div>
            <strong>{activeTasks.length}</strong>
            <span>Tarefas ativas</span>
          </div>
        </div>
        <div className={`summary-card ${overdueTasks.length > 0 ? "summary-card-risk" : ""}`}>
          <AlertTriangle size={20} />
          <div>
            <strong>{overdueTasks.length}</strong>
            <span>Atrasadas</span>
          </div>
        </div>
        <div className="summary-card">
          <Clock size={20} />
          <div>
            <strong>{doneTasks.length}</strong>
            <span>Concluídas</span>
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="panel">
          <p className="empty-state">Você não tem tarefas atribuídas no momento.</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.label} className="panel">
            <div className="panel-heading">
              <h2 className={`group-heading ${group.icon === "risk" ? "group-heading-risk" : ""}`}>
                {group.label}
              </h2>
              <span>{group.tasks.length}</span>
            </div>
            <div className="my-work-list">
              {group.tasks.map((task) => {
                const project = projectMap[task.project_id];
                const client = project?.client_id ? clientMap[project.client_id] : null;
                const isEditingStatus = editingCell?.taskId === task.id && editingCell.field === "status";
                const isEditingPriority = editingCell?.taskId === task.id && editingCell.field === "priority";

                return (
                  <div key={task.id} className="my-work-row">
                    <div className="my-work-main">
                      <span className="my-work-title">{task.title}</span>
                      <div className="my-work-meta">
                        {project && <span className="meta-chip">{project.name}</span>}
                        {client && <span className="meta-chip">{client.name}</span>}
                        {(task.checklist_total ?? 0) > 0 && (
                          <span className="meta-chip">✓ {task.checklist_done}/{task.checklist_total}</span>
                        )}
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
                    </div>
                    <div className="my-work-actions">
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
                          onClick={() => !isViewer && setEditingCell({ taskId: task.id, field: "priority" })}
                        >
                          {task.priority}
                        </button>
                      )}
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
                          onClick={() => !isViewer && setEditingCell({ taskId: task.id, field: "status" })}
                        >
                          {task.status.replace("_", " ")}
                        </button>
                      )}
                      {task.due_date && (
                        <span className={`meta-chip ${new Date(task.due_date) < new Date() && task.status !== "DONE" ? "meta-chip-risk" : ""}`}>
                          {new Date(task.due_date).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </section>
  );
}
