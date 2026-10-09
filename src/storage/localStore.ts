/**
 * The only place that knows where data lives.
 *
 * Phases 1–3 keep everything in the browser's localStorage. In phase 4 this
 * module is replaced by a Supabase version with the same functions, and no
 * component has to change.
 */
import type { AppData } from "../lib/types";

const STORAGE_KEY = "agrotracker.data";

export function emptyData(): AppData {
  return {
    version: 1,
    parcels: [],
    seasons: [],
    activities: [],
    costs: [],
    incomes: [],
  };
}

/** Light shape check so a corrupted or foreign value can't crash the app. */
function isAppData(value: unknown): value is AppData {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    Array.isArray(v.parcels) &&
    Array.isArray(v.seasons) &&
    Array.isArray(v.activities) &&
    Array.isArray(v.costs) &&
    Array.isArray(v.incomes)
  );
}

export type LoadResult =
  | { status: "ok"; data: AppData }
  | { status: "empty"; data: AppData }
  | { status: "corrupted"; data: AppData; raw: string };

export function loadData(): LoadResult {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return { status: "empty", data: emptyData() };
  }
  if (raw === null) return { status: "empty", data: emptyData() };

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isAppData(parsed)) return { status: "ok", data: parsed };
  } catch {
    // fall through
  }
  // Keep the unreadable value instead of overwriting it, so it can be recovered.
  return { status: "corrupted", data: emptyData(), raw };
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Copies an unreadable stored value to a backup key before it is overwritten. */
export function backupCorrupted(raw: string): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}.backup-${Date.now()}`, raw);
  } catch {
    // Nothing more we can do.
  }
}
