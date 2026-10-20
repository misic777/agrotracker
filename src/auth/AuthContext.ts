import { createContext, useContext } from "react";

/**
 * - loading: checking for a saved session (only at startup)
 * - signedOut: no session, the login page is shown
 * - signedIn: signed in with Google; data belongs to a household
 * - demo: trying the app without an account; data stays in this browser
 */
export type AuthStatus = "loading" | "signedOut" | "signedIn" | "demo";

export interface AppUser {
  id: string;
  email: string | null;
  /** Full name from the Google account. */
  name: string | null;
}

export interface AuthContextValue {
  status: AuthStatus;
  user: AppUser | null;
  /** False when the app was built without Supabase keys: only demo works. */
  canSignIn: boolean;
  /** Why the last Google sign-in failed (e.g. it was cancelled). */
  signInError: string | null;
  signInWithGoogle: () => Promise<void>;
  startDemo: () => void;
  /** Signs out, or leaves the demo. */
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}
