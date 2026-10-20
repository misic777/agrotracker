import { describe, expect, it } from "vitest";
import {
  activity,
  appData,
  cost,
  income,
  parcel,
  season,
} from "../test/factories";
import {
  activityFromRow,
  activityToRow,
  costFromRow,
  costToRow,
  incomeFromRow,
  incomeToRow,
  parcelFromRow,
  parcelToRow,
  seasonFromRow,
  seasonToRow,
  withFreshIds,
} from "./mappers";

/** What the database sends back: the inserted columns plus its own ones. */
const stored = <T extends object>(row: T) => ({
  household_id: "h1",
  created_at: "2026-10-20T10:00:00Z",
  created_by: null,
  ...row,
});

describe("mappers", () => {
  it("round-trips every record type through a database row", () => {
    const p = parcel({ id: "p1", areaHa: 4.2, note: "Kod bunara" });
    const s = season({
      id: "s1",
      parcelId: "p1",
      yieldKg: 42000,
      hybrid: "NS 6030",
    });
    const a = activity({
      id: "a1",
      seasonId: "s1",
      type: "spraying",
      product: "Nikosulfuron",
      ratePerHa: 1.25,
      rateUnit: "lPerHa",
    });
    const c = cost({
      id: "c1",
      currency: "EUR",
      total: 120000,
      exchangeRate: 117.2,
      totalRsd: 14064000,
      quantity: 1,
      unit: "pcs",
      unitPrice: 120000,
    });
    const i = income({
      id: "i1",
      kind: "sale",
      crop: "corn",
      quantityKg: 30000,
      pricePerKg: 2250,
      buyer: "Silos",
      total: 67500000,
    });

    expect(parcelFromRow(stored(parcelToRow(p)) as never)).toEqual(p);
    expect(seasonFromRow(stored(seasonToRow(s)) as never)).toEqual(s);
    expect(activityFromRow(stored(activityToRow(a)) as never)).toEqual(a);
    expect(costFromRow(stored(costToRow(c)) as never)).toEqual(c);
    expect(incomeFromRow(stored(incomeToRow(i)) as never)).toEqual(i);
  });

  it("sends empty optional fields as null, so clearing them works", () => {
    const row = seasonToRow(season({ id: "s1", parcelId: "p1" }));
    expect(row.yield_kg).toBeNull();
    expect(row.hybrid).toBeNull();
  });

  it("reads null back as a missing field", () => {
    const p = parcelFromRow(stored(parcelToRow(parcel({ id: "p1" }))) as never);
    expect("note" in p && p.note !== undefined).toBe(false);
  });

  it("reads numeric columns that arrive as text", () => {
    const row = stored({
      ...parcelToRow(parcel({ id: "p1" })),
      area_ha: "4.2000",
    });
    expect(parcelFromRow(row as never).areaHa).toBe(4.2);
  });
});

describe("withFreshIds", () => {
  it("replaces every id and keeps the links between records", () => {
    let n = 0;
    const data = appData({
      parcels: [parcel({ id: "p1" })],
      seasons: [season({ id: "s1", parcelId: "p1" })],
      activities: [activity({ id: "a1", seasonId: "s1" })],
      costs: [cost({ id: "c1", total: 1 })],
    });
    const next = withFreshIds(data, () => `id-${++n}`);

    expect(next.parcels[0].id).not.toBe("p1");
    expect(next.seasons[0].parcelId).toBe(next.parcels[0].id);
    expect(next.activities[0].seasonId).toBe(next.seasons[0].id);
    expect(
      new Set([
        next.parcels[0].id,
        next.seasons[0].id,
        next.activities[0].id,
        next.costs[0].id,
      ]).size,
    ).toBe(4);
  });
});
