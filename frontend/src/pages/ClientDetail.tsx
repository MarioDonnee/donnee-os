import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Briefcase, CheckSquare } from "lucide-react";
import { api } from "../services/api";

type Client = {
  id: string;
  name: string;
  segment?: string | null;
  status: string;
  main_contact_name?: string | null;
  main_contact_email?: string | null;
  main_contact_phone?: string | null;
  notes?: string | null;
};

type Project = {
  id: string;
  name: string;
  status: string;
  priority: string;
  health_score?: number | null;
  due_date?: string | null;
};

type Task = {
  id: string;
  status: string;
  due_date?: string | null;
};

type ActivityLog = {
  id: string;
  action: string;
  performed_at?: string | null;
};

function getClientStatusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("active")) return "status-done";
  if (s.includes("paused") || s.includes("blocked")) return "status-blocked";
  if (s.includes("closed") || s.includes("cancel")) return "status-cancelled";
  return "status-backlog";
}

function getProjectStatusClass(status: string) {
  const s = status.toLowerCase();
  if (s.includes("done") || s.includes("delivered")) return "status-done";
  if (s.includes("blocked") || s.includes("paused")) return "status-blocked";
  if (s.includes("review") || s.includes("validation")) return "status-review";
  if (s.includes("progress") || s.includes("active")) return "status-progress";
  if (s.includes("cancel")) return "status-cancelled";
  return "status-backlog";
}

function isOverdue(task: Task) {
  if (!task.due_date) return false;
  if (task.status === "DONE" || task.status === "CANCELLED") return false;
  return new Date(task.due_date) < new Date();
}

export function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!clientId) return;
    let isMounted = true;

    Promise.all([
      api.get(`/clients/${clientId}`),
      api.get(`/projects?client_id=${clientId}`),
      api.get(`/tasks?client_id=${clientId}`),
      api.get(`/clients/${clientId}/activity`),
    ])
      .then(([clientRes, projectsRes, tasksRes, activityRes]) => {
        if (!isMounted) return;
        setClient(clientRes.data);
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
        setActivity(activityRes.data);
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Não foi possível carregar os dados do cliente.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  if (isLoading) {
    return (
      <section className="content">
        <p className="muted" aria-live="polite">Carregando cliente...</p>
      </section>
    );
  }

  if (error || !client) {
    return (
      <section className="content">
        <div className="error-banner" role="alert">{error || "Cliente não encontrado."}</div>
        <button className="ghost-action" type="button" onClick={() => navigate("/clients")}>← Voltar</button>
      </section>
    );
  }

  const openTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const overdueTasks = tasks.filter(isOverdue);

  return (
    <section className="content">
      <button className="back-link" type="button" onClick={() => navigate("/clients")}>
        <ArrowLeft size={16} />
        Voltar para Clientes
      </button>

      <header className="page-header detail-header">
        <div>
          <p className="eyebrow">Cliente</p>
          <h1>{client.name}</h1>
          {client.segment && <p className="detail-subtitle">{client.segment}</p>}
        </div>
        <strong className={`status-pill ${getClientStatusClass(client.status)}`}>
          {client.status}
        </strong>
      </header>

      {(client.main_contact_name || client.main_contact_email || client.main_contact_phone) && (
        <div className="panel panel-compact">
          <h2>Contato principal</h2>
          <div className="contact-grid">
            {client.main_contact_name && <span className="meta-chip">{client.main_contact_name}</span>}
            {client.main_contact_email && <span className="meta-chip">{client.main_contact_email}</span>}
            {client.main_contact_phone && <span className="meta-chip">{client.main_contact_phone}</span>}
          </div>
        </div>
      )}

      <div className="summary-cards">
        <div className="summary-card">
          <Briefcase size={20} />
          <div>
            <strong>{projects.length}</strong>
            <span>Projetos</span>
          </div>
        </div>
        <div className="summary-card">
          <CheckSquare size={20} />
          <div>
            <strong>{openTasks.length}</strong>
            <span>Tarefas abertas</span>
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

      <div className="panel">
        <div className="panel-heading">
          <h2>Projetos</h2>
          <span>{projects.length} {projects.length === 1 ? "projeto" : "projetos"}</span>
        </div>
        {projects.length === 0 ? (
          <p className="empty-state">Nenhum projeto vinculado a este cliente.</p>
        ) : (
          <div className="entity-list">
            {projects.map((project) => (
              <article
                className="entity-card entity-card-link"
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                onKeyDown={(e) => e.key === "Enter" && navigate(`/projects/${project.id}`)}
                role="button"
                tabIndex={0}
              >
                <div>
                  <strong>{project.name}</strong>
                  {project.due_date && (
                    <div className="entity-meta">
                      <span className="meta-chip">
                        Prazo: {new Date(project.due_date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}
                </div>
                <strong className={`status-pill ${getProjectStatusClass(project.status)}`}>
                  {project.status}
                </strong>
              </article>
            ))}
          </div>
        )}
      </div>

      {client.notes && (
        <div className="panel">
          <h2>Notas</h2>
          <p className="detail-notes">{client.notes}</p>
        </div>
      )}

      <div className="panel">
        <div className="panel-heading">
          <h2>Atividade recente</h2>
        </div>
        {activity.length === 0 ? (
          <p className="empty-state">Nenhuma atividade registrada para este cliente.</p>
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
