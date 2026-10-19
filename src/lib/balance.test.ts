import { describe, expect, it } from "vitest";
import { appData, cost, income, parcel, season } from "../test/factories";
import {
  areaForYear,
  balanceForYear,
  balanceYears,
  relativeChange,
} from "./balance";

const data = appData({
  parcels: [
    parcel({ id: "p1", areaHa: 4.2 }),
    parcel({ id: "p2", areaHa: 7.85 }),
    parcel({ id: "p3", areaHa: 2.1 }),
  ],
  seasons: [
    season({ id: "s1", parcelId: "p1", year: 2026 }),
    season({ id: "s2", parcelId: "p2", year: 2026 }),
    season({ id: "s3", parcelId: "p1", year: 2025 }),
  ],
  costs: [
    cost({ id: "c1", date: "2026-03-10", type: "fuel", total: 7524000 }),
    cost({ id: "c2", date: "2026-04-02", type: "fuel", total: 1000000 }),
    // 1.200 EUR at 117,2: only the RSD value counts in the balance.
    cost({
      id: "c3",
      date: "2026-01-15",
      type: "rent",
      currency: "EUR",
      total: 120000,
      exchangeRate: 117.2,
      totalRsd: 14064000,
    }),
    cost({ id: "c4", date: "2025-06-01", type: "seed", total: 5000000 }),
  ],
  incomes: [
    income({ id: "i1", kind: "sale", crop: "corn", total: 67500000 }),
    income({ id: "i2", kind: "sale", crop: "corn", total: 2500000 }),
    income({ id: "i3", kind: "subsidy", total: 3000000 }),
    income({
      id: "i4",
      date: "2024-09-01",
      kind: "sale",
      crop: "wheat",
      total: 100,
    }),
  ],
});

describe("balanceForYear", () => {
  const b = balanceForYear(data, 2026);

  it("adds up income and costs of that year only, in RSD", () => {
    expect(b.income).toBe(73000000); // 730.000 RSD
    expect(b.costs).toBe(22588000); // 75.240 + 10.000 + 140.640 RSD
    expect(b.difference).toBe(50412000);
    expect(b.hasData).toBe(true);
  });

  it("groups costs by type, largest first", () => {
    expect(b.costsByType).toEqual([
      { key: "rent", amount: 14064000 },
      { key: "fuel", amount: 8524000 },
    ]);
  });

  it("groups sales by crop and keeps subsidies separate", () => {
    expect(b.incomeBySource).toEqual([
      { key: "sale:corn", amount: 70000000 },
      { key: "subsidy", amount: 3000000 },
    ]);
  });

  it("reports an empty year as having no data", () => {
    const empty = balanceForYear(data, 2023);
    expect(empty.hasData).toBe(false);
    expect(empty.difference).toBe(0);
  });

  it("gives a negative difference when costs are higher", () => {
    expect(balanceForYear(data, 2025).difference).toBe(-5000000);
  });
});

describe("areaForYear", () => {
  it("counts only parcels that have a season that year", () => {
    expect(areaForYear(data, 2026)).toBeCloseTo(12.05); // p1 + p2
    expect(areaForYear(data, 2025)).toBeCloseTo(4.2); // p1
  });

  it("falls back to all parcels when the year has no seasons", () => {
    expect(areaForYear(data, 2024)).toBeCloseTo(14.15);
  });
});

describe("balanceYears", () => {
  it("lists years with data plus the current year, oldest first", () => {
    expect(balanceYears(data, 2027)).toEqual([2024, 2025, 2026, 2027]);
  });
});

describe("relativeChange", () => {
  it("returns the change as a fraction", () => {
    expect(relativeChange(118, 100)).toBeCloseTo(0.18);
    expect(relativeChange(50, 100)).toBeCloseTo(-0.5);
  });

  it("measures against the size of a negative previous year", () => {
    // From a loss of 100 to a profit of 100 is an improvement (+200 %).
    expect(relativeChange(100, -100)).toBeCloseTo(2);
  });

  it("is undefined when the previous year was zero", () => {
    expect(relativeChange(100, 0)).toBeUndefined();
  });
});
