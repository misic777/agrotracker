import { describe, expect, it } from "vitest";
import { completeLine, fromMinor, toMinor, toRsd } from "./money";

describe("toMinor / fromMinor", () => {
  it("converts between whole amounts and minor units", () => {
    expect(toMinor(12.5)).toBe(1250);
    expect(fromMinor(1250)).toBe(12.5);
  });

  it("rounds away floating point noise", () => {
    // 0.1 + 0.2 is 0.30000000000000004 in JavaScript.
    expect(toMinor(0.1 + 0.2)).toBe(30);
    expect(toMinor(1.15)).toBe(115);
  });
});

describe("toRsd", () => {
  it("keeps RSD amounts as they are", () => {
    expect(toRsd(7524000, "RSD")).toBe(7524000);
  });

  it("converts EUR with the given exchange rate", () => {
    // 1.200,00 EUR at 117,2 = 140.640,00 RSD
    expect(toRsd(120000, "EUR", 117.2)).toBe(14064000);
  });

  it("rounds the converted amount to whole para", () => {
    // 0,01 EUR at 117,25 = 1,1725 RSD -> 117 para
    expect(toRsd(1, "EUR", 117.25)).toBe(117);
  });

  it("refuses EUR without a positive exchange rate", () => {
    expect(() => toRsd(100, "EUR")).toThrow();
    expect(() => toRsd(100, "EUR", 0)).toThrow();
  });
});

describe("completeLine (any two of three)", () => {
  it("calculates the total from quantity and unit price", () => {
    // 200 l of diesel at 150,00 RSD = 30.000,00 RSD
    expect(completeLine({ quantity: 200, unitPrice: 15000 })).toEqual({
      quantity: 200,
      unitPrice: 15000,
      total: 3000000,
    });
  });

  it("calculates the unit price from quantity and total", () => {
    expect(completeLine({ quantity: 3, total: 1000 })).toEqual({
      quantity: 3,
      unitPrice: 333,
      total: 1000,
    });
  });

  it("calculates the quantity from unit price and total", () => {
    expect(completeLine({ unitPrice: 15000, total: 3000000 })?.quantity).toBe(
      200,
    );
  });

  it("prefers quantity and unit price when all three are given", () => {
    expect(
      completeLine({ quantity: 2, unitPrice: 500, total: 999999 })?.total,
    ).toBe(1000);
  });

  it("returns null with fewer than two values", () => {
    expect(completeLine({})).toBeNull();
    expect(completeLine({ quantity: 5 })).toBeNull();
  });

  it("does not divide by zero", () => {
    expect(completeLine({ quantity: 0, total: 1000 })).toBeNull();
    expect(completeLine({ unitPrice: 0, total: 1000 })).toBeNull();
  });
});
