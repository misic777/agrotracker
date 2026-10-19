import { beforeEach, describe, expect, it } from "vitest";
import { appData, parcel } from "../test/factories";
import { emptyData, loadData, parseBackup, saveData } from "./localStore";

const KEY = "agrotracker.data";

describe("loadData / saveData", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty when nothing is stored", () => {
    expect(loadData()).toEqual({ status: "empty", data: emptyData() });
  });

  it("reads back what was saved", () => {
    const data = appData({ parcels: [parcel({ id: "p1" })] });
    saveData(data);
    expect(loadData()).toEqual({ status: "ok", data });
  });

  it("reports unreadable data and keeps the raw value", () => {
    localStorage.setItem(KEY, "{not json");
    const result = loadData();
    expect(result.status).toBe("corrupted");
    expect(result.data).toEqual(emptyData());
    expect(result.status === "corrupted" && result.raw).toBe("{not json");
  });

  it("treats valid JSON of the wrong shape as corrupted", () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, parcels: [] }));
    expect(loadData().status).toBe("corrupted");
  });
});

describe("parseBackup", () => {
  it("accepts an exported file", () => {
    const data = appData({ parcels: [parcel({ id: "p1" })] });
    expect(parseBackup(JSON.stringify(data))).toEqual(data);
  });

  it.each([
    ["not JSON", "hello"],
    ["another JSON file", JSON.stringify({ hello: "world" })],
    ["a list", "[]"],
    ["an unknown version", JSON.stringify({ ...appData(), version: 2 })],
    [
      "an item without an id",
      JSON.stringify(appData({ parcels: [{ name: "x" } as never] })),
    ],
  ])("rejects %s", (_, text) => {
    expect(parseBackup(text)).toBeNull();
  });
});
