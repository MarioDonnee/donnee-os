import { useEffect, useMemo, useState } from "react";
import { Shield, UserCheck, UserX, Users } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { api } from "../services/api";

type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at?: string | null;
};

const ROLES = ["ADMIN", "MANAGER", "ANALYST", "VIEWER"];
const STATUSES = ["ACTIVE", "INACTIVE", "PENDING"];

function getRoleClass(role: string) {
  if (role === "ADMIN") return "priority-urgent";
  if (role === "MANAGER") return "priority-high";
  if (role === "ANALYST") return "priority-medium";
  return "priority-low";
}

function getStatusClass(status: string) {
  if (status === "ACTIVE") return "status-done";
  if (status === "INACTIVE") return "status-cancelled";
  return "status-review";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Team() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "ADMIN";

  const [users, setUsers] = useState<TeamUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingCell, setEditingCell] = useState<{ userId: string; field: "role" | "status" } | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.get("/users")
      .then((res) => { if (isMounted) setUsers(res.data); })
      .catch(() => { if (isMounted) setError("Não foi possível carregar os usuários."); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  async function patchUser(userId: string, field: "role" | "status", value: string) {
    setEditingCell(null);
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, [field]: value } : u));
    try {
      await api.patch(`/users/${userId}`, { [field]: value });
    } catch {
      const res = await api.get("/users");
      setUsers(res.data);
      setError("Não foi possível salvar a alteração.");
    }
  }

  const active = useMemo(() => users.filter((u) => u.status === "ACTIVE").length, [users]);
  const pending = useMemo(() => users.filter((u) => u.status === "PENDING").length, [users]);
  const inactive = useMemo(() => users.filter((u) => u.status === "INACTIVE").length, [users]);

  return (
    <section className="content">
      <header className="page-header">
        <p className="eyebrow">Donnée OS</p>
        <h1>Equipe</h1>
        <p>Membros da plataforma, funções e status de acesso.</p>
      </header>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="summary-cards">
        <div className="summary-card">
          <Users size={20} />
          <div>
            <strong>{users.length}</strong>
            <span>Total de membros</span>
          </div>
        </div>
        <div className="summary-card">
          <UserCheck size={20} />
          <div>
            <strong>{active}</strong>
            <span>Ativos</span>
          </div>
        </div>
        <div className={`summary-card ${pending > 0 ? "summary-card-risk" : ""}`}>
          <Shield size={20} />
          <div>
            <strong>{pending}</strong>
            <span>Aguardando acesso</span>
          </div>
        </div>
        <div className="summary-card">
          <UserX size={20} />
          <div>
            <strong>{inactive}</strong>
            <span>Inativos</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="muted" aria-live="polite">Carregando equipe...</p>
      ) : users.length === 0 ? (
        <div className="panel">
          <p className="empty-state">Nenhum usuário encontrado.</p>
        </div>
      ) : (
        <div className="panel">
          <div className="table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Membro</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Status</th>
                  <th>Desde</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isEditingRole = editingCell?.userId === user.id && editingCell.field === "role";
                  const isEditingStatus = editingCell?.userId === user.id && editingCell.field === "status";
                  const isSelf = currentUser?.id === user.id;

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="team-member-cell">
                          <span className="user-avatar user-avatar-sm">{getInitials(user.name)}</span>
                          <strong>{user.name}</strong>
                          {isSelf && <span className="meta-chip">você</span>}
                        </div>
                      </td>
                      <td className="td-secondary">{user.email}</td>
                      <td className="td-pill">
                        {isEditingRole && isAdmin && !isSelf ? (
                          <select
                            autoFocus
                            className="inline-select"
                            value={user.role}
                            onChange={(e) => patchUser(user.id, "role", e.target.value)}
                            onBlur={() => setEditingCell(null)}
                          >
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                          </select>
                        ) : (
                          <button
                            type="button"
                            className={`status-pill table-pill-btn ${getRoleClass(user.role)}`}
                            title={isAdmin && !isSelf ? "Clique para alterar função" : user.role}
                            onClick={() => isAdmin && !isSelf && setEditingCell({ userId: user.id, field: "role" })}
                          >
                            {user.role}
                          </button>
                        )}
                      </td>
                      <td className="td-pill">
                        {isEditingStatus && isAdmin && !isSelf ? (
                          <select
                            autoFocus
                            className="inline-select"
                            value={user.status}
                            onChange={(e) => patchUser(user.id, "status", e.target.value)}
                            onBlur={() => setEditingCell(null)}
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <button
                            type="button"
                            className={`status-pill table-pill-btn ${getStatusClass(user.status)}`}
                            title={isAdmin && !isSelf ? "Clique para alterar status" : user.status}
                            onClick={() => isAdmin && !isSelf && setEditingCell({ userId: user.id, field: "status" })}
                          >
                            {user.status}
                          </button>
                        )}
                      </td>
                      <td className="td-secondary">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
