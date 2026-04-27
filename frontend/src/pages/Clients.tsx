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
  const [name, setName] = useState("");
  const [segment, setSegment] = useState("");

  async function fetchClients() {
    const response = await api.get("/clients");
    setClients(response.data);
  }

  async function createClient() {
    if (!name.trim()) return;

    await api.post("/clients", {
      name,
      segment: segment || null,
      status: "LEAD",
    });

    setName("");
    setSegment("");
    fetchClients();
  }

  useEffect(() => {
    fetchClients();
  }, []);

  return (
    <section className="content">
      <header className="page-header">
        <p className="eyebrow">Donnée OS</p>
        <h1>Clientes</h1>
        <p>Cadastro e acompanhamento dos clientes da operação.</p>
      </header>

      <div className="panel" style={{ marginBottom: 24 }}>
        <h2>Novo cliente</h2>

        <div className="form-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome do cliente"
          />

          <input
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            placeholder="Segmento"
          />

          <button onClick={createClient}>Criar cliente</button>
        </div>
      </div>

      <div className="panel">
        <h2>Clientes cadastrados</h2>

        {clients.length === 0 ? (
          <p>Nenhum cliente cadastrado ainda.</p>
        ) : (
          clients.map((client) => (
            <div className="row" key={client.id}>
              <div>
                <strong>{client.name}</strong>
                <p style={{ margin: "6px 0 0", color: "#a99cc5" }}>
                  {client.segment || "Sem segmento informado"}
                </p>
              </div>

              <strong>{client.status}</strong>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
