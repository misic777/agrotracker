import { describe, expect, it } from "vitest";
import { activity, appData, cost, parcel, season } from "../test/factories";
import {
  insertItem,
  prepareParcel,
  removeItem,
  removeParcel,
  removeSeason,
  updateItem,
} from "./operations";

const data = appData({
  parcels: [
    parcel({ id: "p1", number: "1", municipality: "Pačir" }),
    parcel({ id: "p2", number: "2" }),
  ],
  seasons: [
    season({ id: "s1", parcelId: "p1", year: 2025 }),
    season({ id: "s2", parcelId: "p1", year: 2026 }),
    season({ id: "s3", parcelId: "p2" }),
  ],
  activities: [
    activity({ id: "a1", seasonId: "s1" }),
    activity({ id: "a2", seasonId: "s2" }),
    activity({ id: "a3", seasonId: "s3" }),
  ],
  costs: [cost({ id: "c1", total: 100 })],
});

describe("operations", () => {
  it("adds and updates items without touching the original", () => {
    const added = insertItem(data, "costs", cost({ id: "c2", total: 5 }));
    expect(added.costs.map((c) => c.id)).toEqual(["c1", "c2"]);
    expect(data.costs).toHaveLength(1);

    const updated = updateItem(added, "costs", cost({ id: "c2", total: 9 }));
    expect(updated.costs[1].total).toBe(9);
  });

  it("removes a parcel with its seasons and their activities", () => {
    const next = removeParcel(data, "p1");
    expect(next.parcels.map((p) => p.id)).toEqual(["p2"]);
    expect(next.seasons.map((s) => s.id)).toEqual(["s3"]);
    expect(next.activities.map((a) => a.id)).toEqual(["a3"]);
  });

  it("removes a season with its activities only", () => {
    const next = removeSeason(data, "s1");
    expect(next.seasons.map((s) => s.id)).toEqual(["s2", "s3"]);
    expect(next.activities.map((a) => a.id)).toEqual(["a2", "a3"]);
  });

  it("removes a single cost", () => {
    expect(removeItem(data, "costs", "c1").costs).toEqual([]);
  });

  it("blocks a duplicate parcel number, except for the parcel itself", () => {
    const draft = { name: "X", number: "1", municipality: "pacir", areaHa: 1 };
    expect(prepareParcel(data, draft, "new", true).ok).toBe(false);
    expect(prepareParcel(data, draft, "p1", false).ok).toBe(true);
  });
});
