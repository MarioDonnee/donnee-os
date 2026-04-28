import { Ban } from "lucide-react";
import { useAuth } from "../auth/useAuth";

export function InactiveAccess() {
  const { signOut } = useAuth();

  return (
    <main className="login-shell">
      <section className="login-panel access-state-panel">
        <Ban size={28} />
        <div>
          <p className="eyebrow">Access Disabled</p>
          <h1>Acesso inativo</h1>
          <p>
            Este perfil existe no Donnée OS, mas está inativo. Fale com um administrador para reativar o acesso.
          </p>
        </div>
        <button className="ghost-action login-secondary-action" type="button" onClick={signOut}>
          Sair e usar outra conta
        </button>
      </section>
    </main>
  );
}
