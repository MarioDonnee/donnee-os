import { useEffect, useState } from "react";
import { api } from "../services/api";

type Client = {
  id: string;
  name: string;
  segment?: string | null;
  status: string;
  main_contact_name?: string | null;
  main_contact_email?: string | null;
};

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchClients() {
    const response = await api.get("/clients");
    setClients(response.data);
  }

  async function createClient() {
    if (!name.trim()) return;

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
        setClients(clientsRes.data);
        setStatuses(statusesRes.data);
        setStatus(statusesRes.data[0] || "LEAD");
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Não foi possível carregar os clientes. Verifique se o backend está ativo.");
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

          <button disabled={isSaving || !name.trim()} onClick={createClient}>
            {isSaving ? "Criando..." : "Criar cliente"}
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Clientes cadastrados</h2>

        {isLoading ? (
          <p className="muted" aria-live="polite">Carregando clientes...</p>
        ) : clients.length === 0 ? (
          <p className="empty-state">Nenhum cliente cadastrado ainda.</p>
        ) : (
          clients.map((client) => (
            <div className="row" key={client.id}>
              <div>
                <strong>{client.name}</strong>
                <p className="row-detail">
                  {client.segment || "Sem segmento informado"}
                </p>
              </div>

              <strong className="status-pill">{client.status}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
