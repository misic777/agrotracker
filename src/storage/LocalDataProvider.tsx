import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { newId } from "../lib/ids";
import type { AppData } from "../lib/types";
import { DataContext, type DataContextValue } from "./DataContext";
import { backupCorrupted, loadData, saveData } from "./localStore";
import {
  insertItem,
  prepareParcel,
  removeItem,
  removeParcel,
  removeSeason,
  updateItem,
  type CollectionKey,
  type Item,
} from "./operations";
import type { SaveError } from "./remoteStore";

/** Data kept in this browser's localStorage. Used by the demo. */
export function LocalDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    const result = loadData();
    if (result.status === "corrupted") backupCorrupted(result.raw);
    return result.data;
  });
  const [saveError, setSaveError] = useState<SaveError | null>(null);

  // Always-current copy of the data. Actions read from it so they never work
  // on a stale snapshot, and new ids are generated exactly once per action.
  const dataRef = useRef(data);

  /** Every change goes through here: update state, then persist it. */
  const commit = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
    try {
      saveData(next);
      setSaveError(null);
    } catch (error) {
      console.error("Saving data failed", error);
      setSaveError("storage");
    }
  }, []);

  /** Read only inside actions (event handlers), never while rendering. */
  const current = useCallback(() => dataRef.current, []);

  const value = useMemo<DataContextValue>(() => {
    const crud = <K extends "seasons" | "activities" | "costs" | "incomes">(
      key: K,
    ) => ({
      add: (draft: Omit<Item<K>, "id">) => {
        const item = { ...draft, id: newId() } as Item<K>;
        commit(insertItem(current(), key, item));
        return item;
      },
      update: (id: string, draft: Omit<Item<K>, "id">) => {
        commit(updateItem(current(), key, { ...draft, id } as Item<K>));
      },
      remove: (id: string) => {
        const data = current();
        commit(
          key === "seasons"
            ? removeSeason(data, id)
            : removeItem(
                data,
                key as Exclude<CollectionKey, "parcels" | "seasons">,
                id,
              ),
        );
      },
    });

    const saveParcel = (
      draft: Parameters<DataContextValue["parcels"]["add"]>[0],
      id?: string,
    ) => {
      const data = current();
      const result = prepareParcel(data, draft, id ?? newId(), !id);
      if (result.ok) {
        commit(
          id
            ? updateItem(data, "parcels", result.parcel)
            : insertItem(data, "parcels", result.parcel),
        );
      }
      return result;
    };

    return {
      data,
      mode: "local",
      saveError,
      dismissSaveError: () => setSaveError(null),
      parcels: {
        add: (draft) => saveParcel(draft),
        update: (id, draft) => saveParcel(draft, id),
        remove: (id) => commit(removeParcel(current(), id)),
      },
      seasons: crud("seasons"),
      activities: crud("activities"),
      costs: crud("costs"),
      incomes: crud("incomes"),
      replaceAll: async (next) => commit(next),
    };
  }, [data, saveError, commit, current]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
