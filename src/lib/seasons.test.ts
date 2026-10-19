import { describe, expect, it } from "vitest";
import { activity, parcel, season } from "../test/factories";
import {
  activitiesOfSeason,
  latestActivity,
  recentActivities,
  seasonsOfParcel,
  yieldPerHa,
} from "./seasons";

const activities = [
  activity({ id: "a1", seasonId: "s1", type: "sowing", date: "2026-04-20" }),
  activity({ id: "a2", seasonId: "s1", type: "harvest", date: "2026-10-08" }),
  activity({ id: "a3", seasonId: "s1", type: "spraying", date: "2026-06-16" }),
  activity({ id: "a4", seasonId: "s2", type: "tillage", date: "2026-11-01" }),
];

describe("seasonsOfParcel", () => {
  it("returns one parcel's seasons, newest year first", () => {
    const seasons = [
      season({ id: "s1", parcelId: "p1", year: 2025 }),
      season({ id: "s2", parcelId: "p2", year: 2026 }),
      season({ id: "s3", parcelId: "p1", year: 2026 }),
    ];
    expect(seasonsOfParcel(seasons, "p1").map((s) => s.id)).toEqual([
      "s3",
      "s1",
    ]);
  });
});

describe("activitiesOfSeason", () => {
  it("returns one season's activities, newest first", () => {
    expect(activitiesOfSeason(activities, "s1").map((a) => a.id)).toEqual([
      "a2",
      "a3",
      "a1",
    ]);
  });
});

describe("latestActivity", () => {
  it("finds the activity with the latest date", () => {
    expect(latestActivity(activities)?.id).toBe("a4");
  });

  it("is undefined for an empty log", () => {
    expect(latestActivity([])).toBeUndefined();
  });
});

describe("yieldPerHa", () => {
  it("divides the yield by the parcel area", () => {
    const s = season({ id: "s1", parcelId: "p1", yieldKg: 42000 });
    expect(yieldPerHa(s, 4.2)).toBeCloseTo(10000);
  });

  it("is undefined without a yield or an area", () => {
    expect(
      yieldPerHa(season({ id: "s1", parcelId: "p1" }), 4.2),
    ).toBeUndefined();
    const s = season({ id: "s1", parcelId: "p1", yieldKg: 1000 });
    expect(yieldPerHa(s, 0)).toBeUndefined();
  });
});

describe("recentActivities", () => {
  const data = {
    parcels: [parcel({ id: "p1", name: "Kod bunara" })],
    seasons: [season({ id: "s1", parcelId: "p1" })],
    activities, // a4 belongs to a season that no longer exists
  };

  it("returns the newest activities with their season and parcel", () => {
    const rows = recentActivities(data, 2);
    expect(rows.map((r) => r.activity.id)).toEqual(["a2", "a3"]);
    expect(rows[0].parcel.name).toBe("Kod bunara");
  });

  it("skips activities whose season or parcel is missing", () => {
    expect(recentActivities(data, 10).map((r) => r.activity.id)).not.toContain(
      "a4",
    );
  });
});
