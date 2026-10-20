import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * The single Supabase client for the whole app.
 *
 * It is null when the keys are missing (a fresh clone without .env.local),
 * so the demo mode keeps working without a backend.
 *
 * The publishable key is meant to be public: what protects the data are the
 * Row Level Security rules in the database, not this key.
 *
 * `Database` comes from `npm run db:types`, so table names, columns and
 * function arguments are all type-checked.
 */
export const supabase =
  url && publishableKey
    ? createClient<Database>(url, publishableKey, {
        auth: {
          // Google sends the user back with "?code=..." in the query string,
          // which doesn't clash with the "#/..." routes of HashRouter.
          flowType: "pkce",
          detectSessionInUrl: true,
          persistSession: true,
        },
      })
    : null;

/** The client, for code that only runs when signed in. */
export function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured (.env.local)");
  return supabase;
}
