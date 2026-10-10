import { yearOf } from "./format";
import type { Cost, CostType, IsoDate, Money, QuantityUnit } from "./types";

/** Years that have costs, plus the current year, newest first. */
export function costYears(costs: Cost[], currentYear: number): number[] {
  const years = new Set(costs.map((c) => yearOf(c.date)));
  years.add(currentYear);
  return [...years].sort((a, b) => b - a);
}

/** Costs of one year (and optionally one type), newest first. */
export function filterCosts(
  costs: Cost[],
  year: number,
  type: CostType | "all",
): Cost[] {
  return costs
    .filter(
      (c) => yearOf(c.date) === year && (type === "all" || c.type === type),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Sum in dinars; EUR costs were converted when they were saved. */
export function sumRsd(items: { totalRsd: Money }[]): Money {
  return items.reduce((sum, c) => sum + c.totalRsd, 0);
}

/**
 * The exchange rate of the most recent EUR cost, used to pre-fill the form,
 * since rent and similar payments usually repeat at a similar rate.
 */
export function lastExchangeRate(
  costs: Cost[],
): { rate: number; date: IsoDate } | undefined {
  let latest: Cost | undefined;
  for (const c of costs) {
    if (c.currency !== "EUR" || !c.exchangeRate) continue;
    if (!latest || c.date > latest.date) latest = c;
  }
  return latest?.exchangeRate
    ? { rate: latest.exchangeRate, date: latest.date }
    : undefined;
}

/** A sensible default unit for each cost type. */
export const DEFAULT_UNIT: Record<CostType, QuantityUnit> = {
  fuel: "l",
  seed: "kg",
  fertilizer: "kg",
  pesticide: "l",
  machineMaintenance: "pcs",
  services: "pcs",
  rent: "pcs",
  other: "pcs",
};
