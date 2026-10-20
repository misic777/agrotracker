import { describe, expect, it } from "vitest";
import {
  formatInviteCode,
  isPlausibleInviteCode,
  normalizeInviteCode,
} from "./inviteCode";

describe("invite codes", () => {
  it("formats a code in groups of four", () => {
    expect(formatInviteCode("A1B2C3D4E5F6")).toBe("A1B2-C3D4-E5F6");
  });

  it("normalizes what people type", () => {
    expect(normalizeInviteCode(" a1b2-c3d4 e5f6 ")).toBe("A1B2C3D4E5F6");
  });

  it("accepts only 12 hex characters", () => {
    expect(isPlausibleInviteCode("a1b2-c3d4-e5f6")).toBe(true);
    expect(isPlausibleInviteCode("A1B2-C3D4")).toBe(false);
    expect(isPlausibleInviteCode("ZZZZ-ZZZZ-ZZZZ")).toBe(false);
  });
});
