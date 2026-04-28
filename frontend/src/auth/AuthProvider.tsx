import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { api } from "../services/api";
import { supabase } from "../services/supabase";
import { AuthContext } from "./authContext";
import type { AuthAccessStatus, AuthContextValue, CurrentUser } from "./authContext";

function getErrorDetail(error: unknown) {
  if (typeof error !== "object" || !error || !("response" in error)) {
    return { status: undefined, code: undefined };
  }

  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } }).response;
  const detail = response?.data?.detail;

  if (typeof detail === "object" && detail && "code" in detail) {
    return {
      status: response?.status,
      code: (detail as { code?: string }).code,
    };
  }

  return { status: response?.status, code: undefined };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authError, setAuthError] = useState("");
  const [accessStatus, setAccessStatus] = useState<AuthAccessStatus>("checking");
  const [isLoading, setIsLoading] = useState(true);

  async function loadCurrentUser(nextSession: Session | null) {
    setSession(nextSession);
    setAuthError("");

    if (!nextSession) {
      setCurrentUser(null);
      setAccessStatus("unauthenticated");
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me", { timeout: 10000 });
      setCurrentUser(response.data);
      setAccessStatus("authenticated");
    } catch (error: unknown) {
      setCurrentUser(null);
      const { code, status } = getErrorDetail(error);

      if (code === "USER_PENDING") {
        setAccessStatus("pending");
        setAuthError("Seu acesso ainda está pendente de aprovação.");
      } else if (code === "USER_INACTIVE") {
        setAccessStatus("inactive");
        setAuthError("Seu acesso está inativo. Fale com um administrador.");
      } else if (status === 403) {
        setAccessStatus("unauthorized");
        setAuthError("Este Google autenticou, mas o email não está autorizado no Donnée OS.");
      } else if (status === 401) {
        setAccessStatus("invalid");
        setAuthError("Sessão inválida ou expirada. Entre novamente.");
      } else {
        setAccessStatus("backend_unavailable");
        setAuthError("Não foi possível validar sua sessão. Verifique se o backend está rodando.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      loadCurrentUser(data.session);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setIsLoading(true);
      loadCurrentUser(nextSession);
    });

    function handleAuthError(event: Event) {
      const detail = (event as CustomEvent<{ status?: number; detail?: unknown }>).detail;
      const errorDetail = detail?.detail;
      const code = typeof errorDetail === "object" && errorDetail && "code" in errorDetail
        ? (errorDetail as { code?: string }).code
        : undefined;

      setCurrentUser(null);

      if (code === "USER_PENDING") {
        setAccessStatus("pending");
        setAuthError("Seu acesso ainda está pendente de aprovação.");
      } else if (code === "USER_INACTIVE") {
        setAccessStatus("inactive");
        setAuthError("Seu acesso está inativo. Fale com um administrador.");
      } else if (detail?.status === 403) {
        setAccessStatus("unauthorized");
        setAuthError("Você não tem permissão para executar esta ação.");
      } else if (detail?.status === 401) {
        setAccessStatus("invalid");
        setAuthError("Sessão inválida ou expirada. Entre novamente.");
      }
    }

    window.addEventListener("donnee:auth-error", handleAuthError);

    return () => {
      isMounted = false;
      window.removeEventListener("donnee:auth-error", handleAuthError);
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      authError,
      accessStatus,
      session,
      isLoading,
      clearAuthError: () => {
        setAuthError("");
        setAccessStatus(session ? "checking" : "unauthenticated");
      },
      signInWithGoogle: async () => {
        setAuthError("");
        setAccessStatus("checking");
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
          },
        });
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setAuthError("");
        setCurrentUser(null);
        setSession(null);
        setAccessStatus("unauthenticated");
        setIsLoading(false);
      },
    }),
    [accessStatus, authError, currentUser, isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
