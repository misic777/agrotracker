import { useTranslation } from "react-i18next";
import { INTL_LOCALE, type Language } from "../i18n";
import { fromMinor } from "./money";
import type { Currency, IsoDate, Money } from "./types";

/** Today as "YYYY-MM-DD" in local time. */
export function todayIso(): IsoDate {
  return toIsoDate(new Date());
}

export function toIsoDate(date: Date): IsoDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parses "YYYY-MM-DD" as a local date (new Date("...") would use UTC). */
export function parseIsoDate(iso: IsoDate): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function yearOf(iso: IsoDate): number {
  return Number(iso.slice(0, 4));
}

/**
 * Parses a number typed by a user in either "1.500,25" or "1500.25" style.
 * Returns undefined for empty or invalid input.
 */
export function parseDecimal(input: string): number | undefined {
  let s = input.trim().replace(/[\s\u00a0]/g, "");
  if (s === "") return undefined;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    // Both present: the last one is the decimal separator.
    const thousands = lastComma > lastDot ? "." : ",";
    s = s.split(thousands).join("").replace(",", ".");
  } else if (lastComma !== -1) {
    s = s.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "1.500" or "12.500.000": dots are thousands separators.
    s = s.split(".").join("");
  }

  if (!/^-?\d+(\.\d+)?$/.test(s)) return undefined;
  return Number(s);
}

/** Locale-bound formatters. Pure, so they can be used outside React too. */
export function createFormatters(language: Language) {
  const locale = INTL_LOCALE[language];

  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const shortDateFormat = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
  });

  function number(value: number, maxFractionDigits = 2, minFractionDigits = 0) {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits,
    }).format(value);
  }

  return {
    /** 2026-10-09 -> "09.10.2026." (sr) / "09/10/2026" (en) */
    date: (iso: IsoDate) => dateFormat.format(parseIsoDate(iso)),
    /** 2026-10-09 -> "09.10." (sr) / "09/10" (en) */
    shortDate: (iso: IsoDate) => shortDateFormat.format(parseIsoDate(iso)),
    number,
    /** 1971380 -> "1.971.380" */
    integer: (value: number) => number(value, 0),
    /** 24.5 -> "24,50 ha" */
    area: (ha: number) => `${number(ha, 2, 2)} ha`,
    /** Minor units -> "75.240,00 RSD" / "1.200,00 €" */
    money: (minor: Money, currency: Currency = "RSD") =>
      `${number(fromMinor(minor), 2, 2)} ${currency === "EUR" ? "€" : "RSD"}`,
    /** Minor units -> "1.971.380" (no decimals, for summaries). */
    moneyShort: (minor: Money) => number(Math.round(fromMinor(minor)), 0),
    /** Minor units as an editable input value, e.g. "1.200,00". */
    moneyInput: (minor: Money) => number(fromMinor(minor), 2, 2),
  };
}

export type Formatters = ReturnType<typeof createFormatters>;

/** Formatters for the current UI language; re-renders on language change. */
export function useFormat(): Formatters {
  const { i18n } = useTranslation();
  const language: Language = i18n.language === "en" ? "en" : "sr";
  return createFormatters(language);
}
