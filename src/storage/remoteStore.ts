/**
 * Everything that reads or writes farm data in Supabase.
 * Row Level Security limits every query to the user's own household, so no
 * query here has to filter by household itself.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "../lib/types";
import type { Database, Json } from "./database.types";
import {
  activityFromRow,
  costFromRow,
  incomeFromRow,
  parcelFromRow,
  seasonFromRow,
  toRow,
} from "./mappers";
import type { CollectionKey, Item } from "./operations";

type Client = SupabaseClient<Database>;

/** Supabase returns at most 1000 rows per request by default. */
const PAGE_SIZE = 1000;

/** Reads every row of a table, page by page. */
async function fetchAll<K extends CollectionKey>(client: Client, table: K) {
  const rows: Database["public"]["Tables"][K]["Row"][] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    // Generic over the table name, so TypeScript needs a hint here.
    rows.push(...(data as unknown as typeof rows));
    if (data.length < PAGE_SIZE) return rows;
  }
}

/** Loads all of the household's data, the five tables in parallel. */
export async function loadAll(client: Client): Promise<AppData> {
  const [parcels, seasons, activities, costs, incomes] = await Promise.all([
    fetchAll(client, "parcels"),
    fetchAll(client, "seasons"),
    fetchAll(client, "activities"),
    fetchAll(client, "costs"),
    fetchAll(client, "incomes"),
  ]);
  return {
    version: 1,
    parcels: parcels.map(parcelFromRow),
    seasons: seasons.map(seasonFromRow),
    activities: activities.map(activityFromRow),
    costs: costs.map(costFromRow),
    incomes: incomes.map(incomeFromRow),
  };
}

/** One change to send to the server. */
export type WriteOp =
  | { kind: "insert"; table: CollectionKey; item: Item<CollectionKey> }
  | { kind: "update"; table: CollectionKey; item: Item<CollectionKey> }
  | { kind: "delete"; table: CollectionKey; id: string };

function rowOf(table: CollectionKey, item: Item<CollectionKey>) {
  // The table and the item always belong together (see WriteOp).
  const convert = toRow[table] as (item: Item<CollectionKey>) => object;
  return convert(item);
}

export async function runWrite(client: Client, op: WriteOp): Promise<void> {
  // `select("id")` returns the affected rows, so an update or delete that
  // matched nothing (already deleted, or no access) is reported as an error
  // instead of passing silently.
  const result =
    op.kind === "insert"
      ? await client.from(op.table).insert(rowOf(op.table, op.item) as never)
      : op.kind === "update"
        ? await client
            .from(op.table)
            .update(rowOf(op.table, op.item) as never)
            .eq("id", op.item.id)
            .select("id")
        : await client.from(op.table).delete().eq("id", op.id).select("id");

  if (result.error) throw result.error;
  if (op.kind !== "insert" && result.data?.length === 0) {
    throw new Error("not_found");
  }
}

/** Replaces all of the household's data in one database transaction. */
export async function replaceAllRemote(
  client: Client,
  data: AppData,
): Promise<void> {
  const payload = {
    parcels: data.parcels.map(toRow.parcels),
    seasons: data.seasons.map(toRow.seasons),
    activities: data.activities.map(toRow.activities),
    costs: data.costs.map(toRow.costs),
    incomes: data.incomes.map(toRow.incomes),
  };
  const { error } = await client.rpc("replace_household_data", {
    payload: payload as unknown as Json,
  });
  if (error) throw error;
}

/** Turns a failed write into one of a few messages the user can act on. */
export type SaveError = "storage" | "duplicate" | "network" | "generic";

export function saveErrorOf(error: unknown): SaveError {
  if (typeof error === "object" && error !== null) {
    const e = error as { code?: string; message?: string };
    if (e.code === "23505") return "duplicate";
    if (e.message && /fetch|network|load failed/i.test(e.message)) {
      return "network";
    }
  }
  return "generic";
}
