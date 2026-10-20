/**
 * Pure "what does the data look like after this change" functions.
 *
 * Both the browser storage (demo) and Supabase use them, so the screen
 * shows a change the same way no matter where it is saved. Each function
 * returns a new AppData and never modifies the old one.
 */
import { findDuplicateParcel } from "../lib/parcels";
import type { AppData, Draft, Id, Parcel } from "../lib/types";
import type { ParcelSaveResult } from "./DataContext";

export type CollectionKey = keyof Omit<AppData, "version">;
export type Item<K extends CollectionKey> = AppData[K][number];

export function insertItem<K extends CollectionKey>(
  data: AppData,
  key: K,
  item: Item<K>,
): AppData {
  return { ...data, [key]: [...data[key], item] };
}

export function updateItem<K extends CollectionKey>(
  data: AppData,
  key: K,
  item: Item<K>,
): AppData {
  const list = data[key] as Item<K>[];
  return { ...data, [key]: list.map((x) => (x.id === item.id ? item : x)) };
}

/** Removes a parcel with its seasons and their activities. */
export function removeParcel(data: AppData, id: Id): AppData {
  const seasonIds = new Set(
    data.seasons.filter((s) => s.parcelId === id).map((s) => s.id),
  );
  return {
    ...data,
    parcels: data.parcels.filter((p) => p.id !== id),
    seasons: data.seasons.filter((s) => !seasonIds.has(s.id)),
    activities: data.activities.filter((a) => !seasonIds.has(a.seasonId)),
  };
}

/** Removes a season with its activities. */
export function removeSeason(data: AppData, id: Id): AppData {
  return {
    ...data,
    seasons: data.seasons.filter((s) => s.id !== id),
    activities: data.activities.filter((a) => a.seasonId !== id),
  };
}

/** Removes a cost, income or activity. */
export function removeItem(
  data: AppData,
  key: "activities" | "costs" | "incomes",
  id: Id,
): AppData {
  const list = data[key] as { id: Id }[];
  return { ...data, [key]: list.filter((x) => x.id !== id) };
}

/**
 * Checks the "number + municipality is unique" rule before saving a parcel.
 * `id` is set when editing an existing parcel.
 */
export function prepareParcel(
  data: AppData,
  draft: Draft<Parcel>,
  id: Id,
  isNew: boolean,
): ParcelSaveResult {
  const existing = findDuplicateParcel(
    data.parcels,
    draft.number,
    draft.municipality,
    isNew ? undefined : id,
  );
  if (existing) return { ok: false, reason: "duplicate", existing };
  return { ok: true, parcel: { ...draft, id } };
}
