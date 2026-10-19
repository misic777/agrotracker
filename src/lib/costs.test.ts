import { describe, expect, it } from "vitest";
import { cost } from "../test/factories";
import { costYears, filterCosts, lastExchangeRate, sumRsd } from "./costs";

const costs = [
  cost({ id: "c1", date: "2026-03-10", type: "fuel", total: 100 }),
  cost({ id: "c2", date: "2026-08-01", type: "seed", total: 200 }),
  cost({ id: "c3", date: "2026-05-20", type: "fuel", total: 300 }),
  cost({ id: "c4", date: "2024-02-01", type: "fuel", total: 400 }),
];

describe("filterCosts", () => {
  it("keeps one year, newest first", () => {
    expect(filterCosts(costs, 2026, "all").map((c) => c.id)).toEqual([
      "c2",
      "c3",
      "c1",
    ]);
  });

  it("can also filter by type", () => {
    expect(filterCosts(costs, 2026, "fuel").map((c) => c.id)).toEqual([
      "c3",
      "c1",
    ]);
  });
});

describe("costYears", () => {
  it("lists years with costs plus the current year, newest first", () => {
    expect(costYears(costs, 2027)).toEqual([2027, 2026, 2024]);
  });
});

describe("sumRsd", () => {
  it("adds the RSD values", () => {
    expect(sumRsd(costs)).toBe(1000);
    expect(sumRsd([])).toBe(0);
  });
});

describe("lastExchangeRate", () => {
  it("takes the rate of the most recent EUR cost", () => {
    const withEur = [
      ...costs,
      cost({
        id: "e1",
        date: "2026-01-10",
        currency: "EUR",
        total: 1,
        exchangeRate: 117.1,
      }),
      cost({
        id: "e2",
        date: "2026-06-10",
        currency: "EUR",
        total: 1,
        exchangeRate: 117.3,
      }),
      cost({
        id: "e3",
        date: "2025-12-31",
        currency: "EUR",
        total: 1,
        exchangeRate: 116.9,
      }),
    ];
    expect(lastExchangeRate(withEur)).toEqual({
      rate: 117.3,
      date: "2026-06-10",
    });
  });

  it("is undefined when there are no EUR costs", () => {
    expect(lastExchangeRate(costs)).toBeUndefined();
  });
});
