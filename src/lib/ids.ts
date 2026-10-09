import type { Id } from "./types";

export function newId(): Id {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for very old browsers or non-secure contexts.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
