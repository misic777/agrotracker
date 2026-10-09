import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { newId } from "../lib/ids";
import { findDuplicateParcel } from "../lib/parcels";
import type { AppData, Draft, Id } from "../lib/types";
import {
  DataContext,
  type Crud,
  type DataContextValue,
  type ParcelSaveResult,
} from "./DataContext";
import { backupCorrupted, loadData, saveData } from "./localStore";

type CollectionKey = "seasons" | "activities" | "costs" | "incomes";
type Item<K extends CollectionKey> = AppData[K][number];

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    const result = loadData();
    if (result.status === "corrupted") backupCorrupted(result.raw);
    return result.data;
  });
  const [saveFailed, setSaveFailed] = useState(false);

  // Always-current copy of the data. Actions read from it so they never work
  // on a stale snapshot, and new ids are generated exactly once per action.
  const dataRef = useRef(data);

  /** Every change goes through here: update state, then persist it. */
  const commit = useCallback((next: AppData) => {
    dataRef.current = next;
    setData(next);
    try {
      saveData(next);
      setSaveFailed(false);
    } catch (error) {
      console.error("Saving data failed", error);
      setSaveFailed(true);
    }
  }, []);

  /** Generic create / update / delete for a simple collection. */
  const crudFor = useCallback(
    <K extends CollectionKey>(
      key: K,
      onRemove?: (current: AppData, id: Id) => AppData,
    ): Crud<Item<K>> => ({
      add: (draft) => {
        const item = { ...draft, id: newId() } as Item<K>;
        const current = dataRef.current;
        commit({ ...current, [key]: [...current[key], item] });
        return item;
      },
      update: (id, draft) => {
        const current = dataRef.current;
        const list = current[key] as Item<K>[];
        commit({
          ...current,
          [key]: list.map((item) => (item.id === id ? { ...draft, id } : item)),
        });
      },
      remove: (id) => {
        let current = dataRef.current;
        if (onRemove) current = onRemove(current, id);
        const list = current[key] as Item<K>[];
        commit({ ...current, [key]: list.filter((item) => item.id !== id) });
      },
    }),
    [commit],
  );

  const value = useMemo<DataContextValue>(() => {
    /** Drops the activities of the given seasons. */
    const withoutActivitiesOf = (
      current: AppData,
      seasonIds: Id[],
    ): AppData => ({
      ...current,
      activities: current.activities.filter(
        (a) => !seasonIds.includes(a.seasonId),
      ),
    });

    function saveParcel(
      draft: Draft<AppData["parcels"][number]>,
      id?: Id,
    ): ParcelSaveResult {
      const current = dataRef.current;
      const existing = findDuplicateParcel(
        current.parcels,
        draft.number,
        draft.municipality,
        id,
      );
      if (existing) return { ok: false, reason: "duplicate", existing };

      const parcel = { ...draft, id: id ?? newId() };
      commit({
        ...current,
        parcels: id
          ? current.parcels.map((p) => (p.id === id ? parcel : p))
          : [...current.parcels, parcel],
      });
      return { ok: true, parcel };
    }

    return {
      data,
      saveFailed,
      parcels: {
        add: (draft) => saveParcel(draft),
        update: (id, draft) => saveParcel(draft, id),
        remove: (id) => {
          const current = dataRef.current;
          const seasonIds = current.seasons
            .filter((s) => s.parcelId === id)
            .map((s) => s.id);
          const cleaned = withoutActivitiesOf(current, seasonIds);
          commit({
            ...cleaned,
            parcels: cleaned.parcels.filter((p) => p.id !== id),
            seasons: cleaned.seasons.filter((s) => s.parcelId !== id),
          });
        },
      },
      seasons: crudFor("seasons", (current, id) =>
        withoutActivitiesOf(current, [id]),
      ),
      activities: crudFor("activities"),
      costs: crudFor("costs"),
      incomes: crudFor("incomes"),
      replaceAll: (next) => commit(next),
    };
  }, [data, saveFailed, commit, crudFor]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
