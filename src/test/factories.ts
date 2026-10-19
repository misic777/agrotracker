/**
 * Small builders for test data. Each one fills in sensible defaults so a
 * test only spells out the fields it is actually about.
 */
import type {
  Activity,
  AppData,
  Cost,
  Income,
  Parcel,
  Season,
} from "../lib/types";

export function parcel(p: Partial<Parcel> & { id: string }): Parcel {
  return { name: p.id, number: "1", municipality: "Pačir", areaHa: 1, ...p };
}

export function season(
  s: Partial<Season> & { id: string; parcelId: string },
): Season {
  return { year: 2026, crop: "corn", ...s };
}

export function activity(
  a: Partial<Activity> & { id: string; seasonId: string },
): Activity {
  return { type: "tillage", date: "2026-04-01", ...a };
}

/** An RSD cost; pass `totalRsd` for EUR costs. Amounts are in para. */
export function cost(c: Partial<Cost> & { id: string; total: number }): Cost {
  return {
    date: "2026-05-01",
    type: "other",
    description: "",
    currency: "RSD",
    totalRsd: c.total,
    ...c,
  };
}

export function income(
  i: Partial<Income> & { id: string; total: number },
): Income {
  return {
    date: "2026-09-01",
    kind: "other",
    currency: "RSD",
    totalRsd: i.total,
    ...i,
  };
}

export function appData(d: Partial<Omit<AppData, "version">> = {}): AppData {
  return {
    version: 1,
    parcels: [],
    seasons: [],
    activities: [],
    costs: [],
    incomes: [],
    ...d,
  };
}
