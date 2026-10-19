import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLineAmounts } from "./useLineAmounts";

const empty = { quantity: "", unitPrice: "", total: "" };

describe("useLineAmounts", () => {
  it("computes the total from quantity and unit price by default", () => {
    const { result } = renderHook(() =>
      useLineAmounts({ quantity: "200", unitPrice: "150", total: "" }),
    );
    expect(result.current.computed).toBe("total");
    expect(result.current.resolved.total).toBe(3000000); // 30.000,00 RSD
  });

  it("reads numbers typed in Serbian style", () => {
    const { result } = renderHook(() =>
      useLineAmounts({ quantity: "1.000", unitPrice: "2,50", total: "" }),
    );
    expect(result.current.resolved.total).toBe(250000); // 2.500,00 RSD
  });

  it("computes the field that was not edited most recently", () => {
    const { result } = renderHook(() => useLineAmounts(empty));

    act(() => result.current.set("quantity", "200"));
    act(() => result.current.set("total", "30.000"));

    // Edited: quantity, total -> unit price is computed.
    expect(result.current.computed).toBe("unitPrice");
    expect(result.current.resolved.unitPrice).toBe(15000); // 150,00 RSD

    act(() => result.current.set("unitPrice", "100"));

    // Now total and unit price are the latest edits -> quantity is computed.
    expect(result.current.computed).toBe("quantity");
    expect(result.current.resolved.quantity).toBe(300);
  });

  it("rounds a computed quantity to three decimals", () => {
    const { result } = renderHook(() =>
      useLineAmounts({ quantity: "", unitPrice: "3", total: "10" }, [
        "unitPrice",
        "total",
      ]),
    );
    expect(result.current.resolved.quantity).toBe(3.333);
  });

  it("flags invalid or negative input and computes nothing", () => {
    const { result } = renderHook(() =>
      useLineAmounts({ quantity: "abc", unitPrice: "-5", total: "" }),
    );
    expect(result.current.invalid("quantity")).toBe(true);
    expect(result.current.invalid("unitPrice")).toBe(true);
    expect(result.current.hasComputed).toBe(false);
  });
});
