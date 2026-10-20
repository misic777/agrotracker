import { describe, expect, it } from "vitest";
import { decideAccess } from "./access";

const pending = { isPending: true, isError: false, data: undefined };
const none = { isPending: false, isError: false, data: null };
const loaded = { isPending: false, isError: false, data: { id: "h1" } };
const failed = { isPending: false, isError: true, data: undefined };

describe("decideAccess", () => {
  it("lets the demo in without a household", () => {
    expect(decideAccess("demo", pending)).toBe("allow");
  });

  it("waits while the session is being checked", () => {
    expect(decideAccess("loading", pending)).toBe("wait");
  });

  it("sends visitors to the login page", () => {
    expect(decideAccess("signedOut", pending)).toBe("login");
  });

  it("waits for the household after signing in", () => {
    expect(decideAccess("signedIn", pending)).toBe("wait");
  });

  it("asks to create or join a household when there is none", () => {
    expect(decideAccess("signedIn", none)).toBe("setup");
  });

  it("lets members in", () => {
    expect(decideAccess("signedIn", loaded)).toBe("allow");
  });

  it("reports when the household can't be loaded", () => {
    expect(decideAccess("signedIn", failed)).toBe("error");
  });
});
