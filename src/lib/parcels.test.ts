import { describe, expect, it } from "vitest";
import { parcel } from "../test/factories";
import {
  canonicalMunicipality,
  findDuplicateParcel,
  matchesParcelSearch,
  normalizeKey,
} from "./parcels";

describe("normalizeKey", () => {
  it("ignores case, extra spaces and Serbian diacritics", () => {
    expect(normalizeKey("  PAČIR  ")).toBe("pacir");
    expect(normalizeKey("Ćuprija   Šid Žabalj")).toBe("cuprija sid zabalj");
  });

  it("writes đ as dj, the way people type it without diacritics", () => {
    expect(normalizeKey("Đurđevo")).toBe("djurdjevo");
  });
});

describe("findDuplicateParcel", () => {
  const parcels = [
    parcel({ id: "p1", number: "1243/2", municipality: "Pačir" }),
    parcel({ id: "p2", number: "2871", municipality: "Njegoševo" }),
  ];

  it("finds the same number in the same municipality", () => {
    expect(findDuplicateParcel(parcels, "1243 / 2", "pacir")?.id).toBe("p1");
  });

  it("allows the same number in another municipality", () => {
    expect(findDuplicateParcel(parcels, "1243/2", "Njegoševo")).toBeUndefined();
  });

  it("does not report a parcel as a duplicate of itself while editing", () => {
    expect(
      findDuplicateParcel(parcels, "1243/2", "Pačir", "p1"),
    ).toBeUndefined();
  });
});

describe("matchesParcelSearch", () => {
  const p = parcel({ id: "p1", name: "Kod bunara", number: "1243/2" });

  it("matches by name, without diacritics or case", () => {
    expect(matchesParcelSearch(p, "BUNAR")).toBe(true);
  });

  it("matches by parcel number", () => {
    expect(matchesParcelSearch(p, "1243")).toBe(true);
  });

  it("matches everything for an empty query", () => {
    expect(matchesParcelSearch(p, "  ")).toBe(true);
  });

  it("does not match unrelated text", () => {
    expect(matchesParcelSearch(p, "njiva")).toBe(false);
  });
});

describe("canonicalMunicipality", () => {
  it("reuses the spelling that is already stored", () => {
    expect(canonicalMunicipality("pacir ", ["Pačir", "Njegoševo"])).toBe(
      "Pačir",
    );
  });

  it("keeps a new municipality as typed, trimmed", () => {
    expect(canonicalMunicipality(" Čantavir ", ["Pačir"])).toBe("Čantavir");
  });
});
