import { describe, expect, it } from "vitest";
import { householdErrorKey } from "./household";

describe("householdErrorKey", () => {
  it("maps database error codes to translation keys", () => {
    expect(householdErrorKey({ message: "invalid_code" })).toBe(
      "household.errors.invalid_code",
    );
    expect(householdErrorKey({ message: "already_member" })).toBe(
      "household.errors.already_member",
    );
  });

  it("falls back to a generic message for anything else", () => {
    expect(householdErrorKey(new TypeError("Failed to fetch"))).toBe(
      "household.errors.generic",
    );
    expect(householdErrorKey(undefined)).toBe("household.errors.generic");
  });
});
