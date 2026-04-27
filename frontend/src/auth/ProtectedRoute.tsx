import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

export function ProtectedRoute() {
  const { authError, currentUser, isLoading, session } = useAuth();

  if (isLoading) {
    return <main className="auth-loading">Validando sessão...</main>;
  }

  if (authError) {
    return <Navigate replace to="/login" />;
  }

  if (!session || !currentUser) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}
