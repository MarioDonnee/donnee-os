import { useEffect, useState } from "react";
import { api } from "../services/api";

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

export function Projects() {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchData() {
    setError("");
    setIsLoading(true);

    try {
      const [clientsRes, projectsRes, statusesRes] = await Promise.all([
        api.get("/clients"),
        api.get("/projects"),
        api.get("/metadata/project-statuses"),
      ]);

      setClients(clientsRes.data);
      setProjects(projectsRes.data);
      setStatuses(statusesRes.data);
      setStatus((currentStatus) => currentStatus || statusesRes.data[0] || "DISCOVERY");
    } catch {
      setError("Não foi possível carregar os projetos. Verifique se o backend está ativo.");
    } finally {
      setIsLoading(false);
    }
  }

  async function createProject() {
    if (!clientId || !name.trim()) return;

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
        setClients(clientsRes.data);
        setProjects(projectsRes.data);
        setStatuses(statusesRes.data);
        setStatus(statusesRes.data[0] || "DISCOVERY");
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Não foi possível carregar os projetos. Verifique se o backend está ativo.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
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

          <button disabled={isSaving || !clientId || !name.trim()} onClick={createProject}>
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
        <h2>Projetos cadastrados</h2>

        {isLoading ? (
          <p className="muted" aria-live="polite">Carregando projetos...</p>
        ) : projects.length === 0 ? (
          <p className="empty-state">Nenhum projeto cadastrado ainda.</p>
        ) : (
          projects.map((project) => (
            <div className="row" key={project.id}>
              <div>
                <strong>{project.name}</strong>
                <p className="row-detail">
                  {getClientName(project.client_id)}
                </p>
              </div>

              <div className="row-meta">
                <strong className="status-pill">{project.status}</strong>
                <p className="row-detail">
                  Prioridade: {project.priority}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
