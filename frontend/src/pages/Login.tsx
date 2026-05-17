import { Navigate } from "react-router-dom";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { useAuth } from "../auth/useAuth";

export function Login() {
  const { authError, currentUser, isLoading, session, signInWithGoogle, signOut } = useAuth();

  if (currentUser) {
    return <Navigate replace to="/" />;
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand login-brand" aria-label="Donnée OS">
          <span className="brand-mark">d</span>
          <span>donnée</span>
        </div>

        <div>
          <p className="eyebrow">Operational Access</p>
          <h1>Donnée OS</h1>
          <p>
            Acesso restrito para usuários autorizados pela operação Donnée.
          </p>
        </div>

        {authError && (
          <div className="access-denied" role="alert">
            <AlertTriangle size={18} />
            <div>
              <strong>Acesso negado</strong>
              <p>{authError}</p>
            </div>
          </div>
        )}

        <button className="login-button" disabled={isLoading} onClick={signInWithGoogle}>
          <ShieldCheck size={18} />
          {isLoading ? "Validando..." : authError ? "Entrar com outro Google" : "Entrar com Google"}
        </button>

        {session && !currentUser && authError && (
          <button className="ghost-action login-secondary-action" type="button" onClick={signOut}>
            Encerrar sessão atual
          </button>
        )}
      </section>
    </main>
  );
}
