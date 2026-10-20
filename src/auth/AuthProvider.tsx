import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clearData, DEMO_DATA_KEY } from "../storage/localStore";
import { supabase } from "../storage/supabaseClient";
import {
  AuthContext,
  type AppUser,
  type AuthContextValue,
} from "./AuthContext";

const DEMO_KEY = "agrotracker.demo";

function readDemoFlag(): boolean {
  try {
    return localStorage.getItem(DEMO_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDemoFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(DEMO_KEY, "1");
    else localStorage.removeItem(DEMO_KEY);
  } catch {
    // Not remembered across reloads, but the demo still works.
  }
}

/**
 * When Google sign-in fails or is cancelled, Supabase sends the user back
 * with "?error=...&error_description=..." in the address. Read it once at
 * startup and remove it, so a reload doesn't show the error again.
 */
function takeErrorFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const message = params.get("error_description") ?? params.get("error");
  if (message) {
    const clean = window.location.pathname + window.location.hash;
    window.history.replaceState(window.history.state, "", clean);
  }
  return message;
}

const errorFromUrl = takeErrorFromUrl();

function toAppUser(session: Session | null): AppUser | null {
  if (!session) return null;
  const meta = session.user.user_metadata as Record<string, unknown>;
  const name = meta.full_name ?? meta.name;
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: typeof name === "string" ? name : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  // Without Supabase there is no session to wait for.
  const [checking, setChecking] = useState(supabase !== null);
  const [demo, setDemo] = useState(readDemoFlag);
  const [signInError, setSignInError] = useState(errorFromUrl);

  useEffect(() => {
    if (!supabase) return;
    // Fires once right away (saved session or none), then on every sign-in,
    // sign-out and token refresh.
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setChecking(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) return;
    setSignInError(null);
    writeDemoFlag(false);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Back to the app's own address: localhost in development,
        // GitHub Pages in production. Both are allowed in Supabase.
        redirectTo: window.location.origin + import.meta.env.BASE_URL,
        // Lets family members who share a computer pick their own account.
        queryParams: { prompt: "select_account" },
      },
    });
    // On success the browser is already on its way to Google.
    if (error) setSignInError(error.message);
  }, []);

  const startDemo = useCallback(() => {
    // Always a fresh sample farm, in the language selected right now.
    clearData(DEMO_DATA_KEY);
    writeDemoFlag(true);
    setDemo(true);
  }, []);

  const signOut = useCallback(async () => {
    if (demo) clearData(DEMO_DATA_KEY);
    writeDemoFlag(false);
    setDemo(false);
    if (supabase && session) await supabase.auth.signOut();
    // Forget everything loaded for this account.
    queryClient.clear();
  }, [demo, queryClient, session]);

  const value = useMemo<AuthContextValue>(() => {
    const user = toAppUser(session);
    const status = user
      ? "signedIn"
      : demo
        ? "demo"
        : checking
          ? "loading"
          : "signedOut";
    return {
      status,
      user,
      canSignIn: supabase !== null,
      signInError,
      signInWithGoogle,
      startDemo,
      signOut,
    };
  }, [
    session,
    demo,
    checking,
    signInError,
    signInWithGoogle,
    startDemo,
    signOut,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
