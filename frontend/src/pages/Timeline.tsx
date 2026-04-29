import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BriefcaseBusiness, Clock, ListTodo } from "lucide-react";
import { api } from "../services/api";

type Task = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: string;
  start_date?: string | null;
  due_date?: string | null;
  due_status?: string | null;
};

type Project = {
  id: string;
  client_id?: string | null;
  name: string;
  status: string;
  priority: string;
  start_date?: string | null;
  due_date?: string | null;
};

type Client = {
  id: string;
  name: string;
};

type TimelineTask = {
  task: Task;
  start: Date;
  end: Date;
  isPoint: boolean;
  isOverdue: boolean;
};

type TimelineGroup = {
  project: Project;
  client?: Client;
  tasks: TimelineTask[];
};

const dayMs = 24 * 60 * 60 * 1000;

function parseLocalDate(value: string) {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

function daysBetween(start: Date, end: Date) {
  return Math.round((end.getTime() - start.getTime()) / dayMs);
}

function formatDate(value?: string | null) {
  if (!value) return "sem data";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(value));
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

function isInactive(status: string) {
  return status === "DONE" || status === "CANCELLED" || status === "DELIVERED";
}

function getPriorityClass(priority: string) {
  const p = priority.toLowerCase();
  if (p.includes("urgent")) return "priority-urgent";
  if (p.includes("high")) return "priority-high";
  if (p.includes("medium")) return "priority-medium";
  return "priority-low";
}

export function Timeline() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([api.get("/tasks"), api.get("/projects"), api.get("/clients")])
      .then(([tasksRes, projectsRes, clientsRes]) => {
        if (!isMounted) return;
        setTasks(tasksRes.data);
        setProjects(projectsRes.data);
        setClients(clientsRes.data);
      })
      .catch(() => {
        if (isMounted) setError("Não foi possível carregar a timeline.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const projectMap = useMemo(() => {
    const map: Record<string, Project> = {};
    projects.forEach((project) => {
      map[project.id] = project;
    });
    return map;
  }, [projects]);

  const clientMap = useMemo(() => {
    const map: Record<string, Client> = {};
    clients.forEach((client) => {
      map[client.id] = client;
    });
    return map;
  }, [clients]);

  const groups = useMemo<TimelineGroup[]>(() => {
    const today = new Date();
    const byProject: Record<string, TimelineTask[]> = {};

    tasks.forEach((task) => {
      const anchor = task.due_date || task.start_date;
      if (!anchor) return;

      const start = parseLocalDate(task.start_date || task.due_date || anchor);
      const end = parseLocalDate(task.due_date || task.start_date || anchor);
      const orderedStart = start <= end ? start : end;
      const orderedEnd = start <= end ? end : start;

      byProject[task.project_id] = byProject[task.project_id] || [];
      byProject[task.project_id].push({
        task,
        start: orderedStart,
        end: orderedEnd,
        isPoint: toDateKey(orderedStart) === toDateKey(orderedEnd),
        isOverdue: task.due_status === "OVERDUE" || Boolean(task.due_date && parseLocalDate(task.due_date) < today && !isInactive(task.status)),
      });
    });

    return Object.entries(byProject)
      .map(([projectId, projectTasks]) => {
        const project = projectMap[projectId] || {
          id: projectId,
          name: "Projeto não encontrado",
          status: "UNKNOWN",
          priority: "MEDIUM",
        };
        return {
          project,
          client: project.client_id ? clientMap[project.client_id] : undefined,
          tasks: projectTasks.sort((a, b) => a.start.getTime() - b.start.getTime()),
        };
      })
      .sort((a, b) => a.project.name.localeCompare(b.project.name, "pt-BR"));
  }, [tasks, projectMap, clientMap]);

  const range = useMemo(() => {
    const dates = groups.flatMap((group) => group.tasks.flatMap((item) => [item.start, item.end]));
    projects.forEach((project) => {
      if (project.due_date) dates.push(parseLocalDate(project.due_date));
      if (project.start_date) dates.push(parseLocalDate(project.start_date));
    });

    if (dates.length === 0) {
      const today = new Date();
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      };
    }

    const min = new Date(Math.min(...dates.map((date) => date.getTime())));
    const max = new Date(Math.max(...dates.map((date) => date.getTime())));
    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 3);
    return { start: min, end: max };
  }, [groups, projects]);

  const totalDays = Math.max(1, daysBetween(range.start, range.end));
  const datedTasks = groups.reduce((count, group) => count + group.tasks.length, 0);
  const overdueTasks = groups.reduce((count, group) => count + group.tasks.filter((item) => item.isOverdue).length, 0);
  const projectMilestones = projects.filter((project) => Boolean(project.due_date)).length;
  const axisLabels = Array.from({ length: 5 }, (_, index) => {
    const date = new Date(range.start);
    date.setDate(range.start.getDate() + Math.round((totalDays / 4) * index));
    return date;
  });

  function toDateKey(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getPosition(start: Date, end: Date) {
    const left = Math.max(0, (daysBetween(range.start, start) / totalDays) * 100);
    const width = Math.max(2.5, ((daysBetween(start, end) + 1) / totalDays) * 100);
    return {
      left: `${Math.min(left, 98)}%`,
      width: `${Math.min(width, 100 - left)}%`,
    };
  }

  function getMilestonePosition(project: Project) {
    if (!project.due_date) return undefined;
    const left = Math.max(0, (daysBetween(range.start, parseLocalDate(project.due_date)) / totalDays) * 100);
    return `${Math.min(left, 99)}%`;
  }

  return (
    <section className="content">
      <header className="page-header">
        <p className="eyebrow">Donnée OS</p>
        <h1>Timeline</h1>
        <p>Execução por projeto, usando início e prazo das tarefas.</p>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="summary-cards">
        <div className="summary-card">
          <ListTodo size={20} />
          <div>
            <strong>{datedTasks}</strong>
            <span>Tarefas com data</span>
          </div>
        </div>
        <div className="summary-card">
          <BriefcaseBusiness size={20} />
          <div>
            <strong>{projectMilestones}</strong>
            <span>Marcos de projeto</span>
          </div>
        </div>
        <div className={`summary-card ${overdueTasks > 0 ? "summary-card-risk" : ""}`}>
          <AlertTriangle size={20} />
          <div>
            <strong>{overdueTasks}</strong>
            <span>Atrasadas</span>
          </div>
        </div>
      </div>

      <div className="panel timeline-surface">
        <div className="timeline-header">
          <div>
            <h2>Projetos em execução</h2>
            <p className="row-detail">{formatShortDate(range.start)} até {formatShortDate(range.end)}</p>
          </div>
          <Clock size={18} />
        </div>

        <div className="timeline-axis" aria-hidden="true">
          {axisLabels.map((date) => (
            <span key={date.toISOString()}>{formatShortDate(date)}</span>
          ))}
        </div>

        {isLoading ? (
          <p className="muted" aria-live="polite">Carregando timeline...</p>
        ) : groups.length === 0 ? (
          <p className="empty-state">Nenhuma tarefa com início ou prazo para montar a timeline.</p>
        ) : (
          <div className="timeline-group-list">
            {groups.map((group) => {
              const milestoneLeft = getMilestonePosition(group.project);

              return (
                <article className="timeline-group" key={group.project.id}>
                  <div className="timeline-project-cell">
                    <Link to={`/projects/${group.project.id}`}>{group.project.name}</Link>
                    <span>{group.client?.name || "Sem cliente"}</span>
                    {group.project.due_date && <small>Marco: {formatDate(group.project.due_date)}</small>}
                  </div>

                  <div className="timeline-track">
                    {milestoneLeft && (
                      <span
                        className="timeline-milestone"
                        style={{ left: milestoneLeft }}
                        title={`Marco do projeto: ${formatDate(group.project.due_date)}`}
                      />
                    )}

                    {group.tasks.map((item) => {
                      const position = getPosition(item.start, item.end);

                      return (
                        <Link
                          className={`timeline-bar ${item.isPoint ? "timeline-bar-point" : ""} ${item.isOverdue ? "timeline-bar-risk" : ""} ${getPriorityClass(item.task.priority)}`}
                          key={item.task.id}
                          style={position}
                          title={`${item.task.title}: ${formatShortDate(item.start)} até ${formatShortDate(item.end)}`}
                          to="/tasks"
                        >
                          <span>{item.task.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
