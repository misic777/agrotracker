import { useState } from "react";
import { parseDecimal } from "../../lib/format";
import { completeLine, toMinor } from "../../lib/money";
import type { Money } from "../../lib/types";

export type LineField = "quantity" | "unitPrice" | "total";

export interface LineTexts {
  quantity: string;
  unitPrice: string;
  total: string;
}

/** Parsed value of one input: missing, a valid number, or invalid text. */
type Parsed =
  { state: "empty" } | { state: "ok"; value: number } | { state: "invalid" };

function parse(text: string): Parsed {
  if (text.trim() === "") return { state: "empty" };
  const value = parseDecimal(text);
  return value === undefined || value < 0
    ? { state: "invalid" }
    : { state: "ok", value };
}

/**
 * "Enter any two of three": quantity, price per unit and total.
 *
 * The two fields the user edited most recently are inputs; the third one is
 * computed from them. Typing into the computed field turns it into an input
 * and the least recently edited field becomes the computed one instead.
 */
export function useLineAmounts(
  initial: LineTexts,
  initialInputs: [LineField, LineField] = ["quantity", "unitPrice"],
) {
  const [texts, setTexts] = useState(initial);
  // Most recently edited last.
  const [order, setOrder] = useState<LineField[]>(initialInputs);

  const inputs = order.slice(-2);
  const computed = (["total", "unitPrice", "quantity"] as const).find(
    (f) => !inputs.includes(f),
  )!;

  const parsed = {
    quantity: computed === "quantity" ? null : parse(texts.quantity),
    unitPrice: computed === "unitPrice" ? null : parse(texts.unitPrice),
    total: computed === "total" ? null : parse(texts.total),
  };
  const invalid = (f: LineField) => parsed[f]?.state === "invalid";
  const value = (f: LineField) => {
    const p = parsed[f];
    return p?.state === "ok" ? p.value : undefined;
  };

  const quantity = value("quantity");
  const unitPrice =
    value("unitPrice") !== undefined ? toMinor(value("unitPrice")!) : undefined;
  const total =
    value("total") !== undefined ? toMinor(value("total")!) : undefined;

  const line = completeLine({ quantity, unitPrice, total });
  const resolved: {
    quantity?: number;
    unitPrice?: Money;
    total?: Money;
  } = line
    ? { ...line, quantity: Math.round(line.quantity * 1000) / 1000 }
    : { quantity, unitPrice, total };

  function set(field: LineField, text: string) {
    setTexts((t) => ({ ...t, [field]: text }));
    setOrder((o) => [...o.filter((f) => f !== field), field]);
  }

  return {
    texts,
    computed,
    /** True when the computed field has a value to show. */
    hasComputed: line !== null,
    resolved,
    invalid,
    set,
  };
}
