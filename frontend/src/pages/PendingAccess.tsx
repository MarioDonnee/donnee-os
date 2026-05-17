import { Clock } from "lucide-react";
import { useAuth } from "../auth/useAuth";

export function PendingAccess() {
  const { signOut } = useAuth();

  return (
    <main className="login-shell">
      <section className="login-panel access-state-panel">
        <Clock size={28} />
        <div>
          <p className="eyebrow">Access Review</p>
          <h1>Acesso pendente</h1>
          <p>
            Seu Google foi autenticado, mas seu perfil ainda não foi aprovado para usar o Donnée OS.
          </p>
        </div>
        <button className="ghost-action login-secondary-action" type="button" onClick={signOut}>
          Sair e usar outra conta
        </button>
      </section>
    </main>
  );
}
