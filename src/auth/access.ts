import type { AuthStatus } from "./AuthContext";

export type AccessDecision =
  /** Still finding out: show a loading screen. */
  | "wait"
  /** Not signed in: go to the login page. */
  | "login"
  /** Signed in but without a household: create or join one first. */
  | "setup"
  /** The household couldn't be loaded (e.g. offline). */
  | "error"
  | "allow";

/** Who may see the app's pages. Kept pure so it is easy to test. */
export function decideAccess(
  status: AuthStatus,
  household: { isPending: boolean; isError: boolean; data: unknown },
): AccessDecision {
  switch (status) {
    case "demo":
      return "allow";
    case "loading":
      return "wait";
    case "signedOut":
      return "login";
    case "signedIn":
      if (household.isError) return "error";
      if (household.isPending) return "wait";
      return household.data ? "allow" : "setup";
  }
}
