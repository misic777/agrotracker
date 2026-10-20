import { describe, expect, it } from "vitest";
import { detectLanguage } from ".";

describe("detectLanguage", () => {
  it("uses Serbian for Serbian and neighbouring languages", () => {
    expect(detectLanguage(["sr-Latn-RS", "en"])).toBe("sr");
    expect(detectLanguage(["hr-HR"])).toBe("sr");
    expect(detectLanguage(["en-US", "bs"])).toBe("sr");
  });

  it("uses English for everyone else", () => {
    expect(detectLanguage(["en-GB"])).toBe("en");
    expect(detectLanguage(["de-DE", "fr"])).toBe("en");
  });

  it("falls back to Serbian when the browser says nothing", () => {
    expect(detectLanguage([])).toBe("sr");
  });
});
