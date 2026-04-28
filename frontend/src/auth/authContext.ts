import { createContext } from "react";
import type { Session } from "@supabase/supabase-js";

export type CurrentUser = {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export type AuthAccessStatus =
  | "checking"
  | "authenticated"
  | "unauthenticated"
  | "pending"
  | "inactive"
  | "unauthorized"
  | "invalid"
  | "backend_unavailable";

export type AuthContextValue = {
  currentUser: CurrentUser | null;
  authError: string;
  accessStatus: AuthAccessStatus;
  session: Session | null;
  isLoading: boolean;
  clearAuthError: () => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
