import { describe, expect, it } from "vitest";
import { balanceForYear } from "../lib/balance";
import { findDuplicateParcel } from "../lib/parcels";
import { parseBackup } from "../storage/localStore";
import { createSampleFarm } from "./sampleFarm";

const autumn = new Date(2026, 9, 20); // 20 Oct 2026
const spring = new Date(2026, 2, 15); // 15 Mar 2026

describe("createSampleFarm", () => {
  const farm = createSampleFarm("sr", autumn);

  it("is a valid backup (could be exported and imported again)", () => {
    expect(parseBackup(JSON.stringify(farm))).not.toBeNull();
  });

  it("covers this year and the two before it", () => {
    expect([...new Set(farm.seasons.map((s) => s.year))]).toEqual([
      2024, 2025, 2026,
    ]);
  });

  it("has one season per parcel per year", () => {
    const keys = farm.seasons.map((s) => `${s.parcelId}|${s.year}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("only links to records that exist", () => {
    const parcelIds = new Set(farm.parcels.map((p) => p.id));
    const seasonIds = new Set(farm.seasons.map((s) => s.id));
    expect(farm.seasons.every((s) => parcelIds.has(s.parcelId))).toBe(true);
    expect(farm.activities.every((a) => seasonIds.has(a.seasonId))).toBe(true);
  });

  it("respects the parcel number rule", () => {
    for (const p of farm.parcels) {
      expect(
        findDuplicateParcel(farm.parcels, p.number, p.municipality, p.id),
      ).toBeUndefined();
    }
  });

  it("has unique ids", () => {
    const ids = [
      ...farm.parcels,
      ...farm.seasons,
      ...farm.activities,
      ...farm.costs,
      ...farm.incomes,
    ].map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has money only in the three years of the farm", () => {
    const years = new Set(
      [...farm.costs, ...farm.incomes].map((x) => x.date.slice(0, 4)),
    );
    expect([...years].sort()).toEqual(["2024", "2025", "2026"]);
  });

  it("never contains dates in the future", () => {
    const dates = [...farm.activities, ...farm.costs, ...farm.incomes].map(
      (x) => x.date,
    );
    expect(dates.every((d) => d <= "2026-10-20")).toBe(true);
  });

  it("shows profitable full years and a weaker drought year", () => {
    const [drought, normal] = [2024, 2025].map(
      (y) => balanceForYear(farm, y).difference,
    );
    expect(drought).toBeGreaterThan(0);
    expect(normal).toBeGreaterThan(drought);
  });

  it("converts EUR costs with their exchange rate", () => {
    const eur = farm.costs.filter((c) => c.currency === "EUR");
    expect(eur.length).toBeGreaterThan(0);
    for (const c of eur) {
      expect(c.totalRsd).toBe(Math.round(c.total * c.exchangeRate!));
    }
  });

  it("in spring, this year has no harvest, yield or sales yet", () => {
    const early = createSampleFarm("sr", spring);
    const thisYear = early.seasons.filter((s) => s.year === 2026);
    expect(thisYear).toHaveLength(4);
    expect(thisYear.every((s) => s.yieldKg === undefined)).toBe(true);
    expect(early.incomes.filter((i) => i.date.startsWith("2026"))).toEqual([]);
  });

  it("writes the same farm in both languages, with translated texts", () => {
    const en = createSampleFarm("en", autumn);
    expect(en.parcels.map((p) => p.areaHa)).toEqual(
      farm.parcels.map((p) => p.areaHa),
    );
    expect(balanceForYear(en, 2025)).toEqual(balanceForYear(farm, 2025));
    expect(farm.parcels[0].name).toBe("Kod bunara");
    expect(en.parcels[0].name).toBe("By the well");
  });
});
