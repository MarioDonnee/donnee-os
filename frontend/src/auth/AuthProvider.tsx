import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { api } from "../services/api";
import { supabase } from "../services/supabase";
import { AuthContext } from "./authContext";
import type { AuthContextValue, CurrentUser } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadCurrentUser(nextSession: Session | null) {
    setSession(nextSession);
    setAuthError("");

    if (!nextSession) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me", { timeout: 10000 });
      setCurrentUser(response.data);
    } catch (error: unknown) {
      setCurrentUser(null);
      const status = typeof error === "object" && error && "response" in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;

      if (status === 403) {
        setAuthError("Este Google autenticou, mas o email não está autorizado no Donnée OS.");
      } else if (status === 401) {
        setAuthError("Sessão inválida ou expirada. Entre novamente.");
      } else {
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

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      authError,
      session,
      isLoading,
      clearAuthError: () => setAuthError(""),
      signInWithGoogle: async () => {
        setAuthError("");
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
        setIsLoading(false);
      },
    }),
    [authError, currentUser, isLoading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
