import { sumRsd } from "./costs";
import { yearOf } from "./format";
import type { AppData, CostType, Crop, Money } from "./types";

/** Every year that has costs or income, plus the current year, oldest first. */
export function balanceYears(data: AppData, currentYear: number): number[] {
  const years = new Set<number>([currentYear]);
  for (const c of data.costs) years.add(yearOf(c.date));
  for (const i of data.incomes) years.add(yearOf(i.date));
  return [...years].sort((a, b) => a - b);
}

/** One row of a "by category" breakdown. */
export interface BreakdownRow<K extends string> {
  key: K;
  amount: Money;
}

/** Income sources: a sale of a given crop, subsidies, or other income. */
export type IncomeSource = `sale:${Crop}` | "subsidy" | "other";

export interface YearBalance {
  year: number;
  income: Money;
  costs: Money;
  difference: Money;
  /** Area used for per-hectare figures (see areaForYear). */
  areaHa: number;
  costsByType: BreakdownRow<CostType>[];
  incomeBySource: BreakdownRow<IncomeSource>[];
  /** True when the year has any costs or income at all. */
  hasData: boolean;
}

/**
 * Area farmed in a year: parcels that have a season in that year.
 * Falls back to all parcels when no seasons were entered for the year.
 */
export function areaForYear(data: AppData, year: number): number {
  const parcelIds = new Set(
    data.seasons.filter((s) => s.year === year).map((s) => s.parcelId),
  );
  const parcels =
    parcelIds.size > 0
      ? data.parcels.filter((p) => parcelIds.has(p.id))
      : data.parcels;
  return parcels.reduce((sum, p) => sum + p.areaHa, 0);
}

/** Groups amounts by key and sorts the groups from largest to smallest. */
function groupSum<K extends string>(
  items: { key: K; amount: Money }[],
): BreakdownRow<K>[] {
  const totals = new Map<K, Money>();
  for (const { key, amount } of items) {
    totals.set(key, (totals.get(key) ?? 0) + amount);
  }
  return [...totals.entries()]
    .map(([key, amount]) => ({ key, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function balanceForYear(data: AppData, year: number): YearBalance {
  const costs = data.costs.filter((c) => yearOf(c.date) === year);
  const incomes = data.incomes.filter((i) => yearOf(i.date) === year);

  const costTotal = sumRsd(costs);
  const incomeTotal = sumRsd(incomes);

  return {
    year,
    income: incomeTotal,
    costs: costTotal,
    difference: incomeTotal - costTotal,
    areaHa: areaForYear(data, year),
    costsByType: groupSum(
      costs.map((c) => ({ key: c.type, amount: c.totalRsd })),
    ),
    incomeBySource: groupSum<IncomeSource>(
      incomes.map((i) => ({
        key:
          i.kind === "sale" ? (`sale:${i.crop ?? "other"}` as const) : i.kind,
        amount: i.totalRsd,
      })),
    ),
    hasData: costs.length > 0 || incomes.length > 0,
  };
}

/**
 * Change of the difference compared to another year, as a fraction
 * (0.182 = +18,2 %). Undefined when the other year's difference is zero.
 */
export function relativeChange(
  current: Money,
  previous: Money,
): number | undefined {
  if (previous === 0) return undefined;
  return (current - previous) / Math.abs(previous);
}
