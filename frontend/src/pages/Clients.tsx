import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { getCache, setCache } from "../services/cache";
import { getShortEntityId } from "../utils/format";

type Client = {
  id: string;
  name: string;
  segment?: string | null;
  status: string;
  main_contact_name?: string | null;
  main_contact_email?: string | null;
};

const clientsCacheKey = "clients:list";
const clientStatusesCacheKey = "metadata:client-statuses";

function getClientStatusClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes("active") || normalized.includes("ativo")) {
    return "status-done";
  }

  if (normalized.includes("paused") || normalized.includes("blocked") || normalized.includes("risk")) {
    return "status-blocked";
  }

  if (normalized.includes("closed") || normalized.includes("cancel")) {
    return "status-cancelled";
  }

  return "status-backlog";
}

export function Clients() {
  const navigate = useNavigate();
  const cachedClients = getCache<Client[]>(clientsCacheKey);
  const cachedClientStatuses = getCache<string[]>(clientStatusesCacheKey);
  const [clients, setClients] = useState<Client[]>(() => cachedClients ?? []);
  const [statuses, setStatuses] = useState<string[]>(() => cachedClientStatuses ?? []);
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [status, setStatus] = useState(() => cachedClientStatuses?.[0] ?? "");
  const [isLoading, setIsLoading] = useState(() => !cachedClients);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchClients() {
    const response = await api.get("/clients");
    setCache(clientsCacheKey, response.data);
    setClients(response.data);
  }

  async function createClient() {
    if (!name.trim() || !status) return;

    setError("");
    setIsSaving(true);

    try {
      await api.post("/clients", {
        name,
        segment: segment || null,
        status: status || statuses[0] || "LEAD",
      });

      setName("");
      setSegment("");
      await fetchClients();
    } catch {
      setError("Não foi possível criar o cliente.");
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      api.get("/clients"),
      api.get("/metadata/client-statuses"),
    ])
      .then(([clientsRes, statusesRes]) => {
        if (!isMounted) return;
        setCache(clientsCacheKey, clientsRes.data);
        setCache(clientStatusesCacheKey, statusesRes.data);
        setClients(clientsRes.data);
        setStatuses(statusesRes.data);
        setStatus((currentStatus) => currentStatus || statusesRes.data[0] || "LEAD");
        setError("");
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Não foi possível carregar os clientes. Verifique se o backend está ativo.");
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
        <h1>Clientes</h1>
        <p>Cadastro e acompanhamento dos clientes da operação.</p>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="panel panel-spaced">
        <h2>Novo cliente</h2>

        <div className="form-row">
          <label className="field">
            <span>Nome do cliente</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Acme Analytics"
            />
          </label>

          <label className="field">
            <span>Segmento</span>
            <input
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              placeholder="Ex.: Inteligência comercial"
            />
          </label>

          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statuses.map((clientStatus) => (
                <option key={clientStatus} value={clientStatus}>
                  {clientStatus}
                </option>
              ))}
            </select>
          </label>

          <button disabled={isSaving || !name.trim() || !status} onClick={createClient}>
            {isSaving ? "Criando..." : "Criar cliente"}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <h2>Clientes cadastrados</h2>
          <span>{isRefreshing ? "Atualizando..." : `${clients.length} registros`}</span>
        </div>

        {isLoading ? (
          <p className="muted" aria-live="polite">Carregando clientes...</p>
        ) : clients.length === 0 ? (
          <p className="empty-state">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div className="entity-list">
            {clients.map((client) => (
              <article className="entity-card" key={client.id}>
                <div>
                  <strong>{client.name}</strong>
                  <div className="entity-meta">
                    <span className="meta-chip">{client.segment || "Sem segmento informado"}</span>
                    {client.main_contact_email && (
                      <span className="meta-chip">{client.main_contact_email}</span>
                    )}
                  </div>
                </div>

                <strong className={`status-pill ${getClientStatusClass(client.status)}`}>
                  {client.status}
                </strong>
                <button className="ghost-action" type="button" onClick={() => navigate(`/clients/${getShortEntityId(client.id)}`)}>Ver</button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
