import { useEffect, useState } from "react";
import { api } from "../services/api";
import { getCache, setCache } from "../services/cache";

type Client = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  client_id: string;
  name: string;
  description?: string | null;
  status: string;
  priority: string;
  due_date?: string | null;
  health_score?: number | null;
};

const clientsCacheKey = "clients:list";
const projectsCacheKey = "projects:list";
const projectStatusesCacheKey = "metadata:project-statuses";

function getProjectStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("done") || normalized.includes("delivered") || normalized.includes("complete")) {
    return "status-done";
  }

  if (normalized.includes("blocked") || normalized.includes("risk") || normalized.includes("paused")) {
    return "status-blocked";
  }

  if (normalized.includes("review") || normalized.includes("validation")) {
    return "status-review";
  }

  if (normalized.includes("progress") || normalized.includes("active") || normalized.includes("execution")) {
    return "status-progress";
  }

  if (normalized.includes("cancel") || normalized.includes("closed")) {
    return "status-cancelled";
  }

  return "status-backlog";
}

function getPriorityClass(priority: string) {
  const normalized = priority.toLowerCase();

  if (normalized.includes("urgent")) return "priority-urgent";
  if (normalized.includes("high")) return "priority-high";
  if (normalized.includes("medium")) return "priority-medium";
  if (normalized.includes("low")) return "priority-low";

  return "status-backlog";
}

function getHealthClass(score: number) {
  if (score >= 80) return "health-good";
  if (score >= 50) return "health-warning";
  return "health-risk";
}

export function Projects() {
  const cachedClients = getCache<Client[]>(clientsCacheKey);
  const cachedProjects = getCache<Project[]>(projectsCacheKey);
  const cachedProjectStatuses = getCache<string[]>(projectStatusesCacheKey);
  const [clients, setClients] = useState<Client[]>(() => cachedClients ?? []);
  const [projects, setProjects] = useState<Project[]>(() => cachedProjects ?? []);
  const [statuses, setStatuses] = useState<string[]>(() => cachedProjectStatuses ?? []);
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(() => cachedProjectStatuses?.[0] ?? "");
  const [isLoading, setIsLoading] = useState(() => !cachedProjects);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchData() {
    setError("");

    try {
      const [clientsRes, projectsRes, statusesRes] = await Promise.all([
        api.get("/clients"),
        api.get("/projects"),
        api.get("/metadata/project-statuses"),
      ]);

      setCache(clientsCacheKey, clientsRes.data);
      setCache(projectsCacheKey, projectsRes.data);
      setCache(projectStatusesCacheKey, statusesRes.data);
      setClients(clientsRes.data);
      setProjects(projectsRes.data);
      setStatuses(statusesRes.data);
      setStatus((currentStatus) => currentStatus || statusesRes.data[0] || "DISCOVERY");
    } catch {
      setError("Não foi possível carregar os projetos. Verifique se o backend está ativo.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  async function createProject() {
    if (!clientId || !name.trim() || !status) return;

    setError("");
    setIsSaving(true);

    try {
      await api.post("/projects", {
        client_id: clientId,
        name,
        description: description || null,
        status: status || statuses[0] || "DISCOVERY",
        priority: "MEDIUM",
        health_score: 80,
      });

      setClientId("");
      setName("");
      setDescription("");
      await fetchData();
    } catch {
      setError("Não foi possível criar o projeto.");
    } finally {
      setIsSaving(false);
    }
  }

  function getClientName(clientId: string) {
    return clients.find((client) => client.id === clientId)?.name || "Cliente não encontrado";
  }

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.get("/clients"),
      api.get("/projects"),
      api.get("/metadata/project-statuses"),
    ])
      .then(([clientsRes, projectsRes, statusesRes]) => {
        if (!isMounted) return;
        setCache(clientsCacheKey, clientsRes.data);
        setCache(projectsCacheKey, projectsRes.data);
        setCache(projectStatusesCacheKey, statusesRes.data);
        setClients(clientsRes.data);
        setProjects(projectsRes.data);
        setStatuses(statusesRes.data);
        setStatus((currentStatus) => currentStatus || statusesRes.data[0] || "DISCOVERY");
        setError("");
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Não foi possível carregar os projetos. Verifique se o backend está ativo.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
        setIsRefreshing(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="content">
      <header className="page-header">
        <p className="eyebrow">Donnée OS</p>
        <h1>Projetos</h1>
        <p>Gestão dos projetos vinculados aos clientes da Donnée.</p>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="panel panel-spaced">
        <h2>Novo projeto</h2>

        <div className="form-row">
          <label className="field">
            <span>Cliente</span>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Selecione um cliente</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statuses.map((projectStatus) => (
                <option key={projectStatus} value={projectStatus}>
                  {projectStatus}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Nome do projeto</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Diagnóstico operacional"
            />
          </label>

          <button disabled={isSaving || !clientId || !name.trim() || !status} onClick={createProject}>
            {isSaving ? "Criando..." : "Criar projeto"}
          </button>
        </div>

        <div className="field-full">
          <label className="field">
            <span>Descrição curta</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivo, escopo ou contexto em uma linha"
            />
          </label>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Projetos cadastrados</h2>
          <span>{isRefreshing ? "Atualizando..." : `${projects.length} registros`}</span>
        </div>

        {isLoading ? (
          <p className="muted" aria-live="polite">Carregando projetos...</p>
        ) : projects.length === 0 ? (
          <p className="empty-state">Nenhum projeto cadastrado ainda.</p>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <article className="entity-card project-card" key={project.id}>
                <div className="project-card-header">
                  <div>
                    <strong>{project.name}</strong>
                    <p className="row-detail">{getClientName(project.client_id)}</p>
                  </div>

                  <strong className={`status-pill ${getProjectStatusClass(project.status)}`}>
                    {project.status}
                  </strong>
                </div>

                <div className="entity-meta">
                  <span className={`status-pill ${getPriorityClass(project.priority)}`}>
                    {project.priority}
                  </span>
                  {project.description && <span className="meta-chip">{project.description}</span>}
                </div>

                <div className="health-meter" aria-label={`Health score ${project.health_score ?? 0}`}>
                  <div className="health-meter-label">
                    <span>Health score</span>
                    <strong>{project.health_score ?? 0}%</strong>
                  </div>
                  <div className="health-track">
                    <span
                      className={`health-fill ${getHealthClass(project.health_score ?? 0)}`}
                      style={{ width: `${Math.max(0, Math.min(project.health_score ?? 0, 100))}%` }}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
