import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "../auth/AuthContext";
import { LoadErrorScreen, LoadingScreen } from "../components/FullPageMessage";
import { newId } from "../lib/ids";
import type { AppData } from "../lib/types";
import { DataContext, type DataContextValue } from "./DataContext";
import { withFreshIds } from "./mappers";
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
import {
  loadAll,
  replaceAllRemote,
  runWrite,
  saveErrorOf,
  type SaveError,
  type WriteOp,
} from "./remoteStore";
import { requireSupabase } from "./supabaseClient";

/**
 * The household's data in Supabase, kept in the TanStack Query cache.
 *
 * Changes are "optimistic": the cache (and so the screen) is updated right
 * away, and the change is sent to the server in the background. Writes run
 * one after another (same `scope`), so a season never reaches the server
 * before its parcel. When the last pending write finishes, the data is
 * loaded again, so the screen always ends up showing what the server has.
 * If a write fails, that reload puts back the server's version and an error
 * is shown.
 */
export function SupabaseDataProvider({
  householdId,
  children,
}: {
  householdId: string;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const client = requireSupabase();
  const [saveError, setSaveError] = useState<SaveError | null>(null);

  const dataKey = useMemo(() => ["data", householdId] as const, [householdId]);
  const writeKey = useMemo(
    () => ["write", householdId] as const,
    [householdId],
  );
  const hasPendingWrites = () =>
    queryClient.isMutating({ mutationKey: writeKey }) > 0;

  const query = useQuery({
    queryKey: dataKey,
    queryFn: () => loadAll(client),
    // A reload while changes are still being sent would briefly hide them.
    refetchOnWindowFocus: () => !hasPendingWrites(),
  });

  const write = useMutation({
    mutationKey: writeKey,
    scope: { id: `write-${householdId}` },
    mutationFn: (op: WriteOp) => runWrite(client, op),
    onSuccess: () => setSaveError(null),
    onError: (error) => {
      console.error("Saving to the server failed", error);
      setSaveError(saveErrorOf(error));
    },
    onSettled: () => {
      // This mutation still counts as running here, hence "=== 1".
      if (queryClient.isMutating({ mutationKey: writeKey }) === 1) {
        return queryClient.invalidateQueries({ queryKey: dataKey });
      }
    },
  });

  // Ask before closing the tab while changes are still being sent.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (queryClient.isMutating({ mutationKey: writeKey }) > 0)
        e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [queryClient, writeKey]);

  const { mutate } = write;
  const value = useMemo<DataContextValue | null>(() => {
    if (!query.data) return null;

    const current = () => queryClient.getQueryData<AppData>(dataKey)!;

    /** Show the change now, send it to the server in the background. */
    const apply = (next: AppData, op: WriteOp) => {
      void queryClient.cancelQueries({ queryKey: dataKey });
      queryClient.setQueryData(dataKey, next);
      mutate(op);
    };

    const crud = <K extends "seasons" | "activities" | "costs" | "incomes">(
      table: K,
    ) => ({
      add: (draft: Omit<Item<K>, "id">) => {
        const item = { ...draft, id: newId() } as Item<K>;
        apply(insertItem(current(), table, item), {
          kind: "insert",
          table,
          item,
        });
        return item;
      },
      update: (id: string, draft: Omit<Item<K>, "id">) => {
        const item = { ...draft, id } as Item<K>;
        apply(updateItem(current(), table, item), {
          kind: "update",
          table,
          item,
        });
      },
      remove: (id: string) => {
        const next =
          table === "seasons"
            ? removeSeason(current(), id)
            : removeItem(
                current(),
                table as Exclude<CollectionKey, "parcels" | "seasons">,
                id,
              );
        // The database removes a season's activities by itself (cascade).
        apply(next, { kind: "delete", table, id });
      },
    });

    const saveParcel = (
      draft: Parameters<DataContextValue["parcels"]["add"]>[0],
      id?: string,
    ) => {
      const data = current();
      const result = prepareParcel(data, draft, id ?? newId(), !id);
      if (result.ok) {
        apply(
          id
            ? updateItem(data, "parcels", result.parcel)
            : insertItem(data, "parcels", result.parcel),
          {
            kind: id ? "update" : "insert",
            table: "parcels",
            item: result.parcel,
          },
        );
      }
      return result;
    };

    return {
      data: query.data,
      mode: "online",
      saveError,
      dismissSaveError: () => setSaveError(null),
      parcels: {
        add: (draft) => saveParcel(draft),
        update: (id, draft) => saveParcel(draft, id),
        remove: (id) =>
          apply(removeParcel(current(), id), {
            kind: "delete",
            table: "parcels",
            id,
          }),
      },
      seasons: crud("seasons"),
      activities: crud("activities"),
      costs: crud("costs"),
      incomes: crud("incomes"),
      replaceAll: async (next) => {
        // Fresh ids: a backup may contain ids that already exist elsewhere.
        await replaceAllRemote(client, withFreshIds(next));
        await queryClient.invalidateQueries({ queryKey: dataKey });
      },
    };
  }, [query.data, saveError, queryClient, dataKey, mutate, client]);

  if (query.isPending) return <LoadingScreen />;
  if (!value) {
    return (
      <LoadErrorScreen
        onRetry={() => query.refetch()}
        onSignOut={() => signOut()}
      />
    );
  }
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}
