import { createContext, useContext } from "react";
import type {
  Activity,
  AppData,
  Cost,
  Draft,
  Id,
  Income,
  Parcel,
  Season,
} from "../lib/types";
import type { SaveError } from "./remoteStore";

/** Result of saving a parcel: blocked when number + municipality already exist. */
export type ParcelSaveResult =
  | { ok: true; parcel: Parcel }
  | { ok: false; reason: "duplicate"; existing: Parcel };

/** Create, update and delete operations for one kind of record. */
export interface Crud<T extends { id: Id }> {
  add: (draft: Draft<T>) => T;
  update: (id: Id, draft: Draft<T>) => void;
  remove: (id: Id) => void;
}

export interface DataContextValue {
  data: AppData;
  /** Where the data lives: this browser (demo) or the household's database. */
  mode: "local" | "online";
  /** Why the last save failed, until the next successful one. */
  saveError: SaveError | null;
  dismissSaveError: () => void;
  parcels: {
    add: (draft: Draft<Parcel>) => ParcelSaveResult;
    update: (id: Id, draft: Draft<Parcel>) => ParcelSaveResult;
    /** Also removes the parcel's seasons and their activities. */
    remove: (id: Id) => void;
  };
  /** Removing a season also removes its activities. */
  seasons: Crud<Season>;
  activities: Crud<Activity>;
  costs: Crud<Cost>;
  incomes: Crud<Income>;
  /**
   * Replaces all data, e.g. when importing a backup. Online it is one
   * database transaction; the promise rejects if it failed.
   */
  replaceAll: (data: AppData) => Promise<void>;
}

export const DataContext = createContext<DataContextValue | null>(null);

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>.");
  return ctx;
}
