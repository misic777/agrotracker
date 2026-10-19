import { describe, expect, it } from "vitest";
import {
  createFormatters,
  parseDecimal,
  parseIsoDate,
  toIsoDate,
  yearOf,
} from "./format";

describe("parseDecimal", () => {
  it.each([
    ["1500", 1500],
    ["1,5", 1.5],
    ["1.5", 1.5],
    ["1.500,25", 1500.25], // Serbian style
    ["1,500.25", 1500.25], // English style
    ["1.500", 1500], // dot as thousands separator
    ["12.500.000", 12500000],
    [" 1 500 ", 1500],
    ["1 500,5", 1500.5], // non-breaking space, as Intl formats it
    ["-3", -3],
  ])("reads %j as %d", (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it.each(["", "   ", "abc", "1,2,3", "12a", "1..5"])("rejects %j", (input) => {
    expect(parseDecimal(input)).toBeUndefined();
  });
});

describe("dates", () => {
  it("reads the year from an ISO date", () => {
    expect(yearOf("2026-10-09")).toBe(2026);
  });

  it("parses ISO dates as local dates, not UTC", () => {
    const date = parseIsoDate("2026-01-01");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });

  it("round-trips between Date and ISO text", () => {
    expect(toIsoDate(parseIsoDate("2026-03-07"))).toBe("2026-03-07");
  });
});

describe("createFormatters", () => {
  const sr = createFormatters("sr");
  const en = createFormatters("en");

  it("formats money in each language", () => {
    expect(sr.money(7524000)).toBe("75.240,00 RSD");
    expect(en.money(7524000)).toBe("75,240.00 RSD");
    expect(sr.money(120000, "EUR")).toBe("1.200,00 €");
  });

  it("formats short money without decimals", () => {
    expect(sr.moneyShort(59976049)).toBe("599.760");
  });

  it("formats dates in each language", () => {
    expect(sr.date("2026-10-09")).toBe("09.10.2026.");
    expect(en.date("2026-10-09")).toBe("09/10/2026");
  });

  it("formats area with two decimals", () => {
    expect(sr.area(14.15)).toBe("14,15 ha");
  });
});
