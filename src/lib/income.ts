import { yearOf } from "./format";
import type { Income } from "./types";

/** Income of one year, newest first. */
export function incomeOfYear(incomes: Income[], year: number): Income[] {
  return incomes
    .filter((i) => yearOf(i.date) === year)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Sales on one side, subsidies and other income on the other. */
export function splitIncome(incomes: Income[]) {
  return {
    sales: incomes.filter((i) => i.kind === "sale"),
    other: incomes.filter((i) => i.kind !== "sale"),
  };
}
