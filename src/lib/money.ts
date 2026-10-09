import type { Currency, Money } from "./types";

/** 12.5 -> 1250 (minor units). */
export function toMinor(amount: number): Money {
  return Math.round(amount * 100);
}

/** 1250 -> 12.5 */
export function fromMinor(minor: Money): number {
  return minor / 100;
}

/** Converts a total in the payment currency to RSD. */
export function toRsd(
  total: Money,
  currency: Currency,
  exchangeRate?: number,
): Money {
  if (currency === "RSD") return total;
  if (!exchangeRate || exchangeRate <= 0) {
    throw new Error("A positive exchange rate is required for EUR amounts.");
  }
  return Math.round(total * exchangeRate);
}

/**
 * "Enter any two of three" for quantity, unit price and total.
 * Returns the missing value, or null if fewer than two are known.
 * Quantity is a plain number, prices and totals are in minor units.
 */
export function completeLine(line: {
  quantity?: number;
  unitPrice?: Money;
  total?: Money;
}): { quantity: number; unitPrice: Money; total: Money } | null {
  const { quantity, unitPrice, total } = line;
  if (quantity !== undefined && unitPrice !== undefined) {
    return { quantity, unitPrice, total: Math.round(quantity * unitPrice) };
  }
  if (quantity !== undefined && total !== undefined && quantity > 0) {
    return { quantity, unitPrice: Math.round(total / quantity), total };
  }
  if (unitPrice !== undefined && total !== undefined && unitPrice > 0) {
    return { quantity: total / unitPrice, unitPrice, total };
  }
  return null;
}
