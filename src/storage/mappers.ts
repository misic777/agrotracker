/**
 * Translation between database rows and the app's types.
 *
 * The database uses snake_case and null ("area_ha: null"); the app uses
 * camelCase and leaves empty optional fields out ("areaHa" / undefined).
 * Codes such as crop or cost type are plain text in the database and
 * checked there, so here they are only narrowed to the app's types.
 */
import type {
  Activity,
  AppData,
  Cost,
  Income,
  Parcel,
  Season,
} from "../lib/types";
import type { Database } from "./database.types";

type Tables = Database["public"]["Tables"];
type Row<T extends keyof Tables> = Tables[T]["Row"];
type Insert<T extends keyof Tables> = Tables[T]["Insert"];

/** null -> undefined, for optional fields. */
const opt = <T>(value: T | null): T | undefined =>
  value === null ? undefined : value;

/** undefined -> null, so clearing a field also clears it in the database. */
const nul = <T>(value: T | undefined): T | null =>
  value === undefined ? null : value;

export const parcelFromRow = (r: Row<"parcels">): Parcel => ({
  id: r.id,
  name: r.name,
  number: r.number,
  municipality: r.municipality,
  areaHa: Number(r.area_ha),
  note: opt(r.note),
});

export const parcelToRow = (p: Parcel): Insert<"parcels"> => ({
  id: p.id,
  name: p.name,
  number: p.number,
  municipality: p.municipality,
  area_ha: p.areaHa,
  note: nul(p.note),
});

export const seasonFromRow = (r: Row<"seasons">): Season => ({
  id: r.id,
  parcelId: r.parcel_id,
  year: r.year,
  crop: r.crop as Season["crop"],
  hybrid: opt(r.hybrid),
  yieldKg: r.yield_kg === null ? undefined : Number(r.yield_kg),
  note: opt(r.note),
});

export const seasonToRow = (s: Season): Insert<"seasons"> => ({
  id: s.id,
  parcel_id: s.parcelId,
  year: s.year,
  crop: s.crop,
  hybrid: nul(s.hybrid),
  yield_kg: nul(s.yieldKg),
  note: nul(s.note),
});

export const activityFromRow = (r: Row<"activities">): Activity => ({
  id: r.id,
  seasonId: r.season_id,
  type: r.type as Activity["type"],
  date: r.date,
  product: opt(r.product),
  ratePerHa: r.rate_per_ha === null ? undefined : Number(r.rate_per_ha),
  rateUnit: opt(r.rate_unit) as Activity["rateUnit"],
  note: opt(r.note),
});

export const activityToRow = (a: Activity): Insert<"activities"> => ({
  id: a.id,
  season_id: a.seasonId,
  type: a.type,
  date: a.date,
  product: nul(a.product),
  rate_per_ha: nul(a.ratePerHa),
  rate_unit: nul(a.rateUnit),
  note: nul(a.note),
});

export const costFromRow = (r: Row<"costs">): Cost => ({
  id: r.id,
  date: r.date,
  type: r.type as Cost["type"],
  description: r.description,
  quantity: r.quantity === null ? undefined : Number(r.quantity),
  unit: opt(r.unit) as Cost["unit"],
  unitPrice: opt(r.unit_price),
  currency: r.currency as Cost["currency"],
  total: r.total,
  exchangeRate: r.exchange_rate === null ? undefined : Number(r.exchange_rate),
  totalRsd: r.total_rsd,
});

export const costToRow = (c: Cost): Insert<"costs"> => ({
  id: c.id,
  date: c.date,
  type: c.type,
  description: c.description,
  quantity: nul(c.quantity),
  unit: nul(c.unit),
  unit_price: nul(c.unitPrice),
  currency: c.currency,
  total: c.total,
  exchange_rate: nul(c.exchangeRate),
  total_rsd: c.totalRsd,
});

export const incomeFromRow = (r: Row<"incomes">): Income => ({
  id: r.id,
  date: r.date,
  kind: r.kind as Income["kind"],
  description: opt(r.description),
  crop: opt(r.crop) as Income["crop"],
  quantityKg: r.quantity_kg === null ? undefined : Number(r.quantity_kg),
  pricePerKg: opt(r.price_per_kg),
  buyer: opt(r.buyer),
  currency: r.currency as Income["currency"],
  total: r.total,
  exchangeRate: r.exchange_rate === null ? undefined : Number(r.exchange_rate),
  totalRsd: r.total_rsd,
});

export const incomeToRow = (i: Income): Insert<"incomes"> => ({
  id: i.id,
  date: i.date,
  kind: i.kind,
  description: nul(i.description),
  crop: nul(i.crop),
  quantity_kg: nul(i.quantityKg),
  price_per_kg: nul(i.pricePerKg),
  buyer: nul(i.buyer),
  currency: i.currency,
  total: i.total,
  exchange_rate: nul(i.exchangeRate),
  total_rsd: i.totalRsd,
});

/** Converters per collection, so generic code can pick the right one. */
export const toRow = {
  parcels: parcelToRow,
  seasons: seasonToRow,
  activities: activityToRow,
  costs: costToRow,
  incomes: incomeToRow,
};

/**
 * Gives every record a fresh id and updates the references between them
 * (season -> parcel, activity -> season). Used when uploading a backup, so
 * its ids can never clash with rows that already exist in the database.
 */
export function withFreshIds(
  data: AppData,
  newId: () => string = () => crypto.randomUUID(),
): AppData {
  const ids = new Map<string, string>();
  const fresh = (old: string) => {
    if (!ids.has(old)) ids.set(old, newId());
    return ids.get(old)!;
  };
  return {
    version: 1,
    parcels: data.parcels.map((p) => ({ ...p, id: fresh(`p:${p.id}`) })),
    seasons: data.seasons.map((s) => ({
      ...s,
      id: fresh(`s:${s.id}`),
      parcelId: fresh(`p:${s.parcelId}`),
    })),
    activities: data.activities.map((a) => ({
      ...a,
      id: fresh(`a:${a.id}`),
      seasonId: fresh(`s:${a.seasonId}`),
    })),
    costs: data.costs.map((c) => ({ ...c, id: fresh(`c:${c.id}`) })),
    incomes: data.incomes.map((i) => ({ ...i, id: fresh(`i:${i.id}`) })),
  };
}
