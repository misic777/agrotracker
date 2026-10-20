/**
 * Data kept in the browser's localStorage.
 *
 * Two keys are used: the demo's sample farm, and the data from before
 * sign-in existed (offered for upload to the household after signing in).
 */
import type { AppData } from "../lib/types";

/** Data entered before accounts existed (phases 1–3). */
export const LEGACY_DATA_KEY = "agrotracker.data";
/** The demo's sample farm and the visitor's changes to it. */
export const DEMO_DATA_KEY = "agrotracker.demoData";

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

export function loadData(key: string = LEGACY_DATA_KEY): LoadResult {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
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

export function saveData(data: AppData, key: string = LEGACY_DATA_KEY): void {
  localStorage.setItem(key, JSON.stringify(data));
}

/** Forgets the data stored under a key (e.g. when leaving the demo). */
export function clearData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing stored, or storage blocked: nothing to clear.
  }
}

/** Copies an unreadable stored value to a backup key before it is overwritten. */
export function backupCorrupted(
  raw: string,
  key: string = LEGACY_DATA_KEY,
): void {
  try {
    localStorage.setItem(`${key}.backup-${Date.now()}`, raw);
  } catch {
    // Nothing more we can do.
  }
}

/**
 * Reads an exported backup. Returns null when the file is not a valid
 * AgroTracker export, so a wrong file can never replace the data.
 */
export function parseBackup(text: string): AppData | null {
  try {
    const value: unknown = JSON.parse(text);
    if (!isAppData(value)) return null;
    const lists = [
      value.parcels,
      value.seasons,
      value.activities,
      value.costs,
      value.incomes,
    ] as unknown[][];
    const allHaveIds = lists.every((list) =>
      list.every(
        (item) =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as { id?: unknown }).id === "string",
      ),
    );
    return allHaveIds ? value : null;
  } catch {
    return null;
  }
}
