import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckSquare, Clock } from "lucide-react";
import { api } from "../services/api";
import { getDueStatusClass, getDueStatusLabel, getRiskStatusClass, getRiskStatusLabel } from "../utils/risk";
import { getShortEntityId } from "../utils/format";

type Project = {
  id: string;
  client_id: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  health_score?: number | null;
  risk_status?: string | null;
  start_date?: string | null;
  due_date?: string | null;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  position: number;
  due_date?: string | null;
  due_status?: string | null;
  checklist_total?: number;
  checklist_done?: number;
};

type ActivityLog = {
  id: string;
  action: string;
  performed_at?: string | null;
};

const KANBAN_STATUSES = ["BACKLOG", "IN_PROGRESS", "REVIEW", "BLOCKED", "DONE"];

function getProjectStatusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("delivered")) return "status-done";
  if (s.includes("blocked") || s.includes("paused")) return "status-blocked";
  if (s.includes("review") || s.includes("validation")) return "status-review";
  if (s.includes("progress") || s.includes("active")) return "status-progress";
  if (s.includes("cancel")) return "status-cancelled";
  return "status-backlog";
}

function getPriorityClass(priority: string) {
  const p = priority.toLowerCase();
  if (p.includes("urgent")) return "priority-urgent";
  if (p.includes("high")) return "priority-high";
  if (p.includes("medium")) return "priority-medium";
  return "priority-low";
}

function getHealthClass(score: number) {
  if (score >= 80) return "health-good";
  if (score >= 50) return "health-warning";
  return "health-risk";
}

function isOverdue(task: Task) {
  return task.due_status === "OVERDUE";
}

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [clientName, setClientName] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState("");
  const [draggingOverStatus, setDraggingOverStatus] = useState("");
  const [savingTaskId, setSavingTaskId] = useState("");

  async function loadTasks() {
    const res = await api.get(`/tasks?project_id=${projectId}`);
    setTasks(res.data);
  }

  useEffect(() => {
    if (!projectId) return;
    let isMounted = true;

    Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/tasks?project_id=${projectId}`),
      api.get(`/projects/${projectId}/activity`),
    ])
      .then(async ([projectRes, tasksRes, activityRes]) => {
        if (!isMounted) return;
        setProject(projectRes.data);
        setTasks(tasksRes.data);
        setActivity(activityRes.data);

        try {
          const clientRes = await api.get(`/clients/${projectRes.data.client_id}`);
          if (isMounted) setClientName(clientRes.data.name);
        } catch {
          // non-critical
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Não foi possível carregar os dados do projeto.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  async function createTask() {
    if (!newTaskTitle.trim() || !projectId) return;
    setIsCreatingTask(true);
    try {
      await api.post("/tasks", {
        project_id: projectId,
        title: newTaskTitle.trim(),
        status: "BACKLOG",
        priority: "MEDIUM",
      });
      setNewTaskTitle("");
      setShowCreateForm(false);
      await loadTasks();
    } catch {
      // silent — task list still visible
    } finally {
      setIsCreatingTask(false);
    }
  }

  if (isLoading) {
    return (
      <section className="content">
        <p className="muted" aria-live="polite">Carregando projeto...</p>
      </section>
    );
  }

  if (error || !project) {
    return (
      <section className="content">
        <div className="error-banner" role="alert">{error || "Projeto não encontrado."}</div>
        <button className="ghost-action" type="button" onClick={() => navigate("/projects")}>← Voltar</button>
      </section>
    );
  }

  const activeTasks = tasks.filter((t) => t.status !== "CANCELLED");
  const doneTasks = tasks.filter((t) => t.status === "DONE");
  const overdueTasks = tasks.filter(isOverdue);
  const completionPct = activeTasks.length > 0
    ? Math.round((doneTasks.length / activeTasks.length) * 100)
    : 0;

  const tasksByStatus = KANBAN_STATUSES.reduce<Record<string, Task[]>>((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).sort((a, b) => a.position - b.position);
    return acc;
  }, {});

  function getNextProjectTasksAfterMove(taskId: string, nextStatus: string, nextPosition: number) {
    const movingTask = tasks.find((task) => task.id === taskId);
    if (!movingTask) return tasks;

    const sourceStatus = movingTask.status;
    const sourceTasks = tasks
      .filter((task) => task.status === sourceStatus && task.id !== taskId)
      .sort((a, b) => a.position - b.position)
      .map((task, index) => ({ ...task, position: index }));

    const destinationTasks = tasks
      .filter((task) => task.status === nextStatus && task.id !== taskId)
      .sort((a, b) => a.position - b.position);

    const boundedPosition = Math.max(0, Math.min(nextPosition, destinationTasks.length));
    const movedTask = { ...movingTask, status: nextStatus, position: boundedPosition };
    const orderedDestinationTasks = [
      ...destinationTasks.slice(0, boundedPosition),
      movedTask,
      ...destinationTasks.slice(boundedPosition),
    ].map((task, index) => ({ ...task, position: index }));

    if (sourceStatus === nextStatus) {
      return tasks.map((task) =>
        task.status === nextStatus
          ? orderedDestinationTasks.find((destinationTask) => destinationTask.id === task.id) ?? task
          : task,
      );
    }

    return tasks.map((task) => {
      if (task.status === sourceStatus && task.id !== taskId) {
        return sourceTasks.find((sourceTask) => sourceTask.id === task.id) ?? task;
      }

      if (task.status === nextStatus || task.id === taskId) {
        return orderedDestinationTasks.find((destinationTask) => destinationTask.id === task.id) ?? task;
      }

      return task;
    });
  }

  async function moveProjectTask(taskId: string, nextStatus: string, nextPosition: number) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);
    if (!task || savingTaskId === taskId) return;

    const previousTasks = tasks;
    const nextTasks = getNextProjectTasksAfterMove(taskId, nextStatus, nextPosition);
    const movedTask = nextTasks.find((currentTask) => currentTask.id === taskId);
    if (!movedTask || (task.status === movedTask.status && task.position === movedTask.position)) return;

    setSavingTaskId(taskId);
    setTasks(nextTasks);

    try {
      const response = await api.patch(`/tasks/${taskId}/move`, {
        status: movedTask.status,
        position: movedTask.position,
      });
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === taskId ? { ...currentTask, ...response.data } : currentTask,
        ),
      );
    } catch {
      setTasks(previousTasks);
      setError("Não foi possível salvar a mudança de status. A tarefa voltou ao estado anterior.");
    } finally {
      setSavingTaskId("");
      setDraggingTaskId("");
      setDraggingOverStatus("");
    }
  }

  return (
    <section className="content">
      <button className="back-link" type="button" onClick={() => navigate("/projects")}>
        <ArrowLeft size={16} />
        Voltar para Projetos
      </button>

      <header className="page-header detail-header">
        <div>
          <p className="eyebrow">
            Projeto
            {clientName && (
              <>
                {" · "}
                <button
                  className="inline-link"
                  type="button"
                  onClick={() => navigate(`/clients/${getShortEntityId(project.client_id)}`)}
                >
                  {clientName}
                </button>
              </>
            )}
          </p>
          <h1>{project.name}</h1>
          {project.description && <p className="detail-subtitle">{project.description}</p>}
        </div>
        <div className="detail-header-badges">
          <strong className={`status-pill ${getProjectStatusClass(project.status)}`}>
            {project.status}
          </strong>
          <strong className={`status-pill ${getPriorityClass(project.priority)}`}>
            {project.priority}
          </strong>
          <strong className={`risk-pill ${getRiskStatusClass(project.risk_status)}`}>
            {getRiskStatusLabel(project.risk_status)}
          </strong>
        </div>
      </header>

      {project.due_date && (
        <div className="detail-meta-row">
          <Clock size={14} />
          <span>Prazo: {new Date(project.due_date).toLocaleDateString("pt-BR")}</span>
        </div>
      )}

      <div className="summary-cards">
        <div className="summary-card">
          <CheckSquare size={20} />
          <div>
            <strong>{activeTasks.length}</strong>
            <span>Tarefas ativas</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-pct">{completionPct}%</div>
          <div>
            <strong>{doneTasks.length}/{activeTasks.length}</strong>
            <span>Concluídas</span>
          </div>
        </div>
        <div className={`summary-card ${overdueTasks.length > 0 ? "summary-card-risk" : ""}`}>
          <AlertTriangle size={20} />
          <div>
            <strong>{overdueTasks.length}</strong>
            <span>Atrasadas</span>
          </div>
        </div>
      </div>

      {project.health_score !== null && project.health_score !== undefined && (
        <div className="panel panel-compact">
          <div className="health-meter">
            <div className="health-meter-label">
              <span>Health score</span>
              <strong>{project.health_score}% · {getRiskStatusLabel(project.risk_status)}</strong>
            </div>
            <div className="health-track">
              <span
                className={`health-fill ${getHealthClass(project.health_score)}`}
                style={{ width: `${Math.max(0, Math.min(project.health_score, 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-heading">
          <h2>Tarefas</h2>
          <button
            className="ghost-action"
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
          >
            {showCreateForm ? "Cancelar" : "+ Nova tarefa"}
          </button>
        </div>

        {showCreateForm && (
          <div className="inline-create-row">
            <input
              autoFocus
              placeholder="Título da tarefa"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createTask()}
            />
            <button
              type="button"
              disabled={isCreatingTask || !newTaskTitle.trim()}
              onClick={createTask}
            >
              {isCreatingTask ? "Criando..." : "Criar"}
            </button>
          </div>
        )}

        <div className="project-kanban">
          {KANBAN_STATUSES.map((status) => (
            <div
              key={status}
              className={`project-kanban-col ${draggingTaskId ? "project-kanban-col-target" : ""} ${draggingOverStatus === status ? "project-kanban-col-hover" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDragEnter={() => setDraggingOverStatus(status)}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDraggingOverStatus("");
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDraggingOverStatus("");
                const taskId = event.dataTransfer.getData("text/plain") || draggingTaskId;
                requestAnimationFrame(() => moveProjectTask(taskId, status, tasksByStatus[status].length));
              }}
            >
              <div className="kanban-col-header">
                <span className={`status-dot status-dot-${status.toLowerCase()}`} />
                <span>{status.replace("_", " ")}</span>
                <span className="kanban-col-count">{tasksByStatus[status].length}</span>
              </div>
              <div className="kanban-col-tasks">
                {tasksByStatus[status].length === 0 ? (
                  <p className="kanban-col-empty">—</p>
                ) : (
                  tasksByStatus[status].map((task) => (
                    <article
                      key={task.id}
                      className={`mini-task-card ${isOverdue(task) ? "mini-task-overdue" : ""} ${draggingTaskId === task.id ? "mini-task-dragging" : ""} ${savingTaskId === task.id ? "mini-task-saving" : ""}`}
                      draggable={savingTaskId !== task.id}
                      onDragEnd={() => setDraggingTaskId("")}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", task.id);
                        setDraggingTaskId(task.id);
                      }}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        const draggedTaskId = event.dataTransfer.getData("text/plain") || draggingTaskId;
                        const targetPosition = tasksByStatus[status].findIndex((statusTask) => statusTask.id === task.id);
                        requestAnimationFrame(() => moveProjectTask(draggedTaskId, status, targetPosition));
                      }}
                    >
                      <span className="mini-task-title">{task.title}</span>
                      <div className="mini-task-meta">
                        <span className={`status-pill status-pill-xs ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={`due-chip due-chip-xs ${getDueStatusClass(task.due_status)}`} title={task.due_date ? new Date(task.due_date).toLocaleDateString("pt-BR") : undefined}>
                          {getDueStatusLabel(task.due_status)}
                        </span>
                        {(task.checklist_total ?? 0) > 0 && (
                          <span className="meta-chip meta-chip-xs">
                            ✓ {task.checklist_done}/{task.checklist_total}
                          </span>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Atividade recente</h2>
        </div>
        {activity.length === 0 ? (
          <p className="empty-state">Nenhuma atividade registrada para este projeto.</p>
        ) : (
          <ul className="activity-list">
            {activity.slice(0, 20).map((log) => (
              <li key={log.id} className="activity-item">
                <span className="activity-action">{log.action}</span>
                {log.performed_at && (
                  <span className="activity-time">
                    {new Date(log.performed_at).toLocaleString("pt-BR")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
